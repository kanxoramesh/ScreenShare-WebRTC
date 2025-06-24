# WebRTC Screen Sharing App

## Overview
This project implements a screen sharing application using WebRTC for peer-to-peer media streaming and Socket.IO for signaling. It consists of three main components:
- **Client**: Initiates screen sharing and sends the stream.
- **Host**: Receives and displays the shared screen.
- **Signaling Server**: Relays signaling messages (offer, answer, ICE candidates) between peers using Socket.IO.

## Architecture Flow

```
+---------+         +-------------------+         +------+
|  Client | <-----> | Signaling Server  | <-----> | Host |
+---------+         +-------------------+         +------+
     |                      |                        |
     |---(Socket.IO join)-->|                        |
     |<--(registered)-------|                        |
     |---(offer)----------->|                        |
     |                      |---(offer)------------->|
     |                      |<--(answer)-------------|
     |<--(answer)-----------|                        |
     |---(ICE candidate)----|                        |
     |                      |---(ICE candidate)----->|
     |                      |<--(ICE candidate)------|
     |<--(ICE candidate)----|                        |
```

- The **Client** captures the screen and sends an offer via the signaling server.
- The **Host** receives the offer, creates an answer, and sends it back.
- Both peers exchange ICE candidates for connectivity.
- Once connected, the Host displays the Client's shared screen.

## Getting Started

### Prerequisites
- Node.js (v16+ recommended)
- pnpm (or npm/yarn)

### Install Dependencies
```bash
pnpm install
```

### Run Signaling Server
```bash
cd apps/signaling-server
pnpm start
```

### Run Client
```bash
cd apps/client
pnpm dev
```

### Run Host
```bash
cd apps/host
pnpm dev
```

- Client: http://localhost:4000
- Host: http://localhost:3000
- Signaling Server: http://localhost:4000 (API)

## Usage
- Open the Host and Client in separate browser windows.
- On the Client, click "Start Screen Share" to share your screen.
- The Host will display the shared screen in real time.

## Testing
To run unit tests for all modules:
```bash
pnpm test
```

## Project Structure
- `apps/client`: React client app for screen sharing
- `apps/host`: React host app to view shared screen
- `apps/signaling-server`: Node.js Socket.IO signaling server
- `packages/communication`: Shared communication logic
- `packages/shared-types`: Shared TypeScript types
- `packages/ui-components`: Shared UI components

## License
MIT


