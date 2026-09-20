import { HomePage } from "./site";
import { getContent } from "@/lib/content";
export const dynamic = "force-dynamic";
export default async function Home() {
  return <HomePage content={await getContent()} />;
}

export const metadata = { alternates: { canonical: "/" } };
