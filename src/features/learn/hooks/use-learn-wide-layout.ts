"use client"

import { useSyncExternalStore } from "react"

const wideLayout = "(min-width: 1024px)"

function subscribe(onChange: () => void) {
  const query = window.matchMedia(wideLayout)
  query.addEventListener("change", onChange)
  return () => query.removeEventListener("change", onChange)
}

export function useLearnWideLayout() {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(wideLayout).matches,
    () => false
  )
}
