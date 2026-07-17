import Image from "next/image";

export function Footer() {
  return (
    <footer className="bg-[#ffe8e8] px-6 py-12 text-center">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-6">
        <Image
          src="/images/logo.webp"
          alt="Greetings Folks"
          width={484}
          height={182}
          className="h-auto w-56 sm:w-72"
        />
        <p className="text-caption">
          Copyright 2026 GREETINGS FOLKs All rights reserved
        </p>
      </div>
    </footer>
  );
}
