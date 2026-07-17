import { Footer } from "@/components/Footer";
import { PostcardStack } from "@/components/PostcardStack";
import { TopNav } from "@/components/TopNav";

export default function Home() {
  return (
    <>
      <main className="flex min-h-dvh flex-col overflow-hidden overscroll-x-none bg-white">
        <TopNav />
        <PostcardStack />
      </main>
      <Footer />
    </>
  );
}
