/**
 * プラットフォーム管理者(Future Studio)のメールアドレス。
 * 全テナント横断のデータ(/admin, /api/admin/*)にアクセスできる強力な権限のため、
 * 自己申告での取得経路(Firestoreのユーザードキュメント等)を作らず、コード上に固定する。
 * 追加が必要な場合はこの配列にメールアドレスを足してデプロイする。
 */
export const PLATFORM_ADMIN_EMAILS = ["kohei_oka@futurestudio.co.jp"];

export function isPlatformAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return PLATFORM_ADMIN_EMAILS.includes(email.toLowerCase());
}
