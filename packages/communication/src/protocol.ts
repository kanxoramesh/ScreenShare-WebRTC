import { RequestMessage, ResponseMessage } from "@webrtc-project/shared-types";

export class CommunicationProtocol {
  static createRequest(type: string, payload: any): RequestMessage {
    return {
      type,
      payload,
      requestId: Math.random().toString(36).substring(2, 9)
    };
  }

  static createResponse(request: RequestMessage, payload: any, status: "success" | "error" = "success"): ResponseMessage {
    return {
      type: `${request.type}_response`,
      payload,
      requestId: request.requestId,
      status
    };
  }
}
