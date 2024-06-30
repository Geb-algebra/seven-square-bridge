import { prisma } from "~/db.server";
import type { Player } from "~/room/models";
import { CARDS, type Card, type Deck, type Game } from "./models";
import { initializeDeck } from "./service";

/**
 * Returns a new deck with all cards in the stock.
 */
export function getDeck() {
  return new Map(CARDS.map((card) => [card, "stock"]));
}

export function getInitializedGame(players: Player[]) {
  const deck = getDeck();
  initializeDeck(players, deck);
  return {
    deck,
    players,
    currentPlayerIndex: 0,
  };
}

export async function saveGameByRoomId(roomId: string, game: Game) {
  const gameJson = JSON.stringify({
    ...game,
    deck: Array.from(game.deck.entries()),
  });
  await prisma.room.update({
    where: {
      id: roomId,
    },
    data: {
      game: gameJson,
    },
  });
}

export async function getGameByRoomId(roomId: string): Promise<Game | null> {
  const room = await prisma.room.findUnique({
    where: {
      id: roomId,
    },
  });
  if (!room) {
    throw new Error("Room not found");
  }
  if (!room.game) return null;
  const gameJson = JSON.parse(room.game);
  return {
    deck: new Map(gameJson.deck),
    currentPlayerIndex: gameJson.currentPlayerIndex,
    players: gameJson.players,
  };
}
