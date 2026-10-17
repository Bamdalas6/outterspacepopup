"use client";

// Which piece is in the middle of the hero. Shared so a click anywhere on the page (the collection, the bento cards)
// can put a piece on stage.

import { useSyncExternalStore } from "react";
import { pieces } from "@/data/collection";

let current = 0;
const listeners = new Set<() => void>();

export const N = pieces.length;
export const getStage = () => current;
export function setStage(i: number) {
  const next = ((i % N) + N) % N;
  if (next === current) return;
  current = next;
  listeners.forEach((l) => l());
}
export const stepStage = (d: number) => setStage(current + d);

export function useStage() {
  return useSyncExternalStore((l) => { listeners.add(l); return () => { listeners.delete(l); }; }, getStage, () => 0);
}
