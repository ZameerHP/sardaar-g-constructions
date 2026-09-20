import { json } from "@/lib/backend/http";
export async function POST() {
  return json(
    { error: "Please refresh the page to use the new secure quote uploader." },
    410,
  );
}
