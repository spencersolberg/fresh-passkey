import { JSX } from "preact";
import { useState } from "preact/hooks";
import { startRegistration } from "@simplewebauthn/browser";

export default function SignUpForm() {
  const [username, setUsername] = useState<string | undefined>(undefined);
  const [errorMessage, setErrorMessage] = useState<string | undefined>(
    undefined,
  );
  const [success, setSuccess] = useState<boolean>(false);

  const handleChange = ({
    currentTarget,
  }: JSX.TargetedEvent<HTMLInputElement, Event>) =>
    setUsername(currentTarget.value);

  const signUp = async () => {
    const generateRegistrationResponse = await fetch(
      `/auth/generate-registration?username=${username}`,
    );

    const options = await generateRegistrationResponse.json();
    if (options.error) {
      setErrorMessage(options.error);
      return;
    }

    let registration;
    try {
      registration = await startRegistration(options);
    } catch (error) {
      setErrorMessage(error.message);
      return;
    }

    const verifyRegistrationResponse = await fetch(
      "/auth/verify-registration",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...registration, user: options.user }),
      },
    );

    const verification = await verifyRegistrationResponse.json();

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
        autocorrect="off"
        spellcheck={false}
        autocapitalize="none"
        onInput={handleChange}
      />
      <button
        type="button"
        onClick={signUp}
      >
        Sign Up
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
