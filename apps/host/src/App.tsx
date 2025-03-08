import React, { useRef, useState } from "react";
import { Button, Card } from "@webrtc-project/ui-components";
import { RequestManager } from "./connection/requestManager";

const CLIENT_URL = "http://localhost:3001";
const CLIENT_ORIGIN = "http://localhost:3001";

function App() {
  const requestManager = useRef<RequestManager | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [connected, setConnected] = useState(false);
  const [response, setResponse] = useState<string>("");

  const initConnection = () => {
    if (iframeRef.current?.contentWindow) {
      requestManager.current = new RequestManager(CLIENT_ORIGIN);
      requestManager.current.setClientWindow(iframeRef.current.contentWindow);
      setConnected(true);
    }
  };

  const sendRequest = async () => {
    if (!requestManager.current) return;

    try {
      const result = await requestManager.current.sendRequest("PING", { message: "Hello from host!" });
      setResponse(JSON.stringify(result, null, 2));
    } catch (error) {
      console.error("Request failed:", error);
      setResponse(`Error: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  return (
    <div className="container">
      <h1>Host Application</h1>

      <Card title="Client Connection">
        <div className="iframe-container">
          <iframe
            ref={iframeRef}
            src={CLIENT_URL}
            title="Client Application"
            width="100%"
            height="300"
          />
        </div>

        <div className="controls">
          <Button
            onClick={initConnection}
            {...{ disabled: connected } as any}
          >
            Connect to Client
          </Button>

          <Button
            onClick={sendRequest}
            {...{ disabled: !connected } as any}

            variant="secondary"
          >
            Send Request
          </Button>
        </div>
      </Card>

      {response && (
        <Card title="Response">
          <pre>{response}</pre>
        </Card>
      )}
    </div>
  );
}

export default App;
