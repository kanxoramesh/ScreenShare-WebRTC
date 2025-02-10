import { Box, Button, Container, TextField, CircularProgress, Alert } from "@mui/material";
import { useRef, useState, useEffect } from "react";
import { initializeApp } from 'firebase/app';
import { 
    collection, 
    query, 
    addDoc, 
    getDocs, 
    setDoc, 
    deleteDoc, 
    doc, 
    onSnapshot, 
    getFirestore 
} from "firebase/firestore";

const firebaseConfig = {
    apiKey: process.env.REACT_APP_API_KEY,
    authDomain: process.env.REACT_APP_AUTH_DOMAIN,
    projectId: process.env.REACT_APP_PROJECT_ID,
    storageBucket: process.env.REACT_APP_STORAGE_BUCKET,
    messagingSenderId: process.env.REACT_APP_MESSAGING_SENDER_ID,
    appId: process.env.REACT_APP_APP_ID,
    measurementId: process.env.REACT_APP_MEASUREMENT_ID
};

const REMOTE_CONTROL = "remoteControl";
const MY_REMOTE_ID = "rameshremoteID";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// WebRTC Configuration
const servers = {
    iceServers: [
        {
            urls: [
                "stun:stun1.l.google.com:19302",
                "stun:stun2.l.google.com:19302",
            ],
        },
    ],
    iceCandidatePoolSize: 10,
};

