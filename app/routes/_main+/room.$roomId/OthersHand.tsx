import PlayingCard from "./PlayingCard";

export default function OthersHand(props: {
  numCards: number;
  playerName: string;
}) {
  return (
    <div className="flex flex-col items-center">
      <div className="text-xl font-bold mb-4">{props.playerName}</div>
      <div className="flex">
        {Array.from({ length: props.numCards }).map((_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: tmp
          <PlayingCard key={i} card="BCK" size="s" disabled />
        ))}
      </div>
    </div>
  );
}
