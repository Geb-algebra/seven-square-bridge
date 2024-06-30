import type { Player } from "~/room/models";

export type Suit = "S" | "H" | "D" | "C";
export const CARDS = [
  "S01",
  "S02",
  "S03",
  "S04",
  "S05",
  "S06",
  "S07",
  "S08",
  "S09",
  "S10",
  "S11",
  "S12",
  "S13",
  "H01",
  "H02",
  "H03",
  "H04",
  "H05",
  "H06",
  "H07",
  "H08",
  "H09",
  "H10",
  "H11",
  "H12",
  "H13",
  "D01",
  "D02",
  "D03",
  "D04",
  "D05",
  "D06",
  "D07",
  "D08",
  "D09",
  "D10",
  "D11",
  "D12",
  "D13",
  "C01",
  "C02",
  "C03",
  "C04",
  "C05",
  "C06",
  "C07",
  "C08",
  "C09",
  "C10",
  "C11",
  "C12",
  "C13",
  "JO1",
  "JO2",
] as const;
export type Card = (typeof CARDS)[number];
/**
 * A card place is a string that represents where a card is located.
 * It can be one of the following: "stock", "waiting-called", "discard-top", "discard", "hand_${playerId}", "meld_${playerId}_${meldId}".
 */
export type CardPlace = string;
export type Deck = Map<Card, CardPlace>;

export const COMMANDS = ["new-game", "play", "discard", "pong", "chow"] as const;
export type Command = (typeof COMMANDS)[number];

export type Game = {
  deck: Deck;
  players: Player[];
  currentPlayerIndex: number;
};
