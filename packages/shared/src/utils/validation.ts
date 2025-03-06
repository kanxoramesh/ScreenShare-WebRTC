import { SignalingMessage } from "../types";

export function isValidRoomId(roomId: string): boolean {
    return typeof roomId === 'string' && roomId.length >= 6 && roomId.length <= 32;
  }
  
  export function isValidParticipantName(name: string): boolean {
    return typeof name === 'string' && name.length >= 2 && name.length <= 50;
  }
  
  export function isValidSignalingMessage(message: SignalingMessage): boolean {
    return (
      message &&
      typeof message.type === 'string' &&
      typeof message.senderId === 'string' &&
      typeof message.roomId === 'string' &&
      message.payload !== undefined
    );
  }