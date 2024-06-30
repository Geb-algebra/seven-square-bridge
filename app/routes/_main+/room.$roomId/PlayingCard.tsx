import { useState } from "react";
import type { Card } from "~/game/models";

const cardEmoji = {
  S01: "🂡",
  S02: "🂢",
  S03: "🂣",
  S04: "🂤",
  S05: "🂥",
  S06: "🂦",
  S07: "🂧",
  S08: "🂨",
  S09: "🂩",
  S10: "🂪",
  S11: "🂫",
  S12: "🂭",
  S13: "🂮",
  H01: "🂱",
  H02: "🂲",
  H03: "🂳",
  H04: "🂴",
  H05: "🂵",
  H06: "🂶",
  H07: "🂷",
  H08: "🂸",
  H09: "🂹",
  H10: "🂺",
  H11: "🂻",
  H12: "🂽",
  H13: "🂾",
  D01: "🃁",
  D02: "🃂",
  D03: "🃃",
  D04: "🃄",
  D05: "🃅",
  D06: "🃆",
  D07: "🃇",
  D08: "🃈",
  D09: "🃉",
  D10: "🃊",
  D11: "🃋",
  D12: "🃍",
  D13: "🃎",
  C01: "🃑",
  C02: "🃒",
  C03: "🃓",
  C04: "🃔",
  C05: "🃕",
  C06: "🃖",
  C07: "🃗",
  C08: "🃘",
  C09: "🃙",
  C10: "🃚",
  C11: "🃛",
  C12: "🃝",
  C13: "🃞",
  JO1: "🃟",
  JO2: "🃟",
  BCK: "🂠",
};

export default function PlayingCard(props: {
  card: Card | "BCK";
  size: "s" | "l";
  disabled?: boolean;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      disabled={props.disabled ?? false}
      onClick={props.onClick}
      className={`flex justify-center items-baseline leading-[0.6] aspect-[3/4] bg-white transition-transform
      ${props.disabled ? "" : "hover:scale-105"}
      ${props.size === "s" ? "text-[64px] h-14" : "text-[128px] h-28"}
      ${props.card[0] === "H" || props.card[0] === "D" ? "text-red-500" : "text-black"}
      ${props.className}
      `}
    >
      {cardEmoji[props.card]}
    </button>
  );
}
