import React, { useRef, useState } from "react";
import { Box, Card, CardContent, Typography, AppBar, Toolbar, Container, Dialog, DialogTitle, DialogContent, DialogActions, Button, List, ListItem, ListItemText, ListItemSecondaryAction } from '@mui/material';
import io from "socket.io-client";

const SIGNALING_SERVER_URL = "http://localhost:4000";

type ClientInfo = { clientId: string, username: string };

function App() {
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const socketRef = useRef<any>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const [hostId] = useState(() => `host_${Math.random().toString(36).substr(2, 9)}`);
  const [clients, setClients] = useState<ClientInfo[]>([]);
  const [callingClient, setCallingClient] = useState<ClientInfo | null>(null);
  const [callStatus, setCallStatus] = useState<Record<string, 'idle' | 'calling' | 'connected' | 'failed' | 'accepted'>>({});

  React.useEffect(() => {
    socketRef.current = io(SIGNALING_SERVER_URL);
    socketRef.current.emit("join", { clientId: hostId, role: "host" });

    socketRef.current.on("client-list", (clientList: ClientInfo[]) => {
      setClients(clientList);
    });

    socketRef.current.on("client-join-request", ({ clientId, username }: { clientId: string, username: string }) => {
      setClients(prev => {
        if (prev.some(c => c.clientId === clientId)) return prev;
        return [...prev, { clientId, username }];
      });
    });

    socketRef.current.on("client-disconnected", ({ clientId }: { clientId: string }) => {
      setClients(prev => prev.filter(c => c.clientId !== clientId));
    });

    socketRef.current.on("offer", async ({ from, offer }: { from: string; offer: RTCSessionDescriptionInit }) => {
      if (!peerConnectionRef.current) createPeerConnection();
      await peerConnectionRef.current!.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await peerConnectionRef.current!.createAnswer();
      await peerConnectionRef.current!.setLocalDescription(answer);
      socketRef.current.emit("answer", { to: from, from: hostId, answer });
    });

    socketRef.current.on("ice-candidate", async ({ from, candidate }: { from: string; candidate: RTCIceCandidateInit }) => {
      if (peerConnectionRef.current) {
        await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
      }
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  // Update call status when clients list changes (remove status for disconnected clients)
  React.useEffect(() => {
    setCallStatus(prev => {
      const updated: typeof prev = {};
      clients.forEach(c => {
        updated[c.clientId] = prev[c.clientId] || 'idle';
      });
      return updated;
    });
  }, [clients]);

  // Listen for signaling events to update call status
  React.useEffect(() => {
    if (!socketRef.current) return;
    // When answer received, set to connected
    socketRef.current.on('answer', ({ from }: { from: string }) => {
      setCallStatus(prev => ({ ...prev, [from]: 'connected' }));
    });
    // When client accepts the call, set to accepted and send offer
    socketRef.current.on('call-accepted', async ({ from }: { from: string }) => {
      setCallStatus(prev => ({ ...prev, [from]: 'accepted' }));
      // Only send offer after client accepted
      if (clients.some(c => c.clientId === from)) {
        if (!peerConnectionRef.current) createPeerConnection();
        // Add tracks if needed (e.g., for screen sharing from host)
        const offer = await peerConnectionRef.current!.createOffer();
        await peerConnectionRef.current!.setLocalDescription(offer);
        socketRef.current.emit("offer", { to: from, from: hostId, offer });
      }
    });
    // When client disconnects, reset status
    socketRef.current.on('client-disconnected', ({ clientId }: { clientId: string }) => {
      setCallStatus(prev => ({ ...prev, [clientId]: 'idle' }));
    });
    // Optionally, listen for call failure or end events here
    return () => {
      socketRef.current?.off('answer');
      socketRef.current?.off('call-accepted');
      socketRef.current?.off('client-disconnected');
    };
  }, []);

  const createPeerConnection = () => {
    const pc = new RTCPeerConnection();
    peerConnectionRef.current = pc;
    pc.ontrack = (event) => {
      setRemoteStream(event.streams[0]);
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
      // Mark as accepted when remote stream is received
      if (callingClient) {
        setCallStatus(prev => ({ ...prev, [callingClient.clientId]: 'accepted' }));
      }
    };
    pc.onicecandidate = (event) => {
      if (event.candidate && callingClient) {
        socketRef.current.emit("ice-candidate", { to: callingClient.clientId, from: hostId, candidate: event.candidate });
      }
    };
    return pc;
  };

  // Cancel call handler
  const handleCancelCall = (client: ClientInfo) => {
    setCallStatus(prev => ({ ...prev, [client.clientId]: 'idle' }));
    setCallingClient(null);
    // Optionally, send a cancel event to client (implement on client side if needed)
    socketRef.current.emit('cancel-call', { to: client.clientId, from: hostId });
    // Optionally, close peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    setRemoteStream(null);
  };

  const handleCall = (client: ClientInfo) => {
    if (callStatus[client.clientId] === 'calling' || callStatus[client.clientId] === 'connected') return;
    setCallingClient(client);
    setCallStatus(prev => ({ ...prev, [client.clientId]: 'calling' }));
    socketRef.current.emit("call-client", { to: client.clientId, from: hostId });
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Host Application
          </Typography>
        </Toolbar>
      </AppBar>
      <Container maxWidth="sm" sx={{ mt: 4 }}>
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h5" gutterBottom>
              Connected Clients
            </Typography>
            <List>
              {clients.length === 0 && <Typography color="text.secondary">No clients connected.</Typography>}
              {clients.map(client => (
                <ListItem key={client.clientId} divider>
                  <ListItemText primary={client.username} secondary={client.clientId} />
                  <ListItemSecondaryAction>
                    {callStatus[client.clientId] === 'calling' ? (
                      <>
                        <Button variant="contained" color="primary" disabled>
                          Calling...
                        </Button>
                        <Button variant="outlined" color="secondary" sx={{ ml: 1 }} onClick={() => handleCancelCall(client)}>
                          Cancel
                        </Button>
                      </>
                    ) : callStatus[client.clientId] === 'accepted' || callStatus[client.clientId] === 'connected' ? (
                      <>
                        <Button variant="contained" color="success" disabled>
                          {callStatus[client.clientId] === 'accepted' ? 'Accepted' : 'Connected'}
                        </Button>
                        <Button variant="outlined" color="error" sx={{ ml: 1 }} onClick={() => handleCancelCall(client)}>
                          Disconnect
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={() => handleCall(client)}
                        disabled={callStatus[client.clientId] === 'calling' || callStatus[client.clientId] === 'connected' || callStatus[client.clientId] === 'accepted'}
                      >
                        Call
                      </Button>
                    )}
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography variant="h5" gutterBottom>
              Screen Share View
            </Typography>
            <Box display="flex" flexDirection="column" alignItems="center">
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                style={{ width: 480, border: '1px solid #ccc', background: '#000', minHeight: 270 }}
              />
              {!remoteStream && (
                <Typography color="text.secondary" sx={{ mt: 2 }}>
                  Waiting for client to share screen...
                </Typography>
              )}
            </Box>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}

export default App;
