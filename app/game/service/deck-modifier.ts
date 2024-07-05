import { customAlphabet } from "nanoid";
import type { Player } from "~/room/models";
import type { Card, Deck } from "../models";
import {
  findFirstCardAt,
  getAllMelds,
  getMeldAndPlayerByMeldId,
  pickRandomlyFromStock,
} from "./card-picker";
import { validateMeld } from "./validator";

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

export function draw(player: Player, deck: Deck) {
  const card = pickRandomlyFromStock(deck);
  deck.set(card, `hand_${player.id}`);
}

function makeNewMeld(cards: Card[], player: Player, deck: Deck) {
  if (cards.every((card) => deck.get(card) !== `hand_${player.id}`)) {
    throw new Error(`Player ${player.id} does not have all cards ${cards}`);
  }
  validateMeld(cards);
  const meldId = customAlphabet("abcdefghijklmnopqrstuvwxyz", 6)();
  for (const card of cards) {
    deck.set(card, `meld_${player.id}_${meldId}`);
  }
}

function addToMeld(cards: Card[], player: Player, meldId: string, deck: Deck) {
  if (cards.every((card) => deck.get(card) !== `hand_${player.id}`)) {
    throw new Error(`Player ${player.id} does not have all cards ${cards}`);
  }
  const { meld, playerId } = getMeldAndPlayerByMeldId(meldId, deck);
  validateMeld([...cards, ...meld]);
  for (const card of cards) {
    deck.set(card, `meld_${playerId}_${meldId}`);
  }
}

export function meldIfMeldable(cards: Card[], player: Player, deck: Deck) {
  try {
    makeNewMeld(cards, player, deck);
    return;
  } catch (error) {
    const allMelds = getAllMelds(deck);
    if (!allMelds.has(player.id)) {
      throw new Error(`can't add to melds while you have no melds`);
    }
    for (const melds of getAllMelds(deck).values()) {
      for (const meldId of melds.keys()) {
        try {
          addToMeld(cards, player, meldId, deck);
          return;
        } catch (error) {
          // pass
        }
      }
    }
  }
  throw new Error(`selected cards can't be meld: ${cards}`);
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
