import { customAlphabet } from "nanoid";

import { prisma } from "~/db.server";
import type { Player, Room } from "./models";

/**
 * create a new room and a player from a user
 */
export async function createRoomAndPlayer(userId: string): Promise<Room> {
  const prismaRoom = await prisma.room.create({
    data: {
      id: customAlphabet("1234567890abcdefghijklmnopqrstuvwxyz", 8)(),
      players: {
        create: {
          userId,
        },
      },
    },
    include: {
      players: {
        include: {
          user: true,
        },
      },
    },
  });
  return {
    id: prismaRoom.id,
    players: prismaRoom.players.map((player) => ({
      id: player.id,
      userId: player.userId,
      userName: player.user?.name ?? "Unknown",
      roomId: player.roomId,
    })),
  };
}

export async function createPlayerInRoomIfNeeded(userId: string, roomId: string): Promise<Player> {
  const room = await prisma.room.findFirst({
    where: {},
  });
  if (!room) {
    throw new Error("Room not found");
  }
  const player = await prisma.player.upsert({
    where: {
      userId_roomId: {
        userId,
        roomId,
      },
    },
    create: {
      userId,
      roomId,
      isInRoom: true,
    },
    update: {},
    include: {
      user: true,
    },
  });
  return {
    id: player.id,
    userId: player.userId,
    userName: player.user?.name ?? "Unknown",
    roomId: player.roomId,
  };
}

export async function getRoomById(roomId: string): Promise<Room | null> {
  const room = await prisma.room.findFirst({
    where: {
      id: roomId,
    },
    include: {
      players: {
        include: {
          user: true,
        },
      },
    },
  });
  if (!room) {
    return null;
  }
  return {
    id: room.id,
    players: room.players.map((player) => ({
      id: player.id,
      userId: player.userId,
      userName: player.user?.name ?? "Unknown",
      roomId: player.roomId,
    })),
  };
}

export async function getPlayersByUserId(userId: string): Promise<Player[]> {
  const players = await prisma.player.findMany({
    where: {
      userId,
    },
    include: {
      user: true,
    },
  });
  return players.map((player) => ({
    id: player.id,
    userId: player.userId,
    userName: player.user?.name ?? "Unknown",
    roomId: player.roomId,
  }));
}

export async function deletePlayerAndEmptyRoom(roomId: string, userId: string): Promise<void> {
  const player = await prisma.player.findFirst({
    where: {
      roomId,
      userId,
    },
  });
  if (!player) {
    throw new Error("Player not found");
  }
  await prisma.player.delete({
    where: {
      id: player.id,
    },
  });
  const room = await prisma.room.findFirst({
    where: {},
    include: {
      players: true,
    },
  });
  if (!room) {
    throw new Error("Room not found");
  }
  if (room.players.length === 0) {
    await prisma.room.delete({
      where: {
        id: room.id,
      },
    });
  }
}
