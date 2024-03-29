import type { ActionArgs, LoaderArgs, V2_MetaFunction } from '@remix-run/node';
import { json } from '@remix-run/node';
import { Link, useFetcher, useRouteError, isRouteErrorResponse, useParams } from '@remix-run/react';
import { useEffect, useState } from 'react';
import { type Socket, io } from 'socket.io-client';
import invariant from 'tiny-invariant';
import type { SimplePlayer } from '~/models/game.server';
import { simplifyPlayer, getPlayersByRoomId } from '~/models/game.server';
import { authenticator } from '~/services/auth.server';

export async function loader({ request, params }: LoaderArgs) {
  const user = await authenticator.isAuthenticated(request, { failureRedirect: '/login' });
  const roomId = params.roomId;
  console.debug(`loader called by ${user.name}`);
  invariant(roomId, 'roomId is missing');
  const players = (await getPlayersByRoomId(roomId)).map(simplifyPlayer);
  const player = players.find((p) => p.userName === user.name);
  if (!player) {
    throw json({ error: 'You are not in this room' }, { status: 400 });
  }

  return json({
    roomId,
    players,
    player,
  });
}

export async function action({ request, context }: ActionArgs) {
  const user = await authenticator.isAuthenticated(request, { failureRedirect: '/login' });

  // emit command to socket
  const formData = await request.formData();
  console.debug(`action called by ${user.name}`);
  // throw new Error('intensional');
  const command = formData.get('command');
  invariant(typeof command === 'string', 'command must be a string');
  const roomId = formData.get('room-id');
  invariant(typeof roomId === 'string', 'roomId must be a string');
  context.socketIo.to(roomId).emit(command);
  console.debug(`emitted ${command} by ${user.name}`);
  return null;
}

export const meta: V2_MetaFunction = () => {
  return [{ title: '' }];
};

function PlayerPanel(props: { userName: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 rounded-full bg-green-500"></div>
        <div className="text-xl font-bold">{props.userName}</div>
      </div>
    </div>
  );
}

function PlayerPanels(props: { players: SimplePlayer[] | undefined }) {
  if (!props.players) return null;
  return (
    <div className="flex gap-4">
      {props.players.map((player) => (
        <PlayerPanel key={player.id} userName={player.userName} />
      ))}
    </div>
  );
}

function LeaveButton() {
  return (
    <Link to="/">
      <button className="rounded-xl h-12 w-32 bg-black text-white">Leave</button>
    </Link>
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
  } else if (error instanceof Error) {
    return (
      <div>
        <div>
          <h1>Error</h1>
          <p>{error.message}</p>
          <p>The stack trace is:</p>
          <pre>{error.stack}</pre>
        </div>
        <LeaveButton />
      </div>
    );
  } else {
    return (
      <div>
        <h1>Unknown error</h1>
        <LeaveButton />
      </div>
    );
  }
}

export default function Page() {
  const { roomId } = useParams();
  const fetcher = useFetcher<typeof loader>();

  useEffect(() => {
    if (fetcher.state === 'idle' && !fetcher.data) {
      fetcher.load('/room/' + roomId);
    }
  }, [fetcher, roomId]);

  const [socket, setSocket] = useState<Socket>();

  useEffect(() => {
    const socket = io();
    socket.emit('join', { roomId });
    setSocket(socket);
    console.log('socket created');
    return () => {
      socket.disconnect();
    };
  }, [roomId]);

  useEffect(() => {
    console.log('socket handler created');
    if (!socket) return;
    // remove onAny listeners before adding new ones to avoid duplicate listeners
    socket.offAny();
    socket.onAny((event) => {
      console.log(`got ${event}`);
      fetcher.load('/room/' + roomId);
    });
  }, [socket, fetcher, roomId]);

  return (
    <div className="flex flex-col items-center">
      <div className="flex flex-col items-center gap-4">
        <div className="text-2xl font-bold">Room {roomId}</div>
        <PlayerPanels players={fetcher.data?.players} />
      </div>
      <fetcher.Form method="post">
        <input type="hidden" name="command" value="something" />
        <input type="hidden" name="room-id" value={roomId} />
        <button
          type="submit"
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Emit Something
        </button>
      </fetcher.Form>
      <LeaveButton />
    </div>
  );
}
