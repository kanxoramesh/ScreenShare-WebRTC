# Architecture Documentation

## Overview
This project enables real-time screen sharing between a client and a host using WebRTC for media transport and Socket.IO for signaling. The architecture is modular, with clear separation between UI, signaling, and communication logic.

## Components

### 1. Client (apps/client)
- React app that allows a user to share their screen.
- Uses WebRTC to capture and send the screen stream.
- Connects to the signaling server via Socket.IO for signaling (offer, answer, ICE).

### 2. Host (apps/host)
- React app that receives and displays the shared screen.
- Connects to the signaling server via Socket.IO for signaling.
- Handles incoming WebRTC streams and renders them in a video element.

### 3. Signaling Server (apps/signaling-server)
- Node.js server using Socket.IO.
- Relays signaling messages (offer, answer, ICE candidates) between client and host.
- Handles client/host registration and connection management.

### 4. Shared Packages
- `@webrtc-project/communication`: Shared communication protocol logic.
- `@webrtc-project/shared-types`: Shared TypeScript types.
- `@webrtc-project/ui-components`: Shared UI components (Card, Button, etc).

## Flow Diagram

```
Client <---Socket.IO---> Signaling Server <---Socket.IO---> Host
   |                                                        |
   |--- getDisplayMedia (screen) ---+                       |
   |                                |                       |
   |--- createOffer --------------->|                       |
   |                                |--- forward offer ---->|
   |                                |<-- answer ------------|
   |<-- answer ---------------------|                       |
   |--- ICE candidates ------------>|--- ICE candidates --->|
   |<-- ICE candidates -------------|<-- ICE candidates ----|
   |                                                        |
   |--- WebRTC Media Stream ------->|--- WebRTC Media ----->|
```

## Sequence
1. Client and Host connect to the signaling server and register their roles.
2. Client starts screen sharing, creates a WebRTC offer, and sends it via the signaling server.
3. Host receives the offer, creates an answer, and sends it back via the signaling server.
4. Both peers exchange ICE candidates for NAT traversal.
5. Once the connection is established, the Host receives and displays the Client's screen stream.

## Security
- Only registered clients/hosts can exchange signaling messages.
- CORS and rate limiting are enabled on the signaling server.
- WebRTC streams are peer-to-peer and encrypted.

## Extensibility
- The architecture supports adding chat, file transfer, or multi-user features by extending the signaling and communication logic.

## Testing
- Each module includes unit tests for connection, signaling, and UI logic.

---
For more details, see the code and README.
