import {
  unstable_defineAction as defineAction,
  unstable_defineLoader as defineLoader,
} from "@remix-run/node";
import {
  Form,
  isRouteErrorResponse,
  useLoaderData,
  useParams,
  useRevalidator,
  useRouteError,
} from "@remix-run/react";
import { useEffect, useState } from "react";
import { type Socket, io } from "socket.io-client";
import invariant from "tiny-invariant";
import { getRoomById } from "~/room/lifecycle";
import type { Player } from "~/room/models";
import { authenticator } from "~/services/auth.server";

export const loader = defineLoader(async ({ request, params }) => {
  const user = await authenticator.isAuthenticated(request, { failureRedirect: "/login" });
  const roomId = params.roomId;
  invariant(roomId, "roomId is required");
  const room = await getRoomById(roomId);
  invariant(room, "Room not found");
  console.log(
    user.id,
    room.players.map((p) => p.userId),
  );
  const player = room.players.find((p) => p.userId === user.id);
  invariant(player, "You may not be in this room");
  return room;
});

export const action = defineAction(async ({ request, context }) => {
  const user = await authenticator.isAuthenticated(request, { failureRedirect: "/login" });

  // emit command to socket
  const formData = await request.formData();
  console.debug(`action called by ${user.name}`);
  const command = formData.get("command");
  invariant(typeof command === "string", "command must be a string");
  const roomId = formData.get("room-id");
  invariant(typeof roomId === "string", "roomId must be a string");
  context.socketIo.to(roomId).emit(command);
  console.debug(`emitted ${command} by ${user.name}`);
  return null;
});

function PlayerPanel(props: { player: Player }) {
  return (
    <div className="flex flex-col items-center">
      <div className="flex items-center gap-2">
        {props.player.isInRoom ? <div className="w-4 h-4 rounded-full bg-green-500" /> : null}
        <div className="text-xl font-bold">{props.player.userName}</div>
      </div>
    </div>
  );
}

function PlayerPanels(props: { players: Player[] | undefined }) {
  if (!props.players) return null;
  return (
    <div className="flex gap-4">
      {props.players.map((player) => (
        <PlayerPanel key={player.id} player={player} />
      ))}
    </div>
  );
}

function LeaveButton() {
  return (
    // <Link to="/">
    <button type="submit" className="rounded-xl h-12 w-32 bg-black text-white">
      Leave
    </button>
    // </Link>
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
        <LeaveButton />
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

export default function Page() {
  const { roomId } = useParams();
  const room = useLoaderData<typeof loader>();
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

  useEffect(() => {
    console.log("socket handler created");
    if (!socket) return;
    socket.onAny((event) => {
      console.log(`got ${event}`);
      revalidator.revalidate();
    });
    return () => {
      socket.removeAllListeners();
    };
  }, [socket, revalidator.revalidate]);

  return (
    <div className="flex flex-col items-center">
      <div className="flex flex-col items-center gap-4">
        <div className="text-2xl font-bold">Room {roomId}</div>
        <PlayerPanels players={room.players} />
      </div>
      <Form method="post">
        <input type="hidden" name="command" value="something" />
        <input type="hidden" name="room-id" value={roomId} />
        <button
          type="submit"
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Emit Something
        </button>
      </Form>
    </div>
  );
}
