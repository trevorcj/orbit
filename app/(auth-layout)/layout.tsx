import Image from "next/image";

function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex flex-col lg:flex-row min-h-screen w-full overflow-hidden bg-orbit-white">
      <div className="flex-1 flex flex-col p-5 min-h-screen justify-between overflow-y-auto lg:h-screen">
        <div className="w-full text-left mb-6">
          <Image
            src="orbit-light.svg"
            alt="Orbit Logo"
            width={100}
            height={20}
            className="w-auto h-6"
          />
        </div>
        <div className="flex-1 flex flex-col justify-center w-full max-w-lg mx-auto">
          {children}
        </div>
        <div className="h-6 invisible hidden lg:block"></div>
      </div>

      <div className="hidden lg:block h-screen shrink-0 sticky top-0 right-0">
        <Image
          src="/auth-img.svg"
          alt="Orbit Auth Image"
          className="h-full w-auto object-right"
          width={720}
          height={1024}
          priority
        />
      </div>
    </main>
  );
}

export default AuthLayout;
