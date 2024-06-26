import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { Link, useFetcher, useLoaderData } from "@remix-run/react";
import { useState } from "react";
import { AccountRepository } from "~/accounts/lifecycle/account.server.ts";
import type { Authenticator } from "~/accounts/models/account.ts";
import AuthButton from "~/components/AuthButton.tsx";
import AuthFormInput from "~/components/AuthFormInput.tsx";
import Icon from "~/components/Icon.tsx";
import Overlay from "~/components/Overlay.tsx";
import PasskeyHero from "~/components/PasskeyHero.tsx";
import { authenticator } from "~/services/auth.server.ts";

import { ObjectNotFoundError } from "~/errors";
import type { action as passkeyAction } from "~/routes/_main+/settings.passkey";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await authenticator.isAuthenticated(request, { failureRedirect: "/welcome" });
  const account = await AccountRepository.getById(user.id);
  if (!account) throw new ObjectNotFoundError("Account not found");
  return {
    user,
    authenticators: account.authenticators,
  };
}

export const meta: MetaFunction = () => {
  return [{ title: "Settings" }];
};

function Passkey(props: { authenticator: Authenticator }) {
  const fetcher = useFetcher<typeof passkeyAction>();
  const [isPasskeyEditing, setIsPasskeyEditing] = useState(false);
  const [isPasskeyDeleting, setIsPasskeyDeleting] = useState(false);
  return (
    <li
      className="flex items-center gap-6 px-4 py-4 rounded-lg border border-gray-300"
      key={props.authenticator.credentialID}
    >
      <div className="mr-auto">
        <p>{props.authenticator.name ?? "Unnamed"}</p>
        <p className="text-gray-500">
          Created at{" "}
          {props.authenticator.createdAt
            ? new Date(props.authenticator.createdAt).toLocaleString()
            : "Unknown"}
        </p>
      </div>
      <button type="button" onClick={() => setIsPasskeyEditing(true)}>
        <Icon name="edit" />
      </button>
      <button type="button" onClick={() => setIsPasskeyDeleting(true)}>
        <Icon name="delete" />
      </button>
      <Overlay isShown={isPasskeyEditing} setIsShown={setIsPasskeyEditing}>
        <div className="w-96 rounded-lg border border-gray-300 bg-white">
          <p className="mx-6 my-6 text-2xl font-bold">Edit Passkey</p>
          <fetcher.Form
            method="put"
            action="/settings/passkey"
            className="mx-6 my-6"
            onSubmit={() => setIsPasskeyEditing(false)}
          >
            <input
              type="hidden"
              name="passkey-id"
              id="passkey-id"
              value={props.authenticator.credentialID}
            />
            <AuthFormInput
              name="passkey-name"
              label="Passkey name"
              id="passkey-name"
              type="text"
              className="mb-6"
            />
            <AuthButton type="submit">Update Passkey</AuthButton>
          </fetcher.Form>
        </div>
      </Overlay>
      <Overlay isShown={isPasskeyDeleting} setIsShown={setIsPasskeyDeleting}>
        <div className="w-96 rounded-lg border border-gray-300 bg-white">
          <p className="mx-6 my-6 text-2xl font-bold">Delete Passkey</p>
          <fetcher.Form
            method="delete"
            action="/settings/passkey"
            className="mx-6 my-6"
            onSubmit={() => setIsPasskeyDeleting(false)}
          >
            <input
              type="hidden"
              name="passkey-id"
              id="passkey-id"
              value={props.authenticator.credentialID}
            />
            <p className="text-red-500 mb-6">
              {`Are you sure you want to delete passkey ${props.authenticator.name} ?`}
            </p>
            <AuthButton type="submit">Delete Passkey</AuthButton>
          </fetcher.Form>
        </div>
      </Overlay>
    </li>
  );
}

export default function Page() {
  const loaderData = useLoaderData<typeof loader>();

  return (
    <div className="w-full h-full">
      <div className="max-w-lg mx-auto pt-6">
        <div className="flex flex-col gap-6">
          <p className="text-2xl font-bold">Passkeys</p>
          <ul className="flex flex-col gap-6">
            {loaderData.authenticators.map((passkey) => (
              <Passkey authenticator={passkey} key={passkey.credentialID} />
            ))}
          </ul>
          <Link
            to="/add-passkey"
            className="flex justify-center px-6 py-6 rounded-lg border border-dashed border-gray-300"
          >
            Add Passkey
          </Link>
          <PasskeyHero />
        </div>
      </div>
    </div>
  );
}
