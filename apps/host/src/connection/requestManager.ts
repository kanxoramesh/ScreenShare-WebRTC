import { RequestMessage, ResponseMessage } from "@webrtc-project/shared-types";
import { CommunicationProtocol } from "@webrtc-project/communication";

export class RequestManager {
  private clientWindow?: Window | null = null;
  private pendingRequests = new Map<string, {
    resolve: (value: any) => void;
    reject: (reason: any) => void;
  }>();

  constructor(private clientOrigin: string) {
    window.addEventListener("message", this.handleMessage);
  }

  setClientWindow(window: Window) {
    this.clientWindow = window;
  }

  private handleMessage = (event: MessageEvent) => {
    // Validate origin for security
    if (event.origin !== this.clientOrigin) return;

    const message = event.data as ResponseMessage;
    
    // Check if this is a response to a pending request
    const pendingRequest = this.pendingRequests.get(message.requestId);
    if (pendingRequest) {
      if (message.status === "success") {
        pendingRequest.resolve(message.payload);
      } else {
        pendingRequest.reject(message.payload);
      }
      this.pendingRequests.delete(message.requestId);
    }
  }

  async sendRequest(type: string, payload: any): Promise<any> {
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
