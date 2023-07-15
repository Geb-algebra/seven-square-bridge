import type { Room, Player } from '@prisma/client';
import { Prisma } from '@prisma/client';

import { prisma } from '~/db.server';

export type { Room, Player } from '@prisma/client';

const playerWithUser = Prisma.validator<Prisma.PlayerArgs>()({
  include: {
    user: true,
  },
});
export type PlayerWithUser = Prisma.PlayerGetPayload<typeof playerWithUser>;
export type SimplePlayer = {
  id: Player['id'];
  roomId: Room['id'];
  userName: PlayerWithUser['user']['name'];
};
export const simplifyPlayer = (player: PlayerWithUser): SimplePlayer => {
  return {
    id: player.id,
    roomId: player.roomId,
    userName: player.user.name,
  };
};

/**
 * create a new room and a player from a user
 */
export async function createRoomAndPlayer(userId: string) {
  const room = await prisma.room.create({
    data: {
      players: {
        create: {
          userId,
        },
      },
    },
    include: {
      players: true,
    },
  });
  return room;
}

/**
 * create a new player in a room
 */
export async function createPlayerInRoom(userId: string, roomId: string): Promise<PlayerWithUser> {
  const room = await prisma.room.findFirst({
    where: {
      id: roomId,
    },
  });
  if (!room) {
    throw new Error('Room not found');
  }
  const player = await prisma.player.create({
    data: {
      userId,
      roomId,
    },
    include: {
      user: true,
    },
  });
  return player;
}

/**
 * get a room by id
 *
 * @param id room id
 */
export async function getRoomById(id: string) {
  const room = await prisma.room.findFirst({
    where: {
      id,
    },
  });
  return room;
}

/**
 * get all players in a room
 */
export async function getPlayersByRoomId(roomId: string): Promise<PlayerWithUser[]> {
  const players = await prisma.player.findMany({
    where: {
      roomId,
    },
    include: {
      user: true,
    },
  });
  return players;
}

/**
 * get a player by user id and room id
 * @param userId user id
 * @param roomId room id
 * @returns
 * - null if player not found
 * - player if found
 */
export async function getPlayerByUserIdAndRoomId(
  userId: string,
  roomId: string,
): Promise<PlayerWithUser | null> {
  const player = await prisma.player.findFirst({
    where: {
      userId,
      roomId,
    },
    include: {
      user: true,
      room: true,
    },
  });
  return player;
}

/**
 * delete a player by user id and delete the room he was in if it's empty
 */
export async function deletePlayerByUserId(userId: string) {
  const player = await prisma.player.findFirst({
    where: {
      userId,
    },
  });
  if (!player) {
    return;
  }
  const roomId = player.roomId;
  await prisma.player.delete({
    where: {
      userId_roomId: {
        userId,
        roomId,
      },
    },
  });
  const players = await prisma.player.findMany({
    where: {
      roomId,
    },
  });
  if (players.length === 0) {
    await prisma.room.delete({
      where: {
        id: roomId,
      },
    });
  }
}
