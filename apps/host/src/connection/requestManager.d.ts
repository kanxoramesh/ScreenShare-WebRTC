export declare class RequestManager {
    private clientOrigin;
    private clientWindow?;
    private pendingRequests;
    constructor(clientOrigin: string);
    setClientWindow(window: Window): void;
    private handleMessage;
    sendRequest(type: string, payload: any): Promise<any>;
    cleanup(): void;
}
