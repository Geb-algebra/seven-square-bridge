import type { ActionArgs, LoaderArgs, V2_MetaFunction } from '@remix-run/node';
import { json } from '@remix-run/node';
import { Form } from '@remix-run/react';
import * as React from 'react';
import { useSocket } from '~/context';
import { authenticator } from '~/services/auth.server';

export async function loader({ request }: LoaderArgs) {
  const user = authenticator.isAuthenticated(request, { failureRedirect: '/login' });
  return json(user);
}

export async function action({ request, context }: ActionArgs) {
  const formData = await request.formData();
  const input = formData.get('input') ?? '';
  if (typeof input !== 'string') throw new Error('input must be a string');
  console.log(input);
  context.socketIo.emit('chat message', input);
  return json({});
}

export const meta: V2_MetaFunction = () => {
  return [{ title: '' }];
};

export default function Page() {
  const socket = useSocket();
  const [messages, setMessages] = React.useState<string[]>([]);

  React.useEffect(() => {
    if (!socket) return;

    socket.on('chat message', (data) => {
      console.log(data);
      setMessages((messages) => [...messages, data]);
    });
  }, [socket]);

  const messagesList = messages.map((message, index) => <li key={index}>{message}</li>);

  return (
    <div>
      {messagesList}
      <Form method="post">
        <input type="text" name="input" />
        <button type="submit">Send</button>
      </Form>
    </div>
  );
}
