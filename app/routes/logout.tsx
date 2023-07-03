import type { LoaderArgs } from '@remix-run/node';
import { deletePlayerByUserId } from '~/models/game.server';

import { authenticator } from '~/services/auth.server';

export async function loader({ request }: LoaderArgs) {
  const user = await authenticator.isAuthenticated(request, { failureRedirect: '/login' });
  deletePlayerByUserId(user.id);
  return authenticator.logout(request, { redirectTo: '/login' });
}
