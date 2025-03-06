interface Room {
    id: string;
    participants: Participant[];
    maxParticipants?: number;
    createdAt: Date;
}
interface Participant {
    id: string;
    name: string;
    role: ParticipantRole;
    connectionState: ConnectionState;
}
declare enum ParticipantRole {
    HOST = "host",
    GUEST = "guest"
}
declare enum ConnectionState {
    CONNECTING = "connecting",
    CONNECTED = "connected",
    DISCONNECTED = "disconnected"
}
interface SignalingMessage {
    type: SignalingMessageType;
    payload: any;
    senderId: string;
    targetId?: string;
    roomId: string;
}
declare enum SignalingMessageType {
    OFFER = "offer",
    ANSWER = "answer",
    ICE_CANDIDATE = "ice-candidate",
    JOIN_ROOM = "join-room",
    LEAVE_ROOM = "leave-room",
    PARTICIPANT_JOINED = "participant-joined",
    PARTICIPANT_LEFT = "participant-left",
    ERROR = "error"
}
interface RTCConfig {
    iceServers: RTCIceServer[];
    iceTransportPolicy?: RTCIceTransportPolicy;
    bundlePolicy?: RTCBundlePolicy;
}
interface SignalingError {
    code: ErrorCode;
    message: string;
    details?: any;
}
declare enum ErrorCode {
    ROOM_FULL = "room_full",
    ROOM_NOT_FOUND = "room_not_found",
    INVALID_MESSAGE = "invalid_message",
    CONNECTION_ERROR = "connection_error",
    PEER_CONNECTION_FAILED = "peer_connection_failed"
}

declare const DEFAULT_RTC_CONFIG: RTCConfig;
declare const SIGNALING_EVENTS: {
    readonly CONNECT: "connect";
    readonly DISCONNECT: "disconnect";
    readonly MESSAGE: "message";
    readonly ERROR: "error";
};
declare const ROOM_DEFAULTS: {
    readonly MAX_PARTICIPANTS: 10;
    readonly CONNECTION_TIMEOUT: 30000;
};

declare function isValidRoomId(roomId: string): boolean;
declare function isValidParticipantName(name: string): boolean;
declare function isValidSignalingMessage(message: SignalingMessage): boolean;

export { ConnectionState, DEFAULT_RTC_CONFIG, ErrorCode, type Participant, ParticipantRole, ROOM_DEFAULTS, type RTCConfig, type Room, SIGNALING_EVENTS, type SignalingError, type SignalingMessage, SignalingMessageType, isValidParticipantName, isValidRoomId, isValidSignalingMessage };
