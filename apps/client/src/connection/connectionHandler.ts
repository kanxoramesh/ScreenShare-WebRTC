import { RequestMessage } from "@webrtc-project/shared-types";
import { CommunicationProtocol } from "@webrtc-project/communication";

export class ConnectionHandler {
  private handlers = new Map<string, (payload: any) => Promise<any>>();
  private hostOrigin: string;

  constructor(hostOrigin: string) {
    this.hostOrigin = hostOrigin;
    window.addEventListener("message", this.handleMessage);
  }

  registerHandler(type: string, handler: (payload: any) => Promise<any>) {
    this.handlers.set(type, handler);
  }

  private handleMessage = async (event: MessageEvent) => {
    // Validate origin for security
    if (event.origin !== this.hostOrigin) return;

    const message = event.data as RequestMessage;
    const handler = this.handlers.get(message.type);

    if (handler) {
      try {
        const result = await handler(message.payload);
        const response = CommunicationProtocol.createResponse(message, result, "success");
        event.source?.postMessage(response, { targetOrigin: this.hostOrigin } as WindowPostMessageOptions);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const response = CommunicationProtocol.createResponse(message, { error: errorMessage }, "error");
        event.source?.postMessage(response, { targetOrigin: this.hostOrigin } as WindowPostMessageOptions);
      }
    } else {
      console.warn(`No handler registered for message type: ${message.type}`);
      const response = CommunicationProtocol.createResponse(
        message, 
        { error: `No handler for message type: ${message.type}` }, 
        "error"
      );
      event.source?.postMessage(response, { targetOrigin: this.hostOrigin } as WindowPostMessageOptions);
    }
  }

  cleanup() {
    window.removeEventListener("message", this.handleMessage);
  }
}
