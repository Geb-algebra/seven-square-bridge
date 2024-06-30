import type { Card, Deck } from "~/game/models";
import Meld from "./Meld";
import MyHand from "./MyHand";

export default function MyField(props: {
  hand: Card[];
  selectedCards: Card[];
  setSelectedCards: (cards: Card[]) => void;
  melds: Card[][];
  disabled?: boolean;
  className?: string;
}) {
  const nothingSelected = props.selectedCards.length === 0;
  const handCleared = props.hand.length === 0;
  return (
    <div className={`flex flex-col items-center ${props.className}`}>
      <div className="flex gap-20 items-center mt-4">
        {props.melds.map((meld, i) => (
          <Meld key={meld.join(",")} cards={meld} />
        ))}
      </div>
      <div className="flex gap-6">
        <div className="w-16" />
        {handCleared ? (
          <button
            type="submit"
            name="command"
            value="start-game"
            disabled={props.disabled}
            className={`
              h-8 w-64 my-2 rounded-md hover:scale-105 transition-transform 
              ${props.disabled ? "bg-inherit" : "bg-blue-400"}
            `}
          >
            {handCleared && !props.disabled ? <p className="mx-auto">Next Game</p> : null}
          </button>
        ) : (
          <button
            type="submit"
            name="command"
            value="meld"
            disabled={nothingSelected || props.disabled}
            className={`
              h-8 w-64 my-2 rounded-md hover:scale-105 transition-transform 
              ${!(nothingSelected || props.disabled) ? "bg-gray-200" : "bg-inherit"}
            `}
          >
            {!(nothingSelected || props.disabled) ? <p className="mx-auto">↑</p> : null}
          </button>
        )}
        <button
          type="submit"
          name="command"
          value="discard"
          disabled={props.selectedCards.length !== 1}
          className={`h-8 w-16 my-2 rounded-md hover:scale-105 transition-transform ${props.selectedCards.length === 1 ? "bg-red-400" : "bg-inherit"}`}
        >
          {props.selectedCards.length === 1 ? <p className="mx-auto">discard</p> : null}
        </button>
      </div>
      <MyHand
        cards={props.hand}
        selectedCards={props.selectedCards}
        setSelectedCards={props.setSelectedCards}
        disabled={props.disabled}
      />
    </div>
  );
}
