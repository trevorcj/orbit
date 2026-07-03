import Button from "@/components/Button";
import Separator from "@/components/Separator";
import SignupForm from "@/components/SignupForm";
import Image from "next/image";
import Link from "next/link";

function Signup() {
  return (
    <div className="flex flex-col items-center justify-center max-h-screen w-full text-center my-10">
      <SignupForm />

      <div className="mt-5 w-full space-y-5">
        <Separator />

        <Button
          className="w-full bg-orbit-white border border-zinc-200 rounded-full font-semibold"
          variant="other">
          <Image src="/google.svg" alt="Google logo" width={20} height={20} />{" "}
          Continue with Google
        </Button>

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
