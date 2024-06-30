import {
  unstable_defineAction as defineAction,
  unstable_defineLoader as defineLoader,
} from "@remix-run/node";
import {
  Form,
  isRouteErrorResponse,
  useFetcher,
  useLoaderData,
  useParams,
  useRevalidator,
  useRouteError,
} from "@remix-run/react";
import { useEffect, useState } from "react";
import { type Socket, io } from "socket.io-client";
import invariant from "tiny-invariant";
import { getGameByRoomId } from "~/game/lifecycle";
import { COMMANDS, type Card } from "~/game/models";
import { findAllCardsAt, findFirstCardAt, getHandsAndMeldsFromDeck } from "~/game/service";
import { getRoomById } from "~/room/lifecycle";
import type { Player } from "~/room/models";
import { authenticator } from "~/services/auth.server";
import { getSession, sessionStorage } from "~/services/session.server";
import type { loader as gameLoader } from "../room.$roomId.game";
import DiscardPile from "./DiscardPile";
import MyField from "./MyField";
import OthersField from "./OthersField";
import Stock from "./Stock";

export const loader = defineLoader(async ({ request, response, params }) => {
  const user = await authenticator.isAuthenticated(request, { failureRedirect: "/login" });
  const roomId = params.roomId;
  invariant(roomId, "roomId is required");
  const room = await getRoomById(roomId);
  invariant(room, "Room not found");
  const player = room.players.find((p) => p.userId === user.id);
  invariant(player, "You may not be in this room");
  const game = await getGameByRoomId(roomId);

  const session = await getSession(request);
  session.set("player", player);
  response.headers.set("Set-Cookie", await sessionStorage.commitSession(session));
  return { room, player, game };
});

export const action = defineAction(async ({ request, context }) => {
  const user = await authenticator.isAuthenticated(request, { failureRedirect: "/login" });

  // emit command to socket
  const formData = await request.formData();
  console.debug(`action called by ${user.name}`);
  const command = formData.get("command");
  invariant(typeof command === "string", "command must be a string");
  invariant((COMMANDS as readonly string[]).includes(command), "Invalid command");
  const roomId = formData.get("room-id");
  invariant(typeof roomId === "string", "roomId must be a string");
  context.socketIo.to(roomId).emit(command);
  console.debug(`emitted ${command} by ${user.name}`);
  return null;
});

export default function Page() {
  const { roomId } = useParams();
  const { room, player: me, game: loaderGame } = useLoaderData<typeof loader>();
  const revalidator = useRevalidator();

  const [socket, setSocket] = useState<Socket>();

  useEffect(() => {
    const socket = io();
    socket.emit("join", { roomId });
    setSocket(socket);
    console.log("socket created");
    return () => {
      console.log("before unload");
      socket.disconnect();
    };
  }, [roomId]);

  const gameFetcher = useFetcher<typeof gameLoader>();
  useEffect(() => {
    console.log("socket handler created");
    if (!socket) return;
    socket.on("join room", () => {
      console.log("got join room");
      revalidator.revalidate();
    });
    socket.onAny((event) => {
      if (event !== "join room") {
        console.log(`got ${event}`);
        gameFetcher.load(`/room/${roomId}/game`);
      }
    });
    return () => {
      socket.removeAllListeners();
    };
  }, [socket, revalidator.revalidate, gameFetcher.load, roomId]);

  const [selectedCards, setSelectedCards] = useState<Card[]>([]);
  // loader provide the game for initial render. gameFetcher provide the game for subsequent renders.
  const game = gameFetcher.data?.game ?? loaderGame ?? null;
  if (!game) {
    return (
      <>
        <div className="text-2xl font-bold">Room {roomId}</div>
        <gameFetcher.Form method="post" action="game">
          <button
            type="submit"
            name="command"
            value="start-game"
            disabled={room.players.length !== 4}
          >
            Start game
          </button>
        </gameFetcher.Form>
      </>
    );
  }
  const myCards = getHandsAndMeldsFromDeck(game.deck, me.id);
  const playerCards = game.players.map(
    (player) =>
      [player, getHandsAndMeldsFromDeck(game.deck, player.id)] as [
        Player,
        ReturnType<typeof getHandsAndMeldsFromDeck>,
      ],
  );
  return (
    <div className="flex flex-col items-center gap-4 h-screen">
      <div className="text-2xl font-bold flex-0">Room {roomId}</div>
      <div className="flex w-full justify-between flex-1">
        {playerCards.map(([player, cards]) => {
          if (!(player.id === me.id)) {
            return (
              <OthersField
                key={player.id}
                numHandCards={cards.hand.length}
                playerName={player.userName}
                melds={Array.from(cards.melds.values())}
              />
            );
          }
          return null;
        })}
      </div>
      <div className="flex justify-center flex-1">
        <DiscardPile
          topCard={
            findFirstCardAt("waiting-called", game.deck) ??
            findFirstCardAt("discard-top", game.deck) ??
            undefined
          }
        />
        <Stock isEmpty={false} />
      </div>
      <gameFetcher.Form
        method="post"
        action="game"
        onSubmit={() => setSelectedCards([])}
        className="flex-1"
      >
        <input type="hidden" name="selected-cards" value={selectedCards.join(",")} />
        <MyField
          hand={myCards.hand}
          selectedCards={selectedCards}
          setSelectedCards={setSelectedCards}
          melds={Array.from(myCards.melds.values())}
          disabled={game.currentPlayerIndex !== game.players.findIndex((p) => p.id === me.id)}
        />
      </gameFetcher.Form>
    </div>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();

  if (isRouteErrorResponse(error)) {
    return (
      <>
        <div>
          <h1>
            {error.status} {error.statusText}
          </h1>
          <p>{error.data}</p>
        </div>
      </>
    );
  }
  if (error instanceof Error) {
    return (
      <div>
        <div>
          <h1>Error</h1>
          <p>{error.message}</p>
          <p>The stack trace is:</p>
          <pre>{error.stack}</pre>
        </div>
      </div>
    );
  }
  return (
    <div>
      <h1>Unknown error</h1>
    </div>
  );
}
