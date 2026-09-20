import { requireAdmin } from "@/lib/backend/auth";
import { json, failure } from "@/lib/backend/http";
export async function GET() {
  try {
    const { user } = await requireAdmin();
    return json({ email: user.email });
  } catch (e) {
    return failure(e);
  }
}
