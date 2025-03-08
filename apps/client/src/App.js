import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { Card } from "@webrtc-project/ui-components";
import { ConnectionHandler } from "./connection/connectionHandler";
// Assuming the host is running on this URL
const HOST_ORIGIN = "http://localhost:3000";
function App() {
    const [logs, setLogs] = useState([]);
    const addLog = (message) => {
        setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
    };
    useEffect(() => {
        const connectionHandler = new ConnectionHandler(HOST_ORIGIN);
        // Register a handler for PING messages
        connectionHandler.registerHandler("PING", async (payload) => {
            addLog(`Received PING: ${JSON.stringify(payload)}`);
            // Simulate some processing time
            await new Promise(resolve => setTimeout(resolve, 500));
            return {
                message: "Hello from client!",
                receivedAt: new Date().toISOString(),
                echoedData: payload
            };
        });
        addLog("Client started and listening for requests");
        return () => {
            connectionHandler.cleanup();
        };
    }, []);
    return (_jsxs("div", { className: "container", children: [_jsx("h1", { children: "Client Application" }), _jsx(Card, { title: "Communication Logs", children: _jsx("div", { className: "logs", children: logs.length === 0 ? (_jsx("p", { children: "Waiting for messages..." })) : (_jsx("ul", { children: logs.map((log, index) => (_jsx("li", { children: log }, index))) })) }) })] }));
}
export default App;
