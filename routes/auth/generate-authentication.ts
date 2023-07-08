import { HandlerContext } from "$fresh/server.ts";
import { generateAuthenticationOptions } from "@simplewebauthn/server";
import { getUUID, getAuthenticators, setChallenge } from "../../utils/kv.ts";

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
    return Response.json({ error: "Missing username" }, { status: 400 });
  }

  let uuid;
  try {
    uuid = await getUUID(username);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }

  const authenticators = await getAuthenticators(uuid);

  const options = await generateAuthenticationOptions({
    allowCredentials: authenticators.map((authenticator) => ({
      id: authenticator.credentialID,
      type: "public-key",
      transports: authenticator.transports
    })),
    userVerification: "preferred",
  });

  await setChallenge(uuid, options.challenge);

  return Response.json({ ...options, user: { id: uuid } });

}