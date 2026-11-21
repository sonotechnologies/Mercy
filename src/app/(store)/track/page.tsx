import type { Metadata } from "next";
import { TrackView } from "@/components/track";

export const metadata: Metadata = {
  title: "Track your order",
  description: "Check the progress of your Mercy Footwears order with your order reference and phone number.",
  robots: { index: false },
};

export default async function TrackPage({ searchParams }: PageProps<"/track">) {
  const q = await searchParams;
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
  return <TrackView initialRef={one(q.ref)} initialPhone={one(q.phone)} />;
}
