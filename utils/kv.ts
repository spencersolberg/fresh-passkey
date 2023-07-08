import type { AuthenticatorDevice } from "@simplewebauthn/typescript-types";
import { isoBase64URL } from "@simplewebauthn/server/helpers";


const kv = await Deno.openKv();

export const setChallenge = async (uuid: string, challenge: string) => {
  await kv.set(["challenges", uuid], challenge);

  setTimeout(async () => {
    await kv.delete(["challenges", uuid]);
  }, 5 * 60 * 1000);
}

export const getChallenge = async (uuid: string): Promise<string> => {
  const challenge = await kv.get<string>(["challenges", uuid]);
  if (!challenge.value) throw new Error("Challenge not found. (It may have expired)");
  return challenge.value;
}

export const checkUsername = async (username: string): Promise<void> => {
  if (username.length < 3) throw new Error("Username must be at least 3 characters");
  if (username.length > 32) throw new Error("Username must be at most 32 characters");
  if (!/^[a-zA-Z0-9_]+$/.test(username)) throw new Error("Username must only contain alphanumeric characters and underscores");
  const user = await kv.get(["users", username]);
  if (user.value) throw new Error("Username already taken");
}

export const addAuthenticator = async (uuid: string, authenticator: AuthenticatorDevice) => {
  const res = await kv.get<AuthenticatorDevice[]>(["authenticators", uuid]);
  const authenticators = res.value || [];

  authenticators.push(authenticator);

  await kv.set(["authenticators", uuid], authenticators);
}

export const createUser = async (username: string, uuid: string) => {
  await kv.set(["users", username], uuid);
}

export const getUUID = async (username: string): Promise<string> => {
  const res = await kv.get<string>(["users", username]);
  if (!res.value) throw new Error("User not found");
  return res.value;
}

export const getAuthenticators = async (uuid: string): Promise<AuthenticatorDevice[]> => {
  const res = await kv.get<AuthenticatorDevice[]>(["authenticators", uuid]);
  if (!res.value) throw new Error("User not found");
  return res.value;
}

export const getAuthenticator = async (uuid: string, credentialID: string): Promise<AuthenticatorDevice> => {
  const res = await kv.get<AuthenticatorDevice[]>(["authenticators", uuid]);
  if (!res.value) throw new Error("User not found");
  let authenticator;

  for (const _authenticator of res.value) {
    const _credentialID = isoBase64URL.fromBuffer(_authenticator.credentialID);

    if (_credentialID === credentialID) {
      authenticator = _authenticator;
      break;
    }
  }

  if (!authenticator) throw new Error("Authenticator not found");

  return authenticator;
}

export const updateAuthenticatorCounter = async (uuid: string, authenticator: AuthenticatorDevice, counter: number) => {
  const res = await kv.get<AuthenticatorDevice[]>(["authenticators", uuid]);
  if (!res.value) throw new Error("User not found");
  const authenticators = res.value;

	const index = authenticators.findIndex(
		(_authenticator) =>
			new TextDecoder().decode(authenticator.credentialID) ===
			new TextDecoder().decode(_authenticator.credentialID),
	);

  if (index === -1) throw new Error("Authenticator not found");

  authenticators[index].counter = counter;

  await kv.set(["authenticators", uuid], authenticators);
}