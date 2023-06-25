import type { ActionArgs, LoaderArgs, V2_MetaFunction } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import { useLoaderData, useActionData, useSearchParams } from '@remix-run/react';
import * as React from 'react';
import { useSocket } from '~/context';
import { authenticator } from '~/services/auth.server';

export async function loader({ request }: LoaderArgs) {
  const user = authenticator.isAuthenticated(request, { failureRedirect: '/login' });
  return json(user);
}

export async function action({ request }: ActionArgs) {
  return redirect('/home');
}

export const meta: V2_MetaFunction = () => {
  return [{ title: '' }];
};

export default function Page() {
  const socket = useSocket();
  const [messages, setMessages] = React.useState<string[]>([]);

  React.useEffect(() => {
    if (!socket) return;

    socket.on('event', (data) => {
      console.log(data);
    });

    socket.on('chat message', (data) => {
      console.log(data);
      setMessages((messages) => [...messages, data]);
    });

    socket.emit('event', 'ping');
  }, [socket]);

  const [searchParams] = useSearchParams();
  const loaderData = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const input = formData.get('input');
    console.log(formData);
    socket?.emit('chat message', input);
  };

  const messagesList = messages.map((message, index) => <li key={index}>{message}</li>);

  return (
    <div>
      {messagesList}
      <form method="post" onSubmit={handleSubmit}>
        <input type="text" name="input" />
        <button type="submit">Send</button>
      </form>
    </div>
  );
}
