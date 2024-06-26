import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { Link } from "@remix-run/react";
import { authenticator } from "~/services/auth.server.ts";

export async function loader({ request }: LoaderFunctionArgs) {
  await authenticator.isAuthenticated(request, { failureRedirect: "/welcome" });
  return null;
}

export const meta: MetaFunction = () => {
  return [{ title: "Seven^2 Bridge" }];
};

function Button(props: { className: string; name: string; linkTo: string }) {
  return (
    <Link to={props.linkTo}>
      <button type="button" className={`w-36 h-24 ${props.className}` ?? ""}>
        {props.name}
      </button>
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
