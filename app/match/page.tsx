import { redirect } from "next/navigation";

/** The old match page is replaced by Let's Play (Flutter parity step 5). */
export default function MatchPage() {
  redirect("/letsplay");
}
