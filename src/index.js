// WebSocket Server intended for hosting on a Pi device for lightweight messaging 
// between clients for a Minecraft CC:Tweaked server

import WebSocket, { WebSocketServer } from "ws";
import { registerClient, tunnelMessage, broadcastToClients } from "./serverUtils.js";

import config from "./config.json" assert { type: "jsonc" };  // load config
const { SERVER_PORT, PING_INTERVAL, PING_TIMEOUT } = config;  // Grab specific config values

const PORT = SERVER_PORT; URL = `ws://localhost:${PORT}`;
const wss = new WebSocketServer({ port: PORT });
const clients = new Map();  // Holds clients and their info such as ID and connection ping status

console.log(`%cINFO: Socket server running on ws://localhost:${PORT}`, "color: green; font-style: italic");
console.log("%cWARN: Please note that the tailscale proxy server must A. be running and B. may have a different host address/port than the host. \nPlease update the client config accordingly.", "color: yellow; font-style: italic");

// Interval for checking time and timeouts for clients (for connection health and scheduling)
setInterval(() => {
    const now = Date.now();
    console.log("%cINFO: Running scheduled client health check...", "color: green; font-style: italic");
    console.log(`%cINFO: Current client list: ${[...clients.values()].map(info => info.id).join(", ")}`, "color:green; font-style: italic");

    for (let [clientWs, info] of clients.entries())
    {
        if (now - info.lastPing > PING_INTERVAL)
        {
            pingClient(clients, info.id);  // Ping client to check connection health
        }
        if (now - info.lastPing > PING_TIMEOUT)  // Kill connection if pong does not come back in time
        {
            console.log(`%cDISCONNECT: Client with ID of ${info.id} has timed out - Terminating connection`, "color: red; font-style: italic");
            clientWs.terminate();
            clients.delete(clientWs);
        }
    }
}, PING_INTERVAL)

// Handle new connections and incoming messages
wss.on("connection", (ws) => {
    console.log("%cCONNECT: New client connected (unregistered)", "color: green; font-style: italic");

    ws.on("message", (message) => {
        console.log(`%cINFO: Recieved message: ${message} from client with ID: ${ws.id}`, "color:green; font-style: italic");

        const parsedMessage = JSON.parse(message);
        if (parsedMessage.PROTOCOL === "REGISTER")
        {
            registerClient(clients, ws, parsedMessage);
        }
        else if (parsedMessage.PROTOCOL === "GET_CLIENTS")
        {
            getClients(clients, ws);
        }
        else if (parsedMessage.PROTOCOL === "TUNNEL_MESSAGE")
        {
            tunnelMessage(clients, ws, parsedMessage)
        }
        else if (parsedMessage.PROTOCOL === "SERVER_BROADCAST")
        {
            broadcastToClients(clients, parsedMessage);
        }
        else
        {
            console.log(`%cWARN: Invalid protocol recieved from client with ID ${ws.id} - Message: ${message}`, 
                "color: yellow; font-style: italic");
        }

    })

    ws.on("close", () => {
        console.log(`%cDISCONNECT: Client with ID ${ws.id} disconnected`, "color: red; font-style: italic");
        clients.delete(ws)
    })
})