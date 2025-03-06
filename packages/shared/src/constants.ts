import { RTCConfig } from "./types";

export const DEFAULT_RTC_CONFIG: RTCConfig = {
    iceServers: [
      {
        urls: [
          'stun:stun.l.google.com:19302',
          'stun:stun1.l.google.com:19302',
        ],
      },
    ],
  };
  
  export const SIGNALING_EVENTS = {
    CONNECT: 'connect',
    DISCONNECT: 'disconnect',
    MESSAGE: 'message',
    ERROR: 'error',
  } as const;
  
  export const ROOM_DEFAULTS = {
    MAX_PARTICIPANTS: 10,
    CONNECTION_TIMEOUT: 30000, // 30 seconds
  } as const;
  