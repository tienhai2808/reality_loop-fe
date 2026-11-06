import { redirect } from "next/navigation"

export default function ReviewPage() {
  redirect("/learn/vocabulary?mode=review")
}
