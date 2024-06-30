import type { Card } from "~/game/models";
import PlayingCard from "./PlayingCard";

export default function Stock(props: {
  isEmpty: boolean;
}) {
  return (
    <div className="flex h-32">
      {props.isEmpty ? (
        <div className="flex items-center justify-center w-20 h-28 bg-gray-200">
          <div className="text-2xl text-gray-400">Empty</div>
        </div>
      ) : (
        <PlayingCard card="BCK" disabled size="l" />
      )}
    </div>
  );
}
