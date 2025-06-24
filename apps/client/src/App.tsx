import React, { useEffect, useState } from "react";
import { Box, AppBar, Toolbar, Typography, Container } from '@mui/material';
import { ConnectionHandler } from "./connection/connectionHandler";
import io from "socket.io-client";
import { UsernameDialog } from './components/UsernameDialog';
import { IncomingCallDialog } from './components/IncomingCallDialog';
import { ScreenSharePanel } from './components/ScreenSharePanel';
import { LogsPanel } from './components/LogsPanel';

const HOST_ORIGIN = "http://localhost:3000";
const SIGNALING_SERVER_URL = "http://localhost:4000";

function App() {
  const [logs, setLogs] = useState<string[]>([]);
  const [screenSharing, setScreenSharing] = useState(false);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const localVideoRef = React.useRef<HTMLVideoElement>(null);
  const socketRef = React.useRef<any>(null);
  const peerConnectionRef = React.useRef<RTCPeerConnection | null>(null);
  const [clientId] = useState(() => `client_${Math.random().toString(36).substr(2, 9)}`);
  const [username, setUsername] = useState('');
  const [tempUsername, setTempUsername] = useState('');
  const [usernameDialogOpen, setUsernameDialogOpen] = useState(true);
  const [approved, setApproved] = useState(false);
  const [incomingCall, setIncomingCall] = useState(false);
  const [caller, setCaller] = useState<string | null>(null);
  const [connectedHost, setConnectedHost] = useState<string | null>(null);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  useEffect(() => {
    if (!username) return;
    const connectionHandler = new ConnectionHandler(HOST_ORIGIN);
    connectionHandler.registerHandler("PING", async (payload) => {
      addLog(`Received PING: ${JSON.stringify(payload)}`);
      await new Promise(resolve => setTimeout(resolve, 500));
      return {
        message: "Hello from client!",
        receivedAt: new Date().toISOString(),
        echoedData: payload
      };
    });
    addLog("Client started and listening for requests");
    socketRef.current = io(SIGNALING_SERVER_URL);
    socketRef.current.emit("join", { clientId, role: "client", username });
    socketRef.current.on("join-approved", () => {
      setApproved(true);
      setConnectedHost("Host"); // You can set the actual host name if available
      addLog("Host approved connection. You can now start screen sharing.");
    });
    socketRef.current.on("join-rejected", () => {
      setApproved(false);
      addLog("Host rejected the connection.");
    });
    socketRef.current.on("offer", async ({ from, offer }: { from: string; offer: RTCSessionDescriptionInit }) => {
      addLog(`Received offer from ${from}`);
      if (!peerConnectionRef.current) createPeerConnection();
      await peerConnectionRef.current!.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await peerConnectionRef.current!.createAnswer();
      await peerConnectionRef.current!.setLocalDescription(answer);
      socketRef.current.emit("answer", { to: from, from: clientId, answer });
    });
    socketRef.current.on("ice-candidate", async ({ from, candidate }: { from: string; candidate: RTCIceCandidateInit }) => {
      addLog(`Received ICE candidate from ${from}`);
      if (peerConnectionRef.current) {
        await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
      }
    });
    socketRef.current.on("call-client", ({ from }: { from: string }) => {
      setIncomingCall(true);
      setCaller(from);
      addLog("Host is calling you. Please accept to start screen share.");
    });
    return () => {
      connectionHandler.cleanup();
      socketRef.current?.disconnect();
    };
    // eslint-disable-next-line
  }, [username]);

  const createPeerConnection = () => {
    const pc = new RTCPeerConnection();
    peerConnectionRef.current = pc;
    pc.ontrack = (event) => {
      setRemoteStream(event.streams[0]);
    };
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socketRef.current.emit("ice-candidate", { to: "host", from: clientId, candidate: event.candidate });
      }
    };
    if (screenStream) {
      screenStream.getTracks().forEach((track: MediaStreamTrack) => pc.addTrack(track, screenStream));
    }
    return pc;
  };

  const startScreenShare = async () => {
    if (!approved) {
      addLog("Waiting for host approval before starting screen share.");
      return;
    }
    try {
      const stream = await (navigator.mediaDevices as any).getDisplayMedia({ video: true });
      setScreenStream(stream);
      setScreenSharing(true);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      if (!peerConnectionRef.current) createPeerConnection();
      stream.getTracks().forEach((track: MediaStreamTrack) => peerConnectionRef.current!.addTrack(track, stream));
      const offer = await peerConnectionRef.current!.createOffer();
      await peerConnectionRef.current!.setLocalDescription(offer);
      socketRef.current.emit("offer", { to: "host", from: clientId, offer });
      addLog("Screen sharing started and offer sent to host");
    } catch (err) {
      addLog("Screen sharing failed: " + err);
    }
  };

  const stopScreenShare = () => {
    screenStream?.getTracks().forEach((track) => track.stop());
    setScreenStream(null);
    setScreenSharing(false);
    addLog("Screen sharing stopped");
  };

  const acceptCall = () => {
    setIncomingCall(false);
    setApproved(true);
    addLog("Accepted call from host. You can now start screen sharing.");
    if (socketRef.current && caller) {
      socketRef.current.emit("call-accepted", { to: caller, from: clientId });
    }
  };
  const rejectCall = () => {
    setIncomingCall(false);
    setApproved(false);
    addLog("Rejected call from host.");
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Client Application
          </Typography>
        </Toolbar>
      </AppBar>
      <UsernameDialog
        open={usernameDialogOpen}
        tempUsername={tempUsername}
        setTempUsername={setTempUsername}
        onJoin={() => {
          setUsername(tempUsername.trim());
          setUsernameDialogOpen(false);
        }}
      />
      <IncomingCallDialog
        open={incomingCall}
        onAccept={acceptCall}
        onReject={rejectCall}
      />
      <Container maxWidth="sm" sx={{ mt: 4 }}>
        <Typography variant="subtitle1" align="center" sx={{ mb: 2 }}>
          Your name: <b>{username}</b>
        </Typography>
        {connectedHost && (
          <Typography variant="subtitle1" align="center" sx={{ mb: 2 }}>
            Connected to: <b>{connectedHost}</b>
          </Typography>
        )}
        <ScreenSharePanel
          screenSharing={screenSharing}
          approved={approved}
          startScreenShare={startScreenShare}
          stopScreenShare={stopScreenShare}
          localVideoRef={localVideoRef}
        />
        <LogsPanel logs={logs} />
      </Container>
    </Box>
  );
}

export default App;
