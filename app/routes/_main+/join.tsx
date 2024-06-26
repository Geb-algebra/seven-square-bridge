import {
  unstable_defineAction as defineAction,
  unstable_defineLoader as defineLoader,
} from "@remix-run/node";
import { Form, useActionData, useFetcher, useLoaderData } from "@remix-run/react";
import invariant from "tiny-invariant";
import { createPlayerInRoomIfNeeded, getPlayersByUserId } from "~/room/lifecycle";
import { authenticator } from "~/services/auth.server";
import type { action as leaveAction } from "./delete-player";

export const loader = defineLoader(async ({ request }) => {
  const user = await authenticator.isAuthenticated(request, { failureRedirect: "/login" });
  const players = await getPlayersByUserId(user.id);
  return players;
});

export const action = defineAction(async ({ request, response, context }) => {
  const user = await authenticator.isAuthenticated(request, { failureRedirect: "/login" });
  try {
    const formData = await request.formData();
    const roomId = formData.get("room-id");
    invariant(typeof roomId === "string", "room id must be a string");
    const player = await createPlayerInRoomIfNeeded(user.id, roomId);
    context.socketIo.to(roomId).emit("join room");
    console.info(`Player ${player.userName} joined room ${roomId}`);
    response.headers.set("Location", `/room/${roomId}`);
    response.status = 302;
  } catch (error) {
    if (error instanceof Error) {
      response.status = 400;
      return { error: error.message };
    }
    console.error(error);
    response.status = 500;
    return { error: "Something went wrong" };
  }
});

function ExistingRoom(props: { roomId: string }) {
  const fetcher = useFetcher<typeof leaveAction>();
  return (
    <li className="flex justify-between gap-4 items-center py-4">
      <p className="font-bold flex-1 text-lg">{props.roomId}</p>
      <Form method="post">
        <button
          type="submit"
          name="room-id"
          value={props.roomId}
          className="rounded-xl h-12 w-32 bg-black text-white flex-0"
        >
          Rejoin
        </button>
      </Form>
      <fetcher.Form method="post" action="/delete-player">
        <button type="submit" name="room-id" value={props.roomId} className="flex-0">
          Leave
        </button>
      </fetcher.Form>
    </li>
  );
}

export default function Page() {
  const loaderData = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  return (
    <div className="max-w-lg h-full mx-auto">
      <h3 className="text-2xl font-bold ml-4 pb-6">Join an existing room</h3>
      <ul>
        {loaderData.map((player) => (
          <ExistingRoom key={player.roomId} roomId={player.roomId} />
        ))}
      </ul>
      <p>or</p>
      <h3 className="text-2xl font-bold ml-4 pb-6">Enter room ID</h3>
      <p className="ml-4 pb-6">{actionData?.error}</p>
      <Form method="post" className="flex justify-center gap-6">
        <input
          type="text"
          id="room-id"
          name="room-id"
          className="border-2 rounded-xl border-black h-12 w-64 px-6 font-bold"
        />
        <button type="submit" className="rounded-xl h-12 w-32 bg-black text-white">
          Join
        </button>
      </Form>
    </div>
  );
}
