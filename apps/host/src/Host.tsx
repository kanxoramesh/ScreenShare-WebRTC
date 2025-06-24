import React, { useEffect, useState, useRef } from 'react';
import { useHostSocket, ClientInfo } from './hooks/useHostSocket';
import { io } from 'socket.io-client';

type Message = {
    text: string;
    sender: 'local' | 'remote';
};

type ActiveCall = {
    userId: string;
    status: 'calling' | 'incoming' | 'connected';
    username?: string;
    offer?: RTCSessionDescriptionInit;
};

const Host: React.FC = () => {
    const [connected, setConnected] = useState<boolean>(false);
    const [username, setUsername] = useState<string>('');
    const [clients, setClients] = useState<ClientInfo[]>([]);
    const [activeCall, setActiveCall] = useState<ActiveCall | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState<string>('');
    const [connectedClient, setConnectedClient] = useState<ClientInfo | null>(null);
    const [callStatus, setCallStatus] = useState<Record<string, 'idle' | 'calling' | 'connected'>>({});
    const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
    const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
    const dataChannelRef = useRef<RTCDataChannel | null>(null);

    // Handler functions must be declared before useHostSocket
    const log = (...args: any[]) => {
        // eslint-disable-next-line no-console
        console.log('[SOCKET EVENT]', ...args);
    };
    const handleReceiveAnswer = async (data: { answer: RTCSessionDescriptionInit; from: string }) => {
        log('answer', data);
        if (peerConnectionRef.current) {
            await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.answer));
            setActiveCall({ userId: data.from, status: 'connected' });
            setCallStatus(prev => ({ ...prev, [data.from]: 'connected' }));
        }
    };
    const handleReceiveICECandidate = async (data: { candidate: RTCIceCandidateInit }) => {
        log('ice-candidate', data);
        if (peerConnectionRef.current) {
            await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
        }
    };
    const handleUserDisconnected = (userId: string) => {
        log('user-disconnected', userId);
        if (activeCall?.userId === userId) {
            endCall();
        }
    };

    // Modular socket logic
    const socketRef = useHostSocket(
        username,
        (clientList) => setClients(clientList),
        handleReceiveAnswer,
        handleReceiveICECandidate,
        handleUserDisconnected
    );

    // Initialize Socket.io connection
    useEffect(() => {
        log('useEffect: username', username);
        socketRef.current = io('http://localhost:4000');

        if (socketRef.current) {
            socketRef.current.on("client-joined", ({clientId}) => {
                log('client-joined', clientId);
                if (clientId !== username) {
                  setClients((prevUsers) => [...prevUsers, clientId]);
                }
            });

            socketRef.current.on('answer', handleReceiveAnswer);
            socketRef.current.on('ice-candidate', handleReceiveICECandidate);
            socketRef.current.on('user-disconnected', handleUserDisconnected);
            socketRef.current.on('client-list', (clientList) => log('client-list', clientList));
            socketRef.current.on('client-join-request', (data) => log('client-join-request', data));
            socketRef.current.on('offer', (data) => log('offer', data));
            socketRef.current.on('call-client', (data) => log('call-client', data));
        }

        return () => {
            if (peerConnectionRef.current) {
                peerConnectionRef.current.close();
            }
            socketRef.current?.disconnect();
        };
    }, [username]);

    // Join the room with username
    const handleJoin = async () => {
        if (username.trim()) {
            setConnected(true);
        }
    };

    // Create and send an offer
    const callUser = async (targetUserId: string) => {
        try {
            setCallStatus(prev => ({ ...prev, [targetUserId]: 'calling' }));
            const configuration: RTCConfiguration = {
                iceServers: [
                    { urls: 'stun:stun.l.google.com:19302' },
                    { urls: 'stun:stun1.l.google.com:19302' },
                ],
            };

            peerConnectionRef.current = new RTCPeerConnection(configuration);
            dataChannelRef.current = peerConnectionRef.current.createDataChannel('chat');
            setupDataChannel(dataChannelRef.current);

            peerConnectionRef.current.onicecandidate = (event) => {
                if (event.candidate) {
                    socketRef.current?.emit('ice-candidate', {
                        to: targetUserId,
                        from:username,
                        candidate: event.candidate,
                    });
                }
            };

            peerConnectionRef.current.ontrack = (event) => {
                if (remoteVideoRef.current && event.streams[0]) {
                    remoteVideoRef.current.srcObject = event.streams[0];
                }
            };

            const offer = await peerConnectionRef.current.createOffer();
            await peerConnectionRef.current.setLocalDescription(offer);

            socketRef.current?.emit('offer', { to:targetUserId, from:username, offer });

            setActiveCall({ userId: targetUserId, status: 'calling' });
            const client = clients.find(c => c.clientId === targetUserId);
            setConnectedClient(client || null);
        } catch (error) {
            setCallStatus(prev => ({ ...prev, [targetUserId]: 'idle' }));
            console.error('Error calling user:', error);
        }
    };

    // End the call
    const endCall = () => {
        if (activeCall) {
            setCallStatus(prev => ({ ...prev, [activeCall.userId]: 'idle' }));
        }
        peerConnectionRef.current?.close();
        peerConnectionRef.current = null;
        setActiveCall(null);
        setMessages([]);
    };

    // Setup data channel
    const setupDataChannel = (channel: RTCDataChannel) => {
        channel.onopen = () => console.log('Data channel opened');
        channel.onmessage = (event) => setMessages((prev) => [...prev, { text: event.data, sender: 'remote' }]);
        channel.onclose = () => console.log('Data channel closed');
    };

    // Send chat message
    const sendMessage = () => {
        if (dataChannelRef.current?.readyState === 'open' && newMessage) {
            dataChannelRef.current.send(newMessage);
            setMessages((prev) => [...prev, { text: newMessage, sender: 'local' }]);
            setNewMessage('');
        }
    };

    return <div className="p-4">
        {!connected ? (
            <div className="flex flex-col space-y-4 items-center max-w-md mx-auto mt-8">
                <h1 className="text-2xl font-bold">WebRTC Host</h1>
                <input
                    type="text"
                    placeholder="Enter your username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-4 py-2 border rounded"
                />
                <button
                    onClick={handleJoin}
                    className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
                >
                    Join
                </button>
            </div>
        ) : (
            <>
            <div className="text-center mb-4">
                <span className="font-semibold">Your name:</span> <b>{username}</b>
                {connectedClient && (
                  <>
                    <span className="ml-4 font-semibold">Connected to:</span> <b>{connectedClient.username}</b>
                  </>
                )}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Left column - User list */}
                <div className="p-4 border rounded">
                    <h2 className="text-xl font-bold mb-4">Online Users</h2>
                    {clients.length === 0 ? (
                        <p>No other users online</p>
                    ) : (
                        <ul>
                            {clients.map((client, index) => {
                                const status = callStatus[client.clientId] || 'idle';
                                let buttonLabel = 'Call';
                                let buttonDisabled = false;
                                if (status === 'calling') {
                                  buttonLabel = 'Calling...';
                                  buttonDisabled = true;
                                } else if (status === 'connected') {
                                  buttonLabel = 'Connected';
                                  buttonDisabled = true;
                                } else if (activeCall) {
                                  buttonDisabled = true;
                                }
                                return (
                                  <li key={client.clientId} className="p-2 hover:bg-gray-100 rounded flex justify-between">
                                    <span>{client.username} <span className="text-xs text-gray-400">({client.clientId})</span></span>
                                    <button
                                      onClick={() => callUser(client.clientId)}
                                      className={`px-2 py-1 rounded text-sm ${status === 'connected' ? 'bg-blue-500 text-white' : 'bg-green-500 text-white'}`}
                                      disabled={buttonDisabled}
                                    >
                                      {buttonLabel}
                                    </button>
                                  </li>
                                );
                            })}
                        </ul>
                    )}
                </div>

                {/* Middle column - Video */}
                <div className="lg:col-span-2">

                    <div className="border rounded p-2">
                        <h3 className="text-lg font-bold mb-2">
                            {activeCall && activeCall.status === 'connected' ? 'Remote Video' : 'Remote Video (Not connected)'}
                        </h3>
                        <video
                            ref={remoteVideoRef}
                            autoPlay
                            playsInline
                            className="w-full bg-black"
                        />
                    </div>

                    {/* Call control */}
                    <div className="mt-4 p-4 border rounded">
                        {activeCall ? (
                            <>
                                {activeCall.status === 'calling' ? (
                                    <div className="text-center">
                                        <p className="text-lg">Calling...</p>
                                        <button
                                            onClick={endCall}
                                            className="px-4 py-2 bg-red-500 text-white rounded mt-2"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                ) : (
                                    <div className="text-center">
                                        <p className="text-lg">Connected</p>
                                        <button
                                            onClick={endCall}
                                            className="px-4 py-2 bg-red-500 text-white rounded mt-2"
                                        >
                                            End Call
                                        </button>
                                    </div>
                                )}
                            </>
                        ) : (
                            <p className="text-center text-lg">Select a user to call</p>
                        )}
                    </div>

                    {/* Chat */}
                    {activeCall && activeCall.status === 'connected' && (
                        <div className="mt-4 p-4 border rounded">
                            <h3 className="text-lg font-bold mb-2">Chat</h3>
                            <div className="h-48 overflow-y-auto border rounded p-2 mb-2">
                                {messages.map((msg, index) => (
                                    <div
                                        key={index}
                                        className={`p-2 my-1 rounded ${msg.sender === 'local' ? 'bg-blue-100 ml-8' : 'bg-gray-100 mr-8'}`}
                                    >
                                        {msg.text}
                                    </div>
                                ))}
                            </div>
                            <div className="flex">
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                                    placeholder="Type a message..."
                                    className="flex-1 px-4 py-2 border rounded-l"
                                />
                                <button
                                    onClick={sendMessage}
                                    className="px-4 py-2 bg-blue-500 text-white rounded-r"
                                >
                                    Send
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            </>
        )}
    </div>;
};

export default Host;
