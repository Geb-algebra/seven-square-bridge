import type { Card } from "~/game/models";
import PlayingCard from "./PlayingCard";

export default function DiscardPile(props: {
  topCard?: Card;
}) {
  return (
    <div className="flex h-32">
      {props.topCard ? (
        <PlayingCard card={props.topCard} size="l" />
      ) : (
        <div className="flex items-center justify-center w-20 h-28 bg-gray-200">
          <div className="text-2xl text-gray-400">Empty</div>
        </div>
      )}
    </div>
  );
}
