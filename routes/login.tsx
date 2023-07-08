import LogInForm from "../islands/LogInForm.tsx";

export default function LogIn() {
  return (
    <>
      <a href="/">Home</a>
      <br />
      <LogInForm />
      <LogInForm autofill />
    </>
  )
}