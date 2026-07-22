import { JournalArticleView, type JournalArticleData } from "@/components/sns/JournalArticleView";

export const dynamic = "force-dynamic";

export async function generateMetadata(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  return {
    title: `【購入レビュー】YAMAHA SEQTRAKを選んだ4つの理由 | GAO HUB Journal`,
    description: `GAO HUB Journal 独立記事コンテンツ。BanKisha取材音源からの自動記事化およびイベント/EC連動。`,
  };
}

export default async function JournalDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;

  // note.com スクショリファレンスを完璧に模したリアルなモックデータ
  const dummyArticle: JournalArticleData = {
    id,
    title: "【 購入レビュー 】YAMAHA SEQTRAKを選んだ4つの理由",
    coverImageUrl: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=1200&q=80",
    authorName: "岡 浩平 / Future Studio",
    authorUsername: "oka",
    authorAvatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
    authorBio: "Future Studio 代表。ディープテック、空間デザイン、小倉コーラ、AIエージェントの社会実装を推進中。",
    publishedAtText: "2026年7月15日 22:06",
    contentParagraphs: [
      "本記事の内容は、あくまで筆者の主観的な感想に基づくものです。",
      "YAMAHAがリリースしたオールインワン・グルーヴボックス「SEQTRAK」を購入しました。これ1台でドラム、シンセサイザー、サンプラーが完結し、どこでもトラックメイキングが楽しめる優れたハードウェアです。",
      "実際に楽曲制作を進める中で感じた『なぜSEQTRAKを選んだのか』という4つの理由と、今後のイベント・ワークショップでの活用展望について詳しくレポートします。",
    ],
    imageUrls: [
      "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1000&q=80",
    ],
    linkedEvent: {
      id: "cYEHtekZIp0aWhgNbp1u",
      slug: "future-tech-conference-2027",
      title: "Future Tech Conference 2027",
      dateText: "2027.03.03 (水) 10:00 START",
      venueText: "北九州小倉メインホール / Online",
    },
    linkedProduct: {
      id: "kokura-cola-01",
      name: "小倉コーラ 原液シロップ (500mlパウチ)",
      priceJpy: 2800,
      imageUrl: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=400&q=80",
    },
    likeCount: 19,
  };

  return <JournalArticleView article={dummyArticle} />;
}
