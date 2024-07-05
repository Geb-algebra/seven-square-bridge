import invariant from "tiny-invariant";
import type { Card, Deck } from "../models";

function findAllCardsAt(place: string, deck: Deck) {
  return Array.from(deck.entries())
    .filter(([card, cardPlace]) => cardPlace === place)
    .map(([card]) => card);
}

export function findFirstCardAt(place: string, deck: Deck) {
  const cards = findAllCardsAt(place, deck);
  if (cards.length === 0) return null;
  return cards[0];
}

export function pickRandomlyFromStock(deck: Deck) {
  const stock = findAllCardsAt("stock", deck);
  const card = stock[Math.floor(Math.random() * stock.length)];
  return card;
}

export function getAllMelds(deck: Deck) {
  // return playerId -> meldId -> card[]
  const melds = new Map<string, Map<string, Card[]>>();
  for (const [card, cardPlace] of deck.entries()) {
    if (!cardPlace.startsWith("meld_")) continue;
    const [_, playerId, meldId] = cardPlace.split("_");
    if (!melds.has(playerId)) melds.set(playerId, new Map());
    const playerMelds = melds.get(playerId);
    invariant(playerMelds, `Player ${playerId} not found`);
    if (!playerMelds.has(meldId)) playerMelds.set(meldId, []);
    playerMelds.get(meldId)?.push(card);
  }
  return melds;
}

export function getMeldAndPlayerByMeldId(
  meldId: string,
  deck: Deck,
): { meld: Card[]; playerId: string } {
  const allMelds = getAllMelds(deck);
  for (const [playerId, playerMelds] of allMelds.entries()) {
    if (playerMelds.has(meldId)) {
      return {
        meld: playerMelds.get(meldId) as Card[],
        playerId,
      };
    }
  }
  throw new Error(`Meld ${meldId} not found`);
}

export function getHandsAndMeldsFromDeck(deck: Deck, playerId: string) {
  return {
    hand: findAllCardsAt(`hand_${playerId}`, deck),
    melds: getAllMelds(deck).get(playerId) ?? new Map<string, Card[]>(),
  };
}
