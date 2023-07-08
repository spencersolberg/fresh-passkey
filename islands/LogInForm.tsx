import { JSX } from "preact";
import { useState } from "preact/hooks";

import { startAuthentication } from "@simplewebauthn/browser";

interface LogInFormProps {
  autofill?: boolean;
}

export default function LogInForm({ autofill = false }: LogInFormProps = {}) {
  const [username, setUsername] = useState<string | undefined>(undefined);
  const [errorMessage, setErrorMessage] = useState<string | undefined>(
    undefined,
  );
  const [success, setSuccess] = useState<boolean>(false);

  const handleChange = ({
    currentTarget,
  }: JSX.TargetedEvent<HTMLInputElement, Event>) =>
    setUsername(currentTarget.value);

  const logIn = async () => {
    const generateAuthenticationResponse = await fetch(
      `/auth/generate-authentication?username=${username}`,
    );

    const options = await generateAuthenticationResponse.json();
    if (options.error) {
      setErrorMessage(options.error);
      return;
    }

    let authentication;
    try {
      authentication = await startAuthentication(options, autofill);
    } catch (error) {
      setErrorMessage(error.message);
      return;
    }

    const verifyAuthenticationResponse = await fetch(
      "/auth/verify-authentication",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...authentication, user: options.user }),
      },
    );

    const verification = await verifyAuthenticationResponse.json();

    if (verification.error) {
      setErrorMessage(verification.error);
      return;
    }

    if (verification.success) {
      setSuccess(true);
    }
  };

  return (
    <>
      <input
        type="text"
        placeholder="username"
        name="username"
        autocomplete="webauthn"
        autocorrect="off"
        spellcheck={false}
        autocapitalize="none"
        onInput={handleChange}
      />
      <button
        type="button"
        onClick={logIn}
      >
        Log In{autofill && " (autofill)"}
      </button>
      {errorMessage && <p>{errorMessage}</p>}
      {success && (
        <>
          <p>Success!</p>
          <a href="/login">Log in</a>
        </>
      )}
    </>
  );
}
