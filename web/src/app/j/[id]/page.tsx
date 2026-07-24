import { JournalArticleView } from "@/components/sns/JournalArticleView";
import { getJournalArticleById } from "@/lib/journalData";

export const dynamic = "force-dynamic";

export async function generateMetadata(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const article = getJournalArticleById(id);
  return {
    title: `${article.title} | GAO HUB Journal`,
    description: article.summary,
  };
}

export default async function JournalDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const article = getJournalArticleById(id);

  return <JournalArticleView article={article} />;
}
