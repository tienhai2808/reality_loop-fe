export function grammarHistoryHref(
  profileId: string | undefined,
  context?: URLSearchParams
) {
  const query = new URLSearchParams(context)
  query.set("history", "practice")
  if (profileId) query.set("profile", profileId)
  else query.delete("profile")
  return `/learn/grammar?${query}`
}
