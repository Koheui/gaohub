export interface JournalArticleData {
  id: string;
  title: string;
  category: string;
  publishedAtText: string;
  summary: string;
  content: string;
  imageUrl: string;
  readTime: string;
  isPublished: boolean;
  coverImageUrl?: string;
  authorName: string;
  authorUsername: string;
  authorAvatarUrl?: string;
  authorBio: string;
  contentParagraphs: string[];
  imageUrls: string[];
  linkedEvent?: {
    id: string;
    slug: string;
    title: string;
    dateText: string;
    venueText: string;
  };
  linkedProduct?: {
    id: string;
    name: string;
    priceJpy: number;
    imageUrl: string;
  };
  likeCount: number;
}

export const INITIAL_JOURNAL_ARTICLES: JournalArticleData[] = [
  {
    id: "physical-ui-design-2026",
    title: "【デザイン思考】現代のWeb UIにおいて「フィジカルな質感」が求められる理由",
    category: "プロダクト思考",
    publishedAtText: "2026.07.24",
    summary: "フラットデザインの次に来る表現とは？画面の中に自然な影やテクスチャ、静かなグラデーションを取り入れ、ユーザーの認知負荷を下げながら愛着を生み出すWebUI設計論。",
    content: `デジタルプロダクトのデザインは、過度な装飾を削ぎ落とした「完全なフラットデザイン」の時代を経て、静かで心地よい「適度なフィジカル感（物理的な手触り）」を融合させるフェーズへと移行しています。\n\n■ 1. なぜ「手触り感」が認知負荷を寄せるのか\n人間は物理世界で触れてきた質感や重み、光の反射に無意識の安心感を覚えます。画面内のボタンやカードに微細なシャドウや微かなノイズテクスチャを加えることで、操作可能な領域が直感的に理解できるようになります。\n\n![現代のUIデザインと質感表現](https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=1200&q=80)\n\n■ 2. ディテールに宿る体験価値\n単なる飾りとしての装飾ではなく、ユーザーが次のアクションへ自然に誘導されるアフォーダンスとしてのデザイン設計が求められます。`,
    imageUrl: "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=800&q=80",
    readTime: "5分",
    isPublished: true,
    authorName: "クリエイティブチーム",
    authorUsername: "design",
    authorAvatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
    authorBio: "UI/UXデザインとWebアプリケーションのグラフィック設計を探求するデザインラボ。",
    contentParagraphs: [
      "デジタルプロダクトのデザインは、過度な装飾を削ぎ落とした『完全なフラットデザイン』の時代を経て、静かで心地よい『適度なフィジカル感（物理的な手触り）』を融合させるフェーズへと移行しています。",
      "■ 1. なぜ『手触り感』が認知負荷を寄せるのか\n人間は物理世界で触れてきた質感や重み、光の反射に無意識の安心感を覚えます。画面内のボタンやカードに微細なシャドウや微かなノイズテクスチャを加えることで、操作可能な領域が直感的に理解できるようになります。",
      "![現代のUIデザインと質感表現](https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=1200&q=80)",
      "■ 2. ディテールに宿る体験価値\n単なる飾りとしての装飾ではなく、ユーザーが次のアクションへ自然に誘導されるアフォーダンスとしてのデザイン設計が求められます。"
    ],
    imageUrls: [
      "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=1000&q=80"
    ],
    linkedEvent: {
      id: "future-tech-conference-2027",
      slug: "future-tech-conference-2027",
      title: "Future Tech Conference 2027",
      dateText: "2027.03.03 (水) 10:00 START",
      venueText: "メインホール / Online",
    },
    linkedProduct: {
      id: "sample-item-01",
      name: "デザインガイドブック (2026年版)",
      priceJpy: 2400,
      imageUrl: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=400&q=80",
    },
    likeCount: 24,
  },
  {
    id: "seqtrak-review-2026",
    title: "【購入レビュー】YAMAHA SEQTRAKを選んだ4つの理由",
    category: "製品レビュー",
    publishedAtText: "2026.07.15",
    summary: "YAMAHAがリリースしたオールインワングルーヴボックス「SEQTRAK」を購入。現場イベントやワークショップでの活用展望をレポート。",
    content: `YAMAHA SEQTRAK を導入し、イベントやライブパフォーマンスでの音響演出に活用し始めました。\n\n1. トラックメイキングの圧倒的スピード感\n2. サンプラーとFM音源のハイブリッド表現\n3. 軽量かつバッテリー駆動で現場持ち込みが容易`,
    imageUrl: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=800&q=80",
    readTime: "5分",
    isPublished: true,
    authorName: "岡 浩平 / Future Studio",
    authorUsername: "oka",
    authorAvatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
    authorBio: "Future Studio 代表。ディープテック、空間デザイン、小倉コーラ、AIエージェントの社会実装を推進中。",
    contentParagraphs: [
      "本記事の内容は、あくまで筆者の主観的な感想に基づくものです。",
      "YAMAHAがリリースしたオールインワン・グルーヴボックス「SEQTRAK」を購入しました。これ1台でドラム、シンセサイザー、サンプラーが完結し、どこでもトラックメイキングが楽しめる優れたハードウェアです。",
      "実際に楽曲制作を進める中で感じた『なぜSEQTRAKを選んだのか』という4つの理由と、今後のイベント・ワークショップでの活用展望について詳しくレポートします。"
    ],
    imageUrls: [
      "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1000&q=80"
    ],
    likeCount: 19,
  },
  {
    id: "j-2",
    title: "emolinkが創り出す『物理思い出カード』の体験設計",
    category: "プロダクト思考",
    publishedAtText: "2026.07.10",
    summary: "スマホをかざすだけで想い出の音楽や写真が蘇るフィジカルプロダクトの裏側と、世間感覚の調和について。",
    content: `デジタルデータの氾濫に対する一つの回答として、手に触れられる物理カードに体験を閉じ込めるプロジェクト「emolink」の思想をまとめました。`,
    imageUrl: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=800&q=80",
    readTime: "7分",
    isPublished: true,
    authorName: "岡 浩平 / Future Studio",
    authorUsername: "oka",
    authorAvatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
    authorBio: "Future Studio 代表。フィジカルプロダクト(emolink)のプロダクトオーナー。",
    contentParagraphs: [
      "スマートフォンの中に溢れかえる数万枚の写真や動画。本当に大切な想い出が埋もれてしまう時代において、手触りのある『物理カード』にデータを紐付けるemolinkの体験設計について振り返ります。",
      "スマホをかざすだけの自然な動作と、コレクタブルカードとしての美しさを両立させ、アプリ不要で瞬時に再生されるデジタル思い出箱を形にしました。"
    ],
    imageUrls: [
      "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1000&q=80"
    ],
    likeCount: 31,
  },
  {
    id: "j-3",
    title: "地方創生とクラフトコーラ：小倉コーラ誕生秘話",
    category: "地方創生・ストーリー",
    publishedAtText: "2026.07.01",
    summary: "北九州・小倉のスパイスと物語を詰め込んだクラフトコーラの開発ストーリーと直営EC展開への挑戦。",
    content: `地場の素材とカルチャーを掛け合わせた新しいクラフトドリンクの立ち上げ経緯。`,
    imageUrl: "https://images.unsplash.com/photo-1527661591475-527312dd65f5?auto=format&fit=crop&w=800&q=80",
    readTime: "6分",
    isPublished: true,
    authorName: "岡 浩平 / Future Studio",
    authorUsername: "oka",
    authorAvatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
    authorBio: "小倉コーラ ブランドプロデューサー。",
    contentParagraphs: [
      "小倉の郷土料理である『ぬか炊き』の隠し味として使われる山椒をメインスパイスに、飲む小倉（街の文化の胃袋への落とし込み）をテーマに創り上げたクラフトコーラ「小倉コーラ」。",
      "炭酸割り瓶から飲食店向け原液シロップ・自社瓶詰め小売展開へのシフト、そしてECストア構築までのストーリーをお届けします。"
    ],
    imageUrls: [
      "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=1000&q=80"
    ],
    likeCount: 28,
  },
];

export function getJournalArticleById(id: string): JournalArticleData {
  const found = INITIAL_JOURNAL_ARTICLES.find((a) => a.id === id);
  const article = found ? { ...found } : { ...INITIAL_JOURNAL_ARTICLES[0] };

  // content 本文から段落 ＆ インライン写真ブロック (![alt](url)) を自動分解
  if (article.content) {
    const rawParagraphs = article.content
      .split(/\n\n+/)
      .map((p) => p.trim())
      .filter(Boolean);

    if (rawParagraphs.length > 0) {
      article.contentParagraphs = rawParagraphs;
    }
  }

  return article;
}
