import React, { useEffect, useState } from "react";
import { Card } from "@webrtc-project/ui-components";
import { ConnectionHandler } from "./connection/connectionHandler";

// Assuming the host is running on this URL
const HOST_ORIGIN = "http://localhost:3000";

function App() {
  const [logs, setLogs] = useState<string[]>([]);
  
  const addLog = (message: string) => {
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

  return (
    <div className="container">
      <h1>Client Application</h1>
      
      <Card title="Communication Logs">
        <div className="logs">
          {logs.length === 0 ? (
            <p>Waiting for messages...</p>
          ) : (
            <ul>
              {logs.map((log, index) => (
                <li key={index}>{log}</li>
              ))}
            </ul>
          )}
        </div>
      </Card>
    </div>
  );
}

export default App;
