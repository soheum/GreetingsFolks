import { notFound } from "next/navigation";
import { ReceivedCard } from "@/components/ReceivedCard";
import { TopNav } from "@/components/TopNav";
import { ENVELOPES } from "@/data/envelopes";
import {
  createSupabaseAdmin,
  type SentCard,
} from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

function findEnvelope(cardImage: string) {
  return ENVELOPES.find((envelope) => {
    if (envelope.src === cardImage) {
      return true;
    }

    return envelope.layers?.some(
      (layer) => layer.anchor === "fill" && layer.src === cardImage,
    );
  });
}

export default async function CardPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from("sent_cards")
    .select(
      "id, token, recipient_email, message, card_title, card_image, ref_number, created_at",
    )
    .eq("token", token)
    .maybeSingle<SentCard>();

  if (error || !data) {
    notFound();
  }

  const envelope = findEnvelope(data.card_image);

  if (!envelope?.layers || !envelope.topFlap || !envelope.sendable) {
    notFound();
  }

  return (
    <main className="flex h-dvh flex-col overflow-hidden overscroll-x-none bg-[#DF0000]">
      <TopNav />
      <ReceivedCard
        message={data.message}
        cardTitle={data.card_title}
        cardImage={data.card_image}
        envelope={envelope}
      />
    </main>
  );
}
