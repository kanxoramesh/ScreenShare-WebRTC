// src/types/index.ts
var ParticipantRole = /* @__PURE__ */ ((ParticipantRole2) => {
  ParticipantRole2["HOST"] = "host";
  ParticipantRole2["GUEST"] = "guest";
  return ParticipantRole2;
})(ParticipantRole || {});
var ConnectionState = /* @__PURE__ */ ((ConnectionState2) => {
  ConnectionState2["CONNECTING"] = "connecting";
  ConnectionState2["CONNECTED"] = "connected";
  ConnectionState2["DISCONNECTED"] = "disconnected";
  return ConnectionState2;
})(ConnectionState || {});
var SignalingMessageType = /* @__PURE__ */ ((SignalingMessageType2) => {
  SignalingMessageType2["OFFER"] = "offer";
  SignalingMessageType2["ANSWER"] = "answer";
  SignalingMessageType2["ICE_CANDIDATE"] = "ice-candidate";
  SignalingMessageType2["JOIN_ROOM"] = "join-room";
  SignalingMessageType2["LEAVE_ROOM"] = "leave-room";
  SignalingMessageType2["PARTICIPANT_JOINED"] = "participant-joined";
  SignalingMessageType2["PARTICIPANT_LEFT"] = "participant-left";
  SignalingMessageType2["ERROR"] = "error";
  return SignalingMessageType2;
})(SignalingMessageType || {});
var ErrorCode = /* @__PURE__ */ ((ErrorCode2) => {
  ErrorCode2["ROOM_FULL"] = "room_full";
  ErrorCode2["ROOM_NOT_FOUND"] = "room_not_found";
  ErrorCode2["INVALID_MESSAGE"] = "invalid_message";
  ErrorCode2["CONNECTION_ERROR"] = "connection_error";
  ErrorCode2["PEER_CONNECTION_FAILED"] = "peer_connection_failed";
  return ErrorCode2;
})(ErrorCode || {});

// src/constants.ts
var DEFAULT_RTC_CONFIG = {
  iceServers: [
    {
      urls: [
        "stun:stun.l.google.com:19302",
        "stun:stun1.l.google.com:19302"
      ]
    }
  ]
};
var SIGNALING_EVENTS = {
  CONNECT: "connect",
  DISCONNECT: "disconnect",
  MESSAGE: "message",
  ERROR: "error"
};
var ROOM_DEFAULTS = {
  MAX_PARTICIPANTS: 10,
  CONNECTION_TIMEOUT: 3e4
  // 30 seconds
};

// src/utils/validation.ts
function isValidRoomId(roomId) {
  return typeof roomId === "string" && roomId.length >= 6 && roomId.length <= 32;
}
function isValidParticipantName(name) {
  return typeof name === "string" && name.length >= 2 && name.length <= 50;
}
function isValidSignalingMessage(message) {
  return message && typeof message.type === "string" && typeof message.senderId === "string" && typeof message.roomId === "string" && message.payload !== void 0;
}
export {
  ConnectionState,
  DEFAULT_RTC_CONFIG,
  ErrorCode,
  ParticipantRole,
  ROOM_DEFAULTS,
  SIGNALING_EVENTS,
  SignalingMessageType,
  isValidParticipantName,
  isValidRoomId,
  isValidSignalingMessage
};
