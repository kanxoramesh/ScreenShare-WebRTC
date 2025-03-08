import { CommunicationProtocol } from "@webrtc-project/communication";
export class RequestManager {
    clientOrigin;
    clientWindow = null;
    pendingRequests = new Map();
    constructor(clientOrigin) {
        this.clientOrigin = clientOrigin;
        window.addEventListener("message", this.handleMessage);
    }
    setClientWindow(window) {
        this.clientWindow = window;
    }
    handleMessage = (event) => {
        // Validate origin for security
        if (event.origin !== this.clientOrigin)
            return;
        const message = event.data;
        // Check if this is a response to a pending request
        const pendingRequest = this.pendingRequests.get(message.requestId);
        if (pendingRequest) {
            if (message.status === "success") {
                pendingRequest.resolve(message.payload);
            }
            else {
                pendingRequest.reject(message.payload);
            }
            this.pendingRequests.delete(message.requestId);
        }
    };
    async sendRequest(type, payload) {
        if (!this.clientWindow) {
            throw new Error("Client window not set");
        }
        const request = CommunicationProtocol.createRequest(type, payload);
        return new Promise((resolve, reject) => {
            this.pendingRequests.set(request.requestId, { resolve, reject });
            this.clientWindow?.postMessage(request, this.clientOrigin);
            // Set timeout to clean up pending requests
            setTimeout(() => {
                if (this.pendingRequests.has(request.requestId)) {
                    this.pendingRequests.delete(request.requestId);
                    reject(new Error("Request timed out"));
                }
            }, 5000);
        });
    }
    cleanup() {
        window.removeEventListener("message", this.handleMessage);
    }
}
