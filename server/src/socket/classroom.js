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
  room.participants.set(participant.userId, participant);
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
    role: p.role,
    displayName: p.displayName,
  }));
};

const isInRoom = (roomId, userId) => {
  const room = rooms.get(roomId);
  if (!room) return false;
  return room.participants.has(userId);
};

export const classroom = {
  joinRoom,
  leaveRoom,
  getParticipants,
  isInRoom,
};
