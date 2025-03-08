export interface RequestMessage {
  type: string;
  payload: any;
  requestId: string;
}

export interface ResponseMessage {
  type: string;
  payload: any;
  requestId: string;
  status: "success" | "error";
}
