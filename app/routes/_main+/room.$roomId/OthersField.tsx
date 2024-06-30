import type { Card } from "~/game/models";
import Meld from "./Meld";
import OthersHand from "./OthersHand";

export default function OthersField(props: {
  numHandCards: number;
  playerName: string;
  melds: Card[][];
}) {
  return (
    <div className="flex flex-col items-center">
      <OthersHand numCards={props.numHandCards} playerName={props.playerName} />
      <div className="flex gap-20 items-center mt-4">
        {props.melds.map((meld, i) => (
          <Meld key={meld.join(",")} cards={meld} />
        ))}
      </div>
    </div>
  );
}
