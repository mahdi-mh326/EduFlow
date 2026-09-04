const rooms = new Map();

const getRoom = (roomId) => {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, {
      participants: new Map(),
      createdAt: new Date(),
    });
  }
  return rooms.get(roomId);
};

const joinRoom = (roomId, participant) => {
  const room = getRoom(roomId);
  room.participants.set(participant.userId, {
    ...participant,
    isVideoOn: participant.isVideoOn ?? false,
    isAudioOn: participant.isAudioOn ?? false,
    isScreenSharing: participant.isScreenSharing ?? false,
    isHandRaised: participant.isHandRaised ?? false,
  });
};

const updateParticipantState = (roomId, userId, updates) => {
  const room = rooms.get(roomId);
  if (!room) return;
  const participant = room.participants.get(userId);
  if (participant) {
    room.participants.set(userId, {
      ...participant,
      ...updates,
    });
  }
};

const leaveRoom = (roomId, userId) => {
  const room = rooms.get(roomId);
  if (!room) return;

  room.participants.delete(userId);

  if (room.participants.size === 0) {
    rooms.delete(roomId);
  }
};

const getParticipants = (roomId) => {
  const room = rooms.get(roomId);
  if (!room) return [];

  return Array.from(room.participants.values()).map((p) => ({
    userId: p.userId,
    socketId: p.socketId,
    role: p.role,
    displayName: p.displayName,
    isVideoOn: p.isVideoOn ?? false,
    isAudioOn: p.isAudioOn ?? false,
    isScreenSharing: p.isScreenSharing ?? false,
    isHandRaised: p.isHandRaised ?? false,
  }));
};

const isInRoom = (roomId, userId) => {
  const room = rooms.get(roomId);
  if (!room) return false;
  return room.participants.has(userId);
};

const closeRoom = (roomId) => {
  rooms.delete(roomId);
};

export const classroom = {
  joinRoom,
  leaveRoom,
  closeRoom,
  updateParticipantState,
  getParticipants,
  isInRoom,
};

