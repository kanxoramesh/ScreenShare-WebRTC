import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useRef, useState } from "react";
import { Button, Card } from "@webrtc-project/ui-components";
import { RequestManager } from "./connection/requestManager";
const CLIENT_URL = "http://localhost:3001";
const CLIENT_ORIGIN = "http://localhost:3001";
function App() {
    const requestManager = useRef(null);
    const iframeRef = useRef(null);
    const [connected, setConnected] = useState(false);
    const [response, setResponse] = useState("");
    const initConnection = () => {
        if (iframeRef.current?.contentWindow) {
            requestManager.current = new RequestManager(CLIENT_ORIGIN);
            requestManager.current.setClientWindow(iframeRef.current.contentWindow);
            setConnected(true);
        }
    };
    const sendRequest = async () => {
        if (!requestManager.current)
            return;
        try {
            const result = await requestManager.current.sendRequest("PING", { message: "Hello from host!" });
            setResponse(JSON.stringify(result, null, 2));
        }
        catch (error) {
            console.error("Request failed:", error);
            setResponse(`Error: ${error instanceof Error ? error.message : String(error)}`);
        }
    };
    return (_jsxs("div", { className: "container", children: [_jsx("h1", { children: "Host Application" }), _jsxs(Card, { title: "Client Connection", children: [_jsx("div", { className: "iframe-container", children: _jsx("iframe", { ref: iframeRef, src: CLIENT_URL, title: "Client Application", width: "100%", height: "300" }) }), _jsxs("div", { className: "controls", children: [_jsx(Button, { onClick: initConnection, disabled: connected, children: "Connect to Client" }), _jsx(Button, { onClick: sendRequest, disabled: !connected, variant: "secondary", children: "Send Request" })] })] }), response && (_jsx(Card, { title: "Response", children: _jsx("pre", { children: response }) }))] }));
}
export default App;
