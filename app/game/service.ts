import { customAlphabet } from "nanoid";
import type { Player } from "~/room/models";
import type { Card, Deck } from "./models";

export function initializeDeck(players: Player[], deck: Deck) {
  const dora = pickRandomlyFromStock(deck);
  deck.set(dora, "dora");
  for (const player of players) {
    for (let i = 0; i < 7; i++) {
      draw(player, deck);
    }
  }
  draw(players[0], deck);
  return deck;
}

export function findAllCardsAt(place: string, deck: Deck) {
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

export function draw(player: Player, deck: Deck) {
  const card = pickRandomlyFromStock(deck);
  deck.set(card, `hand_${player.id}`);
}

export function discard(card: Card, player: Player, deck: Deck) {
  if (deck.get(card) !== `hand_${player.id}`) {
    throw new Error(`Player ${player.id} does not have card ${card}`);
  }
  deck.set(card, "waiting-called");
}

export function finishWaitingCalled(deck: Deck) {
  const waitingCalledCard = findFirstCardAt("waiting-called", deck);
  if (!waitingCalledCard) return;
  const discardTopCard = findFirstCardAt("discard-top", deck);
  deck.set(waitingCalledCard, "discard-top");
  if (discardTopCard) deck.set(discardTopCard, "discard");
}

function areAllCardsConsecutiveWithSameSuit(cards: Card[]) {
  const cardsCopy = [...cards];
  if (cards.length <= 1) return false;
  if (!cards.every((card) => card[0] === cards[0][0])) return false;
  cardsCopy.sort();
  for (let i = 0; i < cards.length - 1; i++) {
    if (Number.parseInt(cardsCopy[i + 1].slice(1)) - Number.parseInt(cardsCopy[i].slice(1)) !== 1) {
      return false;
    }
  }
  return true;
}

function areAllRanksEqual(cards: Card[]) {
  return cards.every((card) => card.slice(1) === cards[0].slice(1));
}

export function validateMeld(cards: Card[]) {
  if (cards.length >= 3 && areAllCardsConsecutiveWithSameSuit(cards)) return;
  if (cards.length >= 3 && areAllRanksEqual(cards)) return;
  if (cards.some((card) => card.slice(1) === "07")) {
    if (cards.length === 1) return;
    if (cards.length >= 2 && areAllCardsConsecutiveWithSameSuit(cards)) return;
  }
  throw new Error(`Invalid meld: ${cards.join(", ")}`);
}

export function makeNewMeld(cards: Card[], player: Player, deck: Deck) {
  if (cards.every((card) => deck.get(card) !== `hand_${player.id}`)) {
    throw new Error(`Player ${player.id} does not have all cards ${cards}`);
  }
  validateMeld(cards);
  const meldId = customAlphabet("abcdefghijklmnopqrstuvwxyz", 6)();
  for (const card of cards) {
    deck.set(card, `meld_${player.id}_${meldId}`);
  }
}

export function getAllMelds(deck: Deck) {
  const melds = Array.from(deck.entries())
    .filter(([card, place]) => place.startsWith("meld"))
    .reduce(
      (acc, [card, place]) => {
        const meldId = place.split("_")[2];
        if (!acc.get(meldId)) acc.set(meldId, []);
        acc.get(meldId)?.push(card);
        return acc;
      },
      new Map() as Map<string, Card[]>,
    );
  return melds;
}

export function getMeldAndPlayerByMeldId(
  meldId: string,
  deck: Deck,
): { meld: Card[]; playerId: string } {
  const meld = Array.from(deck.keys()).filter((card) => {
    const cardMeldId = deck.get(card)?.split("_")[2];
    return cardMeldId === meldId;
  });
  if (meld.length === 0) throw new Error(`Meld ${meldId} not found`);
  const playerId = deck.get(meld[0])?.split("_")[1];
  if (!playerId) throw new Error(`Player not found for meld ${meldId}`);
  return {
    meld,
    playerId,
  };
}

export function addToMeld(cards: Card[], player: Player, meldId: string, deck: Deck) {
  if (cards.every((card) => deck.get(card) !== `hand_${player.id}`)) {
    throw new Error(`Player ${player.id} does not have all cards ${cards}`);
  }
  const { meld, playerId } = getMeldAndPlayerByMeldId(meldId, deck);
  validateMeld([...cards, ...meld]);
  for (const card of cards) {
    deck.set(card, `meld_${playerId}_${meldId}`);
  }
}

export function isSelectedCardMeldable(selectedCards: Card[], deck: Deck) {
  try {
    validateMeld(selectedCards);
    return true;
  } catch {
    const existingMelds = getAllMelds(deck);
    for (const meld of existingMelds.values()) {
      try {
        validateMeld([...selectedCards, ...meld]);
        return true;
      } catch {}
    }
    return false;
  }
}

export function getHandsAndMeldsFromDeck(deck: Deck, playerId: string) {
  const hand = Array.from(deck.entries())
    .filter(([card, place]) => place === `hand_${playerId}`)
    .map(([card]) => card);
  const melds = Array.from(deck.entries())
    .filter(([card, place]) => place.startsWith(`meld_${playerId}`))
    .reduce(
      (acc, [card, place]) => {
        const meldId = place.split("_")[2];
        if (!acc.get(meldId)) acc.set(meldId, []);
        acc.get(meldId)?.push(card);
        return acc;
      },
      new Map() as Map<string, Card[]>,
    );
  return { hand, melds };
}

export function calcScore(hand: Card[], dora: Card) {
  let score = hand.reduce((acc, card) => {
    if (["JO1", "JO2"].includes(card)) return acc + 100;
    if (["S07", "H07", "D07", "C07"].includes(card)) return acc + 50;
    return acc + Number.parseInt(card.slice(1));
  }, 0);
  const numAces = hand.filter((card) => card.slice(1) === "01").length;
  score = score * 2 ** numAces;
  const numJoker = hand.filter((card) => card.slice(0, 2) === "JO").length;
  score = score * 5 ** numJoker;
  if (["JO1", "JO2"].includes(dora)) {
    if (["JO1", "JO2"].includes(hand[0])) {
      score = score ** 2;
    }
  } else {
    const numConsecutiveToDora = hand.filter(
      (card) => Number.parseInt(card.slice(1)) === (Number.parseInt(dora.slice(1)) + 1) % 13,
    ).length;
    score = score * 2 ** numConsecutiveToDora;
  }
  return score;
}
