import LoginForm from "@/components/LoginForm";
import Link from "next/link";

function Login() {
  return (
    <div className="flex flex-col items-center justify-center max-h-screen w-full text-center my-10">
      <LoginForm />

      <div className="mt-5 w-full space-y-5">
        <p className="font-semibold text-zinc-700">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-orbit-primary underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
