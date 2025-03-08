import React, { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

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
    const [users, setUsers] = useState<string[]>([]);
    const [activeCall, setActiveCall] = useState<ActiveCall | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState<string>('');

    const socketRef = useRef<Socket | null>(null);
    const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
    const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
    const dataChannelRef = useRef<RTCDataChannel | null>(null);

    // Initialize Socket.io connection
    useEffect(() => {
        socketRef.current = io('http://localhost:4000');

        socketRef.current.on("client-joined", ({clientId}) => {
            console.log("Client joined: ",clientId)
            if (clientId !== username) {
              setUsers((prevUsers) => [...prevUsers, clientId]); // Correctly update state with a new array
            }
          });

        socketRef.current.on('offer', handleReceiveOffer);
        socketRef.current.on('answer', handleReceiveAnswer);
        socketRef.current.on('ice-candidate', handleReceiveICECandidate);
        socketRef.current.on('user-disconnected', handleUserDisconnected);

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
            socketRef.current?.emit('join', { clientId:username, role:"host" });
            setConnected(true);
        }
    };

    // Create and send an offer
    const callUser = async (targetUserId: string) => {
        try {
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
        } catch (error) {
            console.error('Error calling user:', error);
        }
    };

    // Handle incoming call offers
    const handleReceiveOffer = async (data: { offer: RTCSessionDescriptionInit; from: string; fromUsername: string }) => {
        if (peerConnectionRef.current) {
            console.warn('Already in a call, rejecting offer');
            return;
        }

        setActiveCall({ userId: data.from, status: 'incoming', username: data.fromUsername, offer: data.offer });
    };


    // Handle received answer
    const handleReceiveAnswer = async (data: { answer: RTCSessionDescriptionInit; from: string }) => {
        
        if (peerConnectionRef.current) {
            await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.answer));
            setActiveCall({ userId: data.from, status: 'connected' });
        }
    };

    // Handle ICE candidates
    const handleReceiveICECandidate = async (data: { candidate: RTCIceCandidateInit }) => {
        if (peerConnectionRef.current) {
            await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
        }
    };

    // Handle user disconnected
    const handleUserDisconnected = (userId: string) => {
        if (activeCall?.userId === userId) {
            endCall();
        }
    };

    // End the call
    const endCall = () => {
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
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Left column - User list */}
                <div className="p-4 border rounded">
                    <h2 className="text-xl font-bold mb-4">Online Users</h2>
                    {users.length === 0 ? (
                        <p>No other users online</p>
                    ) : (
                        <ul>
                            {users.map((user, index) => (
                                <li key={index} className="p-2 hover:bg-gray-100 rounded flex justify-between">
                                    <span>{user}</span>
                                    {!activeCall && (
                                        <button
                                            onClick={() => callUser(user)}
                                            className="px-2 py-1 bg-green-500 text-white rounded text-sm"
                                        >
                                            Call
                                        </button>
                                    )}
                                </li>
                            ))}
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
        )}
    </div>;
};

export default Host;
