import type { Room, Player } from '@prisma/client';

import { prisma } from '~/db.server';

export type { Room, Player } from '@prisma/client';

/**
 * create a new room and a player with a socket id and a user
 */
// export const createRoom = async (socketId) => {
