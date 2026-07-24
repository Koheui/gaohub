import { JournalArticleView } from "@/components/sns/JournalArticleView";
import { getJournalArticleById, type JournalArticleData } from "@/lib/journalData";
import { adminDb } from "@/lib/firebase/admin";

export const dynamic = "force-dynamic";

async function fetchArticle(id: string): Promise<JournalArticleData> {
  try {
    const db = adminDb();
    const snap = await db.doc(`posts/${id}`).get();
    if (snap.exists) {
      return { id: snap.id, ...snap.data() } as JournalArticleData;
    }
  } catch (err) {
    console.warn("Failed to fetch post from Firestore, fallbacking:", err);
  }
  return getJournalArticleById(id);
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
