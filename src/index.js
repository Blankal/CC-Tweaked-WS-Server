// WebSocket Server intended for hosting on a Pi device for lightweight messaging 
// between clients for a Minecraft CC:Tweaked server

import WebSocket, { WebSocketServer } from "ws";
import { registerClient, tunnelMessage } from "./serverUtils.js";

const PORT = 8080; URL = `ws://localhost:${PORT}`;
const wss = new WebSocketServer({ port: PORT });
const clients = new Map();

console.log(`Server running on ws://localhost:${PORT}`);

wss.on("connection", (ws) => {
    console.log("New client connected (unregistered)");

    ws.on("message", (message) => {
        console.log(`Recieved message: ${message} from client with ID: ${ws.id}`);

        const parsedMessage = JSON.parse(message);
        if (parsedMessage.PROTOCOL === "REGISTER")
        {
            registerClient(clients, ws, parsedMessage);
        }
        else if (parsedMessage.PROTOCOL === "TUNNEL_MESSAGE")
        {
            tunnelMessage(clients, ws, parsedMessage)
        }
        else if (parsedMessage.PROTOCOL === "SERVER_BROADCAST")
        {
            broadcastToClients(clients, parsedMessage);
        }

    })

    ws.on("close", () => {
        console.log(`Client with ID ${ws.id} disconnected`);
        clients.delete(ws)
    })
})