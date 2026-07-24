import { JournalArticleView } from "@/components/sns/JournalArticleView";
import { getJournalArticleById, type JournalArticleData } from "@/lib/journalData";
import { adminDb } from "@/lib/firebase/admin";

export const dynamic = "force-dynamic";

async function fetchArticle(id: string): Promise<JournalArticleData> {
  let article: JournalArticleData;
  try {
    const db = adminDb();
    const snap = await db.doc(`posts/${id}`).get();
    article = snap.exists
      ? ({ id: snap.id, ...snap.data() } as JournalArticleData)
      : getJournalArticleById(id);
  } catch (err) {
    console.warn("Failed to fetch post from Firestore, fallbacking:", err);
    article = getJournalArticleById(id);
  }

  // 著者アイコンは、その著者(username)の公式サイトCMSで設定したアイコンを優先する。
  // (journalData 側のハードコード値ではなく、CMSでアップロードしたアイコンに追従させる)
  try {
    if (article.authorUsername) {
      const db = adminDb();
      const cfgSnap = await db.doc(`siteConfigs/${article.authorUsername}`).get();
      const iconUrl = cfgSnap.exists ? (cfgSnap.data()?.iconUrl as string | undefined) : undefined;
      if (iconUrl) {
        article = { ...article, authorAvatarUrl: iconUrl };
      }
    }
  } catch (err) {
    console.warn("Failed to fetch author siteConfig icon:", err);
  }

  return article;
}

export async function generateMetadata(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const article = await fetchArticle(id);
  return {
    title: `${article.title} | GAO HUB Journal`,
    description: article.summary,
  };
}

export default async function JournalDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const article = await fetchArticle(id);

  return <JournalArticleView article={article} />;
}
