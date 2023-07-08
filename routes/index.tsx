import { Head } from "$fresh/runtime.ts";

export default function Home() {
  return (
    <>
      <Head>
        <title>Fresh App</title>
      </Head>
      <div>
        <a href="/signup">Sign Up</a>
        <br />
        <a href="/login">Login</a>
      </div>
    </>
  );
}
