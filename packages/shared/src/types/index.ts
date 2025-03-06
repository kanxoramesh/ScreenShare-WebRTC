// packages/shared/src/types/index.ts

// Room related types
export interface Room {
    id: string;
    participants: Participant[];
    maxParticipants?: number;
    createdAt: Date;
  }
  
  export interface Participant {
    id: string;
    name: string;
    role: ParticipantRole;
    connectionState: ConnectionState;
  }
  
  export enum ParticipantRole {
    HOST = 'host',
    GUEST = 'guest',
  }
  
  export enum ConnectionState {
    CONNECTING = 'connecting',
    CONNECTED = 'connected',
    DISCONNECTED = 'disconnected',
  }
  
  // WebRTC signaling types
  export interface SignalingMessage {
    type: SignalingMessageType;
    payload: any;
    senderId: string;
    targetId?: string;
    roomId: string;
  }
  
  export enum SignalingMessageType {
    OFFER = 'offer',
    ANSWER = 'answer',
    ICE_CANDIDATE = 'ice-candidate',
    JOIN_ROOM = 'join-room',
    LEAVE_ROOM = 'leave-room',
    PARTICIPANT_JOINED = 'participant-joined',
    PARTICIPANT_LEFT = 'participant-left',
    ERROR = 'error',
  }
  
  // RTCPeerConnection configuration
  export interface RTCConfig {
    iceServers: RTCIceServer[];
    iceTransportPolicy?: RTCIceTransportPolicy;
    bundlePolicy?: RTCBundlePolicy;
  }
  
  // Error handling
  export interface SignalingError {
    code: ErrorCode;
    message: string;
    details?: any;
  }
  
  export enum ErrorCode {
    ROOM_FULL = 'room_full',
    ROOM_NOT_FOUND = 'room_not_found',
    INVALID_MESSAGE = 'invalid_message',
    CONNECTION_ERROR = 'connection_error',
    PEER_CONNECTION_FAILED = 'peer_connection_failed',
  }
  