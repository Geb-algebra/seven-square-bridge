import { type V2_MetaFunction, json, type LoaderArgs } from '@remix-run/node';
import { Link, Outlet, useLoaderData } from '@remix-run/react';
import { authenticator } from '~/services/auth.server';

export async function loader({ request }: LoaderArgs) {
  const user = await authenticator.isAuthenticated(request, {
    failureRedirect: '/login',
  });
  return json(user);
}

export const meta: V2_MetaFunction = () => {
  return [{ title: 'New Remix App' }, { name: 'description', content: 'Welcome to Remix!' }];
};

function NavBar() {
  const user = useLoaderData<typeof loader>();
  return (
    <div className="flex justify-between items-center h-16 bg-black text-white relative font-mono">
      <Link to="/">
        <h1 className="text-2xl font-bold text-white ml-4">7^2 Bridge</h1>
      </Link>
      <p className="text-xl font-bold text-white mr-4">logged in as {user.name}</p>
      <Link to="/logout" className="text-xl font-bold text-white mr-4">
        Log out
      </Link>
    </div>
  );
}

export default function Index() {
  return (
    <div className="w-screen h-screen">
      <NavBar />
      <div className="w-screen mx-auto pt-6">
        <Outlet />
      </div>
    </div>
  );
}
