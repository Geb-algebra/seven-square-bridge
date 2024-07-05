import type { Card } from "../models";

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
