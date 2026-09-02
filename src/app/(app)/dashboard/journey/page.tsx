import { redirect } from "next/navigation";

/**
 * План із відсотком замінено Збіркою: прогрес тепер — заповнені слоти,
 * а не смужка. Старий екран лишався б другим, конкурентним поглядом на те
 * саме, тому Journey веде просто в бібліотеку.
 */
export default function JourneyPage() {
  redirect("/dashboard/journey/academy");
}
