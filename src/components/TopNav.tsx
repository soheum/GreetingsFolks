import Image from "next/image";
import { Button } from "./Button";

export function TopNav() {
  return (
    <header className="sticky top-0 z-50 shrink-0 bg-[#F3F9F9]">
      <nav className="relative mx-auto flex h-24 max-w-6xl items-center justify-between px-6">
        <Button variant="nav" weight="normal" href="#">
          OUR SERVICE
        </Button>
        <Button variant="nav" weight="normal" href="#">
          CONTACT
        </Button>
        <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <Image
            src="/images/logo.webp"
            alt="Greetings Folks"
            width={484}
            height={182}
            className="pointer-events-auto h-16 w-auto"
            priority
          />
        </div>
      </nav>
    </header>
  );
}
