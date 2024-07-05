import type { Card } from "../models";

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

export {
  findFirstCardAt,
  getMeldAndPlayerByMeldId,
} from "./card-picker";

export { validateMeld } from "./validator";

export {
  discard,
  draw,
  finishWaitingCalled,
  initializeDeck,
} from "./deck-modifier";
