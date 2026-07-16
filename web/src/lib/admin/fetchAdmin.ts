"use client";

import { auth } from "@/lib/firebase/client";

/** /api/admin/* をID トークン付きで呼ぶ共通ヘルパー */
export async function fetchAdmin<T>(path: string): Promise<T> {
  const idToken = await auth.currentUser?.getIdToken();
  const res = await fetch(path, {
    headers: idToken ? { Authorization: `Bearer ${idToken}` } : {},
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "取得に失敗しました");
  return data as T;
}
