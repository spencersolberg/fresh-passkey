import { HandlerContext } from "$fresh/server.ts";
import { verifyAuthenticationResponse } from "@simplewebauthn/server";
import { getChallenge, getAuthenticator, updateAuthenticatorCounter } from "../../utils/kv.ts";

export const handler = async (
  req: Request,
  _ctx: HandlerContext,
): Promise<Response> => {
  const url = new URL(req.url);
  const { hostname } = url;
  const rpID = hostname;
  const rpName = hostname;
  const protocol = hostname === "localhost" ? "http" : "https";
	const origin = `${protocol}://${rpID}${
		hostname === "localhost" ? ":8000" : ""
	}`;

  const json = await req.json();

  const uuid = json.user.id;
  const username = json.user.name;

  let challenge;
  try {
    challenge = await getChallenge(uuid);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }

  let authenticator: Awaited<ReturnType<typeof getAuthenticator>>;

  try {
    authenticator = await getAuthenticator(uuid, json.id);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }

  let verification; 
  try {
    verification = await verifyAuthenticationResponse({
      response: json,
      expectedChallenge: challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      authenticator
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }

  const { verified, authenticationInfo } = verification;

  if (!verified) {
    return Response.json({ error: "Authentication failed" }, { status: 400 });
  }

  if (!authenticationInfo) {
    return Response.json({ error: "Authentication failed" }, { status: 400 });
  }

  const { newCounter } = authenticationInfo;

  await updateAuthenticatorCounter(uuid, authenticator, newCounter);

  return Response.json({ success: true });
}