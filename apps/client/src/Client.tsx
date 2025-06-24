import { Card } from '@webrtc-project/ui-components';
import React, { useEffect, useState, useRef } from 'react';
import io, { Socket } from 'socket.io-client';

interface Message {
    text: string;
    sender: 'local' | 'remote';
}

interface ActiveCall {
    userId: string;
    status: 'calling' | 'incoming' | 'connected';
    username?: string;
    offer?: RTCSessionDescriptionInit;
}

const Client: React.FC = () => {
    const [connected, setConnected] = useState(false);
    const [username, setUsername] = useState('');
    const [users, setUsers] = useState<string[]>([]);
    const [activeCall, setActiveCall] = useState<ActiveCall | null>(null);
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');

    const socketRef = useRef<Socket | null>(null);
    const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
    const localVideoRef = useRef<HTMLVideoElement | null>(null);
    const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
    const dataChannelRef = useRef<RTCDataChannel | null>(null);
    const [logs, setLogs] = useState<string[]>([]);

    const addLog = (message: string) => {
        setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);

    };

    useEffect(() => {
        socketRef.current = io('http://localhost:4000');

        socketRef.current.on('offer', handleReceiveOffer);
        socketRef.current.on('ice-candidate', handleReceiveICECandidate);
        socketRef.current.on('user-disconnected', handleUserDisconnected);

        return () => {
            localStream?.getTracks().forEach(track => track.stop());
            peerConnectionRef.current?.close();
            socketRef.current?.disconnect();
        };
    }, [username]);

    const startMedia = async (): Promise<MediaStream | null> => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
            setLocalStream(stream);
            if (localVideoRef.current) {
                localVideoRef.current.srcObject = stream;
            }
            return stream;
        } catch (error) {
            addLog(`Error accessing media devices: ${error}`);
            console.error('Error accessing media devices:', error);
            return null; // Explicitly return null instead of allowing undefined
        }
    };


    const handleJoin = async () => {
        if (username.trim()) {
            socketRef.current?.emit('join', { clientId: username, role: "client" });
            setConnected(true);
        }
    };
    const setupDataChannel = (channel: RTCDataChannel) => {
        channel.onopen = () => {
            console.log("Data channel opened");
            addLog(`Data channel opened`);

        };

        channel.onmessage = (event: MessageEvent) => {
            setMessages((prev) => [...prev, { text: event.data, sender: "remote" }]);
        };

        channel.onclose = () => {
            addLog(`Data channel closed`);
        };
    };

    const handleReceiveOffer = async (data: { offer: RTCSessionDescriptionInit; from: string; }) => {
        try {
            setActiveCall({ userId: data.from, status: 'incoming', username: data.from, offer: data.offer });
            addLog(`received offer "userId": ${data.from}, status: 'incoming', username: ${data.from}, offer: ${JSON.stringify(data.offer)} }`);
            acceptCall(data.offer, data.from)
        } catch (error) {
            console.error('Error handling offer:', error);
            addLog(`EError handling offer: ${error}`);

        }
    };

    const acceptCall = async (offer: RTCSessionDescriptionInit, from: string) => {
        try {
            addLog(`activeCall: ${JSON.stringify(activeCall)} }`);

            const configuration: RTCConfiguration = {
                iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
            };
            peerConnectionRef.current = new RTCPeerConnection(configuration);

            dataChannelRef.current = peerConnectionRef.current.createDataChannel('chat');
            setupDataChannel(dataChannelRef.current);
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
            setLocalStream(stream);
            if (localVideoRef.current) {
                localVideoRef.current.srcObject = stream;
            }
            addLog(`Tracks len ${stream?.getTracks().length}`)
            stream?.getTracks().forEach(track => peerConnectionRef.current?.addTrack(track, stream));
            addLog(`ice-candidate to from send: ${{ to: from, from: username }}`);
            peerConnectionRef.current.onicecandidate = (event) => {
                addLog(`onicecandidate: ${JSON.stringify(event.candidate)} }`);
                if (event.candidate) {
                    socketRef.current?.emit('ice-candidate', { to: from, from: username, candidate: event.candidate });
                }
            };
            await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(offer));
            const answer = await peerConnectionRef.current.createAnswer();
            await peerConnectionRef.current.setLocalDescription(answer);
            addLog(`Answered to host: ${JSON.stringify(answer)}`)
            socketRef.current?.emit('answer', { from: username, to: from, answer });
            setActiveCall({ userId: from, offer: offer, status: 'connected' });



        } catch (error) {
            console.error('Error accepting call:', error);
            addLog(`Error sending Answer : ${error}`)

        }
    };

    const handleReceiveICECandidate = async (data: { candidate: RTCIceCandidateInit }) => {
        try {
            await peerConnectionRef.current?.addIceCandidate(new RTCIceCandidate(data.candidate));
        } catch (error) {
            console.error('Error adding ICE candidate:', error);
        }
    };

    const handleUserDisconnected = (userId: string) => {
        if (activeCall && activeCall.userId === userId) {
            setActiveCall(null);
            peerConnectionRef.current?.close();
            peerConnectionRef.current = null;
            setMessages([]);
        }
    };

    return (
        <div>
            <h1>WebRTC Client</h1>
            {!connected ? (
                <div>
                    <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Enter username" />
                    <button onClick={handleJoin}>Join</button>
                </div>
            ) : (
                <div></div>
            )
            }
            <div>
                <video ref={localVideoRef} autoPlay muted playsInline />
            </div>
            <div>      <Card title="Communication Logs">
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

        </div>
    );
};

export default Client;
