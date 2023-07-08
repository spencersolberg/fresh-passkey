import { generateRegistrationOptions } from "@simplewebauthn/server";
import { HandlerContext } from "$fresh/server.ts";
import { checkUsername, setChallenge } from "../../utils/kv.ts";

export const handler = async (
  req: Request,
  _ctx: HandlerContext
): Promise<Response> => {
  const url = new URL(req.url);
  const { hostname } = url;
  const rpID = hostname;
  const rpName = hostname;


  const username = url.searchParams.get("username");

  if (!username) {
    return new Response("Missing username", { status: 400 });
  }

  try {
    await checkUsername(username);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }

  const uuid = crypto.randomUUID();

  const options = await generateRegistrationOptions({
    rpName,
    rpID,
    attestationType: "none",
    userName: username,
    userID: uuid
  });

  await setChallenge(uuid, options.challenge);

  return Response.json(options);
}