import { CommunicationProtocol } from "@webrtc-project/communication";
export class ConnectionHandler {
    handlers = new Map();
    hostOrigin;
    constructor(hostOrigin) {
        this.hostOrigin = hostOrigin;
        window.addEventListener("message", this.handleMessage);
    }
    registerHandler(type, handler) {
        this.handlers.set(type, handler);
    }
    handleMessage = async (event) => {
        // Validate origin for security
        if (event.origin !== this.hostOrigin)
            return;
        const message = event.data;
        const handler = this.handlers.get(message.type);
        if (handler) {
            try {
                const result = await handler(message.payload);
                const response = CommunicationProtocol.createResponse(message, result, "success");
                event.source?.postMessage(response, { targetOrigin: this.hostOrigin });
            }
            catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                const response = CommunicationProtocol.createResponse(message, { error: errorMessage }, "error");
                event.source?.postMessage(response, { targetOrigin: this.hostOrigin });
            }
        }
        else {
            console.warn(`No handler registered for message type: ${message.type}`);
            const response = CommunicationProtocol.createResponse(message, { error: `No handler for message type: ${message.type}` }, "error");
            event.source?.postMessage(response, { targetOrigin: this.hostOrigin });
        }
    };
    cleanup() {
        window.removeEventListener("message", this.handleMessage);
    }
}
