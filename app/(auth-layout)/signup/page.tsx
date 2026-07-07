import Separator from "@/components/Separator";
import SignupForm from "@/components/SignupForm";
import Link from "next/link";

function Signup() {
  return (
    <div className="flex flex-col items-center justify-center max-h-screen w-full text-center my-10">
      <SignupForm />

      <div className="mt-5 w-full space-y-5">
        <Separator />

        <p className="font-semibold text-zinc-700">
          Already have an account?{" "}
          <Link href="/login" className="text-orbit-primary underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Signup;
