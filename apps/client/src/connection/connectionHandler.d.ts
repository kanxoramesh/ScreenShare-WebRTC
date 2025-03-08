export declare class ConnectionHandler {
    private handlers;
    private hostOrigin;
    constructor(hostOrigin: string);
    registerHandler(type: string, handler: (payload: any) => Promise<any>): void;
    private handleMessage;
    cleanup(): void;
}
