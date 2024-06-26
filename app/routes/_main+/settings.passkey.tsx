import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import invariant from "tiny-invariant";
import { AccountRepository } from "~/accounts/lifecycle/account.server.ts";
import { ObjectNotFoundError } from "~/errors";
import { authenticator } from "~/services/auth.server.ts";
import { getRequiredStringFromFormData } from "~/utils.ts";

export async function loader({ request }: LoaderFunctionArgs) {
  await authenticator.isAuthenticated(request, {
    successRedirect: "/settings",
    failureRedirect: "/welcome",
  });
}

export async function action({ request, response }: ActionFunctionArgs) {
  const user = await authenticator.isAuthenticated(request, { failureRedirect: "/welcome" });
  const account = await AccountRepository.getById(user.id);
  if (!account) throw new ObjectNotFoundError("Account not found");
  const formData = await request.formData();
  const method = request.method.toLowerCase();

  const passkeyId = getRequiredStringFromFormData(formData, "passkey-id");
  invariant(["put", "delete"].includes(method), "Method must be one of put, delete");

  if (method === "put") {
    const name = getRequiredStringFromFormData(formData, "passkey-name");
    const passkey = account.authenticators.find((a) => a.credentialID === passkeyId);
    invariant(passkey, "Passkey must exist");
    passkey.name = name;
    await AccountRepository.save(account);
  } else if (method === "delete") {
    if (account.authenticators.length === 1) {
      // TODO: consider google auth
      return json({ errorMessage: "You must have at least one passkey" }, { status: 400 });
    }
    account.authenticators = account.authenticators.filter((a) => a.credentialID !== passkeyId);
    await AccountRepository.save(account);
  }
  invariant(response);
  response.status = 302;
  response.headers.set("Location", "/settings");
  throw response;
}
