import type { Card } from "~/game/models";
import PlayingCard from "./PlayingCard";

export default function MyHand(props: {
  cards: Card[];
  disabled?: boolean;
  selectedCards: Card[];
  setSelectedCards: (cards: Card[]) => void;
}) {
  return (
    <div className="flex h-32">
      {props.cards.map((card) => (
        <PlayingCard
          key={card}
          card={card}
          disabled={props.disabled}
          size="l"
          onClick={
            props.selectedCards.includes(card)
              ? () => props.setSelectedCards(props.selectedCards.filter((c) => c !== card))
              : () => props.setSelectedCards([...props.selectedCards, card])
          }
          className={props.selectedCards.includes(card) ? "mb-auto" : "mt-auto"}
        />
      ))}
    </div>
  );
}
