import type { ActionArgs, LoaderArgs, V2_MetaFunction } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import { Form, useActionData } from '@remix-run/react';
import { createPlayerInRoom, deletePlayerByUserId, simplifyPlayer } from '~/models/game.server';
import { authenticator } from '~/services/auth.server';

export async function loader({ request }: LoaderArgs) {
  const user = await authenticator.isAuthenticated(request, { failureRedirect: '/login' });
  deletePlayerByUserId(user.id);
  return json({});
}

export async function action({ request, context }: ActionArgs) {
  const user = await authenticator.isAuthenticated(request, { failureRedirect: '/login' });
  const formData = await request.formData();
  const roomId = formData.get('room-id');
  if (typeof roomId !== 'string')
    return json({ error: 'roomName must be a string' }, { status: 400 });
  try {
    const player = simplifyPlayer(await createPlayerInRoom(user.id, roomId));
    context.socketIo.to(roomId).emit('join room');
    console.info(`Player ${player.userName} joined room ${player.roomId}`);
    return redirect(`/room/${player.roomId}`);
  } catch (error) {
    if (error instanceof Error) {
      return json({ error: error.message }, { status: 400 });
    } else {
      console.error(error);
      return json({ error: 'Something went wrong' }, { status: 500 });
    }
  }
}

export const meta: V2_MetaFunction = () => {
  return [{ title: '' }];
};

export default function Page() {
  const actionData = useActionData<typeof action>();
  return (
    <div className="max-w-lg h-full mx-auto">
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
