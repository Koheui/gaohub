import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { storage } from "@/lib/firebase/client";

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

/**
 * イベント配下にクリエイティブ(画像)をアップロードして公開URLを返す。
 * パス例: events/{eventId}/cover-1720000000000.jpg
 */
export async function uploadEventImage(
  eventId: string,
  file: File,
  prefix: "cover" | "speaker" | "og" | "session-banner" | "sponsor"
): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("画像ファイルを選択してください");
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error("画像は10MB以下にしてください");
  }
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const path = `events/${eventId}/${prefix}-${Date.now()}.${ext}`;
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file, { contentType: file.type });
  return getDownloadURL(storageRef);
}
