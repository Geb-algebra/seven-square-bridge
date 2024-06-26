import { unstable_defineLoader as defineLoader } from "@remix-run/node";
import { createRoomAndPlayer } from "~/room/lifecycle";
import { authenticator } from "~/services/auth.server";

export const loader = defineLoader(async ({ request, response }) => {
  const user = await authenticator.isAuthenticated(request, { failureRedirect: "/login" });
  const room = await createRoomAndPlayer(user.id);
  console.info(`Room ${room.id} created by ${user.name}`);
  response.headers.set("Location", `/room/${room.id}`);
  response.status = 302;
  throw response;
});
