import { HandlerContext } from "$fresh/server.ts";
import { verifyRegistrationResponse } from "@simplewebauthn/server";
import { isoBase64URL } from "@simplewebauthn/server/helpers";
import { getChallenge, addAuthenticator, createUser } from "../../utils/kv.ts";

import type { AuthenticatorDevice } from "@simplewebauthn/typescript-types";

export const handler = async (
  req: Request,
  _ctx: HandlerContext
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

  let verification;
  try {
    verification = await verifyRegistrationResponse({
      response: json,
      expectedChallenge: challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }

  const { verified, registrationInfo } = verification;

  if (!verified) {
    return Response.json({ error: "Registration failed" }, { status: 400 });
  }

  if (!registrationInfo) {
    return Response.json({ error: "Registration failed" }, { status: 400 });
  }

  const { credentialID, credentialPublicKey, counter } = registrationInfo;

  const authenticator: AuthenticatorDevice = {
    credentialID, credentialPublicKey, counter
  }

  try {
    await addAuthenticator(uuid, authenticator);
    await createUser(username, uuid);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }

  return Response.json({ success: true });
}