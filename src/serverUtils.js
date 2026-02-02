// File for server-side utils/response components

import WebSocket, { WebSocketServer } from "ws";

/*
    Function to register a new client with a specified ID (provided by the client)
    @param clients - Map of connected clients
    @param ws - WebSocket connection of the client
    @param request - Request object (JSON String) containing registration and contact info
    Expected message format:

    {
        "PROTOCOL": "REGISTER",
        "PAYLOAD":
        {
            "MESSAGE": "Client_ID"  // Can be any string except empty or "SERVER"
        }}
    }

    Outgoing message format (on success):
    {
        "PROTOCOL: "REQUEST_ACCEPT",
        "PAYLOAD":
        {
            "MESSAGE": "REGISTRATION_ACCEPT"  // Type of success message
        }
    }
    Outgoing message format (on failure):
    {
        "PROTOCOL": "REQUEST_DENIED",
        "PAYLOAD":
        {
            "MESSAGE": "ID_ALREADY_REGISTERED"  // Denial reason
        }
    }
*/
export function registerClient(clients, ws, request)
{
    if (message.PROTOCOL === "REGISTER")
    {
        const id = request.PAYLOAD.MESSAGE;
        ws.id = id;

        // Duplicate checking
        for (let [clientWs, info] of clients.entries())
        {
            if (info.id === id)
            {
                console.log(`Attempt to register with duplicate ID: ${id}`);
                ws.send(JSON.stringify(
                    {
                        "PROTOCOL": "REQUEST_DENIED",
                        "PAYLOAD":
                        {
                            "MESSAGE": "ID_ALREADY_REGISTERED"
                        }
                    }
                ))
                return;
            }
        }
        clients.set(ws, {id: id});
        console.log(`New client registered with ID: ${id}`);
    }
}

/*
    Function to broadcast a message to all connected clients
    @param clients - Map of connected clients and their info
    @param message  -JSON/String to broadcast to all clients
    Expected message format:
    {
        "PROTOCOL": "BROADCAST",
        "PAYLOAD":
        {
            MESSAGE: "message_content"
        }
    }
    
    Outgoing message format:
    {
        "PROTOCOL": "SERVER_BROADCAST",
        "PAYLOAD":
        {
            "MESSAGE": message_content
        }
    }
*/
export function broadcastToClients(clients, message)
{
    clients.array.forEach(element => {
        sendToClient(element, JSON.stringify(message));
    });
}

/*
    Function to tunnel a message from one client to another
    @param clients - Map of connected clients and their info
    @param senderWs - WebSocket connection of the sender client
    @param request - Request object (JSON String) containing target ID and message for client
    Expected message format:
    {
        "PROTOCOL": "TUNNEL_MESSAGE",
        "PAYLOAD":
        {
            "TARGET_ID": "target_client_id",
            "MESSAGE": "message_content"
        }
    }

    Outgoing message format:
    {
        "PROTOCOL": "SERVER_TUNNELE_MESSAGE",
        "PAYLOAD":
        {
            "SENDER_ID": "sender_client_id",
            "MESSAGE": "message_content"
        }
    }
*/
export function tunnelMessage(clients, senderWs, request)
{
    if (request.PROTOCOL === "TUNNEL_MESSAGE")
    {
        const targetId = request.PAYLOAD.TARGET_ID;
        const messageContent = request.PAYLOAD.MESSAGE;
        for (let [clientWs, info] of clients.entries())
        {
            if (info.id === targetId)
            {
                const message = {
                    "PROTOCOL": "SERVER_TUNNELED_MESSAGE",
                    "PAYLOAD":
                    {
                        "SENDER_ID": senderWs.id,
                        "MESSAGE": messageContent
                    }
                }
                sendToClient(clientWs, JSON.stringify(message));
                break;
            }
        }
    }
}