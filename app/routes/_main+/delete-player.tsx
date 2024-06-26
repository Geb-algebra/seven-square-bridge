import { unstable_defineAction as defineAction } from "@remix-run/node";
import invariant from "tiny-invariant";
import { deletePlayerAndEmptyRoom } from "~/room/lifecycle";
import { authenticator } from "~/services/auth.server";

export const action = defineAction(async ({ request }) => {
  const user = await authenticator.isAuthenticated(request, { failureRedirect: "/login" });
  const formData = await request.formData();
  const roomId = formData.get("room-id");
  invariant(typeof roomId === "string", "room id must be a string");
  await deletePlayerAndEmptyRoom(roomId, user.id);
  return new Response(null, { status: 200 });
});