function Remote() {
    const localRef = useRef();
    const [connect, setConnect] = useState(false);
    const [localStream, setLocalStream] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isDown, setIsDown] = useState(false);
    const [loading, setLoading] = useState(false);
    const [remoteId, setRemoteId] = useState("");
    const [error, setError] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [dimensions, setDimensions] = useState({ width: 270, height: 584 });
    const [scaleFactor, setScaleFactor] = useState({ x: 1, y: 1 });
    
    // Create RTCPeerConnection and DataChannel refs to ensure persistence
    const pcRef = useRef(null);
    const dataChannelRef = useRef(null);

    useEffect(() => {
        // Initialize WebRTC connection
        pcRef.current = new RTCPeerConnection(servers);
        dataChannelRef.current = pcRef.current.createDataChannel("channel");
        pcRef.current.addTransceiver('video');

        // Cleanup on component unmount
        return () => {
            if (pcRef.current) {
                pcRef.current.close();
            }
            if (localStream) {
                localStream.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    // Handle window resize
    useEffect(() => {
        const handleResize = () => {
            if (localRef.current) {
                const videoElement = localRef.current;
                const containerWidth = videoElement.parentElement.offsetWidth;
                const aspectRatio = dimensions.height / dimensions.width;
                
                let newWidth = Math.min(containerWidth, dimensions.width);
                let newHeight = newWidth * aspectRatio;

                setDimensions({
                    width: newWidth,
                    height: newHeight
                });
            }
        };

        window.addEventListener('resize', handleResize);
        handleResize();

        return () => window.removeEventListener('resize', handleResize);
    }, [dimensions.width, dimensions.height]);

    async function clearCollection(ref) {
        try {
            const querySnapshot = await getDocs(ref);
            const deletePromises = querySnapshot.docs.map(doc => 
                deleteDoc(doc.ref)
            );
            await Promise.all(deletePromises);
        } catch (error) {
            console.error("Error clearing collection:", error);
            setErrorMessage("Failed to clear previous session data");
        }
    }

    const setStatus = async () => {
        try {
            await Promise.all([
                clearCollection(collection(db, REMOTE_CONTROL, MY_REMOTE_ID, "offer")),
                clearCollection(collection(db, REMOTE_CONTROL, MY_REMOTE_ID, "iceCandidates")),
                clearCollection(collection(db, REMOTE_CONTROL, remoteId, "answer")),
                clearCollection(collection(db, REMOTE_CONTROL, remoteId, "iceCandidates"))
            ]);
            await setDoc(doc(db, REMOTE_CONTROL, MY_REMOTE_ID), { "status": true });
        } catch (error) {
            console.error("Error setting status:", error);
            setErrorMessage("Failed to initialize connection");
            throw error;
        }
    };

    const handleDeviceResolution = (dWidth, dHeight) => {
        const containerWidth = localRef.current?.parentElement.offsetWidth || window.innerWidth;
        const aspectRatio = dHeight / dWidth;
        
        let newWidth = Math.min(containerWidth, dWidth);
        let newHeight = newWidth * aspectRatio;

        setDimensions({ width: newWidth, height: newHeight });
        setScaleFactor({
            x: dWidth / newWidth,
            y: dHeight / newHeight
        });
    };

    const setRequestToCallee = () => {
        setDoc(doc(db, REMOTE_CONTROL, remoteId), {
            caller: {
                callerId: MY_REMOTE_ID,
                callerName: "Remote Control"
            }
        });

        onSnapshot(doc(db, REMOTE_CONTROL, remoteId), (doc) => {
            const data = doc.data();
            if (data?.status) {
                handleDeviceResolution(data.dWidth, data.dHeight);
                setIceAndOfferCandidates();
            }
        });
    };

    const setIceAndOfferCandidates = async () => {
        try {
            pcRef.current.onicecandidate = async (event) => {
                if (event.candidate) {
                    await addDoc(
                        collection(db, REMOTE_CONTROL, MY_REMOTE_ID, "iceCandidates"),
                        event.candidate.toJSON()
                    );
                }
            };

            const offerDescription = await pcRef.current.createOffer();
            await pcRef.current.setLocalDescription(offerDescription);
            
            await addDoc(collection(db, REMOTE_CONTROL, MY_REMOTE_ID, "offer"), {
                sdp: offerDescription.sdp,
                type: offerDescription.type,
            });

            setupAnswerListener();
        } catch (error) {
            console.error("Error in ICE candidate setup:", error);
            setErrorMessage("Failed to establish peer connection");
        }
    };

    const setupAnswerListener = () => {
        const calleeAnswer = collection(db, REMOTE_CONTROL, remoteId, "answer");
        const calleeIceCandidates = collection(db, REMOTE_CONTROL, remoteId, "iceCandidates");

        onSnapshot(query(calleeAnswer), (snapshot) => {
            snapshot.docChanges().forEach(async (change) => {
                if (change.type === "added") {
                    try {
                        const answerDescription = new RTCSessionDescription(change.doc.data());
                        await pcRef.current.setRemoteDescription(answerDescription);
                        
                        // Setup ICE candidate listener after remote description is set
                        onSnapshot(query(calleeIceCandidates), (snapshot) => {
                            snapshot.docChanges().forEach(async (change) => {
                                if (change.type === "added") {
                                    await pcRef.current.addIceCandidate(
                                        new RTCIceCandidate(change.doc.data())
                                    );
                                }
                            });
                        });
                    } catch (error) {
                        console.error("Error processing answer:", error);
                        setErrorMessage("Failed to process remote connection");
                    }
                }
            });
        });
    };

    const handleMouseEvent = (event, type) => {
        if (!dataChannelRef.current || dataChannelRef.current.readyState !== "open") {
            return;
        }

        const rect = event.currentTarget.getBoundingClientRect();
        const x = (event.clientX - rect.left) * scaleFactor.x;
        const y = (event.clientY - rect.top) * scaleFactor.y;
        
        dataChannelRef.current.send(`${x}:${y}:${type}`);
    };

    const setupSources = async () => {
        if (connect) {
            await hangUp();
            return;
        }

        if (!remoteId) {
            setError(true);
            setErrorMessage("Remote ID is required");
            return;
        }

        try {
            setLoading(true);
            await setStatus();
            setRequestToCallee();

            const stream = new MediaStream();
            pcRef.current.ontrack = (event) => {
                event.streams[0].getTracks().forEach(track => {
                    stream.addTrack(track);
                });
                
                if (localRef.current) {
                    localRef.current.srcObject = stream;
                }
                
                setLocalStream(stream);
                setLoading(false);
            };

            pcRef.current.onconnectionstatechange = () => {
                if (pcRef.current.connectionState === "disconnected") {
                    hangUp();
                }
            };

            setConnect(true);
        } catch (error) {
            console.error("Setup error:", error);
            setErrorMessage("Failed to setup connection");
            setLoading(false);
        }
    };

    const hangUp = async () => {
        try {
            if (pcRef.current) {
                pcRef.current.close();
            }
            
            if (localStream) {
                localStream.getTracks().forEach(track => track.stop());
                setLocalStream(null);
            }

            await Promise.all([
                clearCollection(collection(db, REMOTE_CONTROL, MY_REMOTE_ID, "offer")),
                clearCollection(collection(db, REMOTE_CONTROL, MY_REMOTE_ID, "iceCandidates")),
                setDoc(doc(db, REMOTE_CONTROL, MY_REMOTE_ID), { status: false }, { merge: true }),
                setDoc(doc(db, REMOTE_CONTROL, remoteId), {})
            ]);

            setConnect(false);
            setLoading(false);
            window.location.reload();
        } catch (error) {
            console.error("Hangup error:", error);
            setErrorMessage("Failed to disconnect properly");
        }
    };

    return (
        <Container maxWidth="md">
            <Box sx={{ my: 3 }}>
                <Box sx={{ mb: 2 }} display="flex" gap={2} alignItems="center" justifyContent="center">
                    <TextField
                        error={error}
                        label="Remote ID"
                        variant="outlined"
                        required
                        helperText={error ? "Remote ID is required" : ""}
                        onChange={(e) => {
                            setError(false);
                            setErrorMessage("");
                            setRemoteId(e.target.value);
                        }}
                    />
                    <Button
                        variant="contained"
                        onClick={setupSources}
                        disabled={loading}
                    >
                        {loading ? "Connecting..." : connect ? 'Disconnect' : "Connect"}
                    </Button>
                </Box>

                {errorMessage && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {errorMessage}
                    </Alert>
                )}

                {loading && (
                    <Box display="flex" justifyContent="center" sx={{ my: 2 }}>
                        <CircularProgress />
                    </Box>
                )}

                <Box
                    sx={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        bgcolor: 'background.paper',
                        borderRadius: 1,
                        overflow: 'hidden'
                    }}
                >
                    <div
                        style={{
                            width: dimensions.width,
                            height: dimensions.height,
                            position: 'relative'
                        }}
                        onMouseDown={(e) => {
                            setIsDown(true);
                            handleMouseEvent(e, 'ACTION_DOWN');
                        }}
                        onMouseMove={(e) => {
                            if (isDown) {
                                setIsDragging(true);
                                handleMouseEvent(e, 'ACTION_MOVE');
                            }
                        }}
                        onMouseUp={(e) => {
                            if (!isDragging) {
                                handleMouseEvent(e, 'ACTION_CLICK');
                            }
                            handleMouseEvent(e, 'ACTION_UP');
                            setIsDragging(false);
                            setIsDown(false);
                        }}
                        onMouseLeave={() => {
                            setIsDragging(false);
                            setIsDown(false);
                        }}
                    >
                        <video
                            ref={localRef}
                            autoPlay
                            playsInline
                            muted
                            style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'contain'
                            }}
                        />
                    </div>
                </Box>
            </Box>
        </Container>
    );
}

export default Remote;