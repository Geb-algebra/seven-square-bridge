import { describe, expect, it } from 'vitest';
import { createPlayerInRoom, createRoomAndPlayer, deletePlayerByUserId } from './game.server';
import { createUser } from './user.server';
import { prisma } from '~/db.server';

describe('createRoomAndPlayer', () => {
  it('should create a room and a player', async () => {
    const shouldEmptyRooms = await prisma.room.findMany();
    expect(shouldEmptyRooms).toHaveLength(0);
    const shouldEmptyPlayers = await prisma.player.findMany();
    expect(shouldEmptyPlayers).toHaveLength(0);
    const user = await createUser('test', 'test');
    await createRoomAndPlayer(user.id);
    const room = await prisma.room.findFirst();
    const player = await prisma.player.findFirst();
    expect(player?.roomId).toBe(room?.id);
    expect(player?.userId).toBe(user.id);
  });
});

describe('createPlayerInRoom', () => {
  it('should create a player in a room', async () => {
    const user = await createUser('test', 'test');
    const room = await createRoomAndPlayer(user.id);
    const user2 = await createUser('test2', 'test2');
    await createPlayerInRoom(user2.id, room.id);
    const testedroom = await prisma.room.findFirst({
      include: {
        players: true,
      },
    });
    expect(testedroom?.players).toHaveLength(2);
  });
  it('should not create a player in a room if the room does not exist', async () => {
    const user = await createUser('test', 'test');
    await createRoomAndPlayer(user.id);
    const user2 = await createUser('test2', 'test2');
    expect(createPlayerInRoom(user2.id, 'wrong id')).rejects.toThrow('Room not found');
  });
});

describe('deletePlayerByUserId', () => {
  it('should delete a player', async () => {
    const user = await createUser('test', 'test');
    await createRoomAndPlayer(user.id);
    const player = await prisma.player.findFirst();
    expect(player).not.toBeNull();
    await deletePlayerByUserId(player?.userId ?? '');
    const shouldEmptyPlayers = await prisma.player.findMany();
    expect(shouldEmptyPlayers).toHaveLength(0);
  });
  it('should delete the room that they was in if it is empty', async () => {
    const user = await createUser('test', 'test');
    const room = await createRoomAndPlayer(user.id);
    const shouldHaveRoom = await prisma.room.findFirst();
    expect(shouldHaveRoom).not.toBeNull();
    await deletePlayerByUserId(room.players[0].userId);
    const shouldEmptyRooms = await prisma.room.findMany();
    expect(shouldEmptyRooms).toHaveLength(0);
  });
  it('should not delete the room that they was in if it is not empty', async () => {
    const user = await createUser('test', 'test');
    const user2 = await createUser('test2', 'test2');
    const room = await createRoomAndPlayer(user.id);
    await createPlayerInRoom(user2.id, room.id);
    const shouldHaveRoom = await prisma.room.findFirst();
    expect(shouldHaveRoom).not.toBeNull();
    await deletePlayerByUserId(room.players[0].userId);
    const shouldStillHaveRooms = await prisma.room.findMany();
    expect(shouldStillHaveRooms).not.toBeNull();
  });
});
