import type { Card } from "~/game/models";
import PlayingCard from "./PlayingCard";

export default function Meld(props: {
  cards: Card[];
}) {
  return (
    <div className="flex h-32">
      {props.cards.map((card) => (
        <PlayingCard className="-mr-16" key={card} card={card} disabled size="l" />
      ))}
    </div>
  );
}
