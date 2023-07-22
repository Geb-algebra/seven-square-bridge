import { type V2_MetaFunction, json, type LoaderArgs } from '@remix-run/node';
import { Link } from '@remix-run/react';
import { deletePlayerByUserId } from '~/models/game.server';
import { authenticator } from '~/services/auth.server';

export async function loader({ request }: LoaderArgs) {
  const user = await authenticator.isAuthenticated(request, {
    failureRedirect: '/login',
  });
  deletePlayerByUserId(user.id);
  return json(user);
}

export const meta: V2_MetaFunction = () => {
  return [{ title: 'New Remix App' }, { name: 'description', content: 'Welcome to Remix!' }];
};

function Button(props: { className: string; name: string; linkTo: string }) {
  return (
    <Link to={props.linkTo}>
      <button className={'w-36 h-24 ' + props.className ?? ''}>{props.name}</button>
    </Link>
  );
}

export default function Index() {
  return (
    <div className="max-w-lg h-full mx-auto flex justify-between">
      <Button
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        name="Create Room"
        linkTo="/create"
      />
      <Button
        className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
        name="Join Room"
        linkTo="/join"
      />
    </div>
  );
}
