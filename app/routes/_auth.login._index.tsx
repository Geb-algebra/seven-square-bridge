import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { Form, useActionData, useLoaderData } from "@remix-run/react";
import { handleFormSubmit } from "remix-auth-webauthn/browser";

import AuthButton from "~/components/AuthButton.tsx";
import AuthContainer from "~/components/AuthContainer.tsx";
import AuthErrorMessage from "~/components/AuthErrorMessage.tsx";
import GoogleAuthButton from "~/components/GoogleAuthButton.tsx";
import { authenticator, webAuthnStrategy } from "~/services/auth.server.ts";
import { getSession, sessionStorage } from "~/services/session.server.ts";

export async function loader({ request, response }: LoaderFunctionArgs) {
  await authenticator.isAuthenticated(request, { successRedirect: "/" });
  const session = await getSession(request);
  const options = await webAuthnStrategy.generateOptions(request, null);
  session.set("challenge", options.challenge);
  response?.headers.append("Set-Cookie", await sessionStorage.commitSession(session));
  response?.headers.append("Cache-Control", "no-store");

  return options;
}

export async function action({ request }: ActionFunctionArgs) {
  try {
    await authenticator.authenticate("webauthn", request, {
      successRedirect: "/",
    });
  } catch (error) {
    if (error instanceof Response && error.status >= 400) {
      return { error: (await error.json()) as { message: string } };
    }
    throw error;
  }
  return null;
}

export const meta: MetaFunction = () => {
  return [{ title: "Log In" }];
};

export default function LoginPage() {
  const options = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  return (
    <div className="flex flex-col gap-6">
      <AuthErrorMessage message={actionData?.error.message} />
      <AuthContainer>
        <Form method="post" onSubmit={handleFormSubmit(options)}>
          <AuthButton type="submit" name="intent" value="authentication">
            Log In with Passkey
          </AuthButton>
        </Form>
        <Form method="post" action="/google">
          <GoogleAuthButton value="google">Log In with Google</GoogleAuthButton>
        </Form>
      </AuthContainer>
    </div>
  );
}
