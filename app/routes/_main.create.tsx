import type { LoaderArgs, V2_MetaFunction } from '@remix-run/node';
import { redirect } from '@remix-run/node';
import { createRoomAndPlayer } from '~/models/game.server';
import { authenticator } from '~/services/auth.server';

export async function loader({ request }: LoaderArgs) {
  const user = await authenticator.isAuthenticated(request, { failureRedirect: '/login' });
  const room = await createRoomAndPlayer(user.id);
  console.info(`Room ${room.id} created by ${user.name}`);
  return redirect(`/room/${room.id}`);
}

export const meta: V2_MetaFunction = () => {
  return [{ title: '' }];
};
