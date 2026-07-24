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
    id: "gaohub-architecture-2026",
    title: "【開発裏話】AIエージェントと人間が協働する次世代イベントプラットフォーム「GAO HUB」の設計思想",
    category: "プロダクト思考",
    publishedAtText: "2026.07.24",
    summary: "イベント準備から集客LP自動生成、Stripe Connect決済、当日のPWA即時受付、EC物販、ジャーナル連動までをワンストップで完結させるマルチテナントSaaS「GAO HUB」の設計思想と開発の裏側。",
    content: `イベント運営のあらゆるステップをシンプルに統合するプラットフォーム「GAO HUB」の設計思想について解説します。\n\n■ 1. なぜ既存のイベント管理ツールでは不十分なのか\n従来のイベントツールは集客のみ、決済のみ、あるいは名簿管理のみに分断されており、主催者は複数のサービスを行き来する手間を強いられていました。GAO HUB では「開催準備 → 自動LP生成 → セルフサーブチケット販売 → PWA即時受付 → EC物販 ＆ メディア配信」を一元管理できます。\n\n![GAO HUB システムアーキテクチャ](https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=1200&q=80)\n\n■ 2. ディープテックとUI/UXの融合\nAIエージェントによるバナー自動生成（@vercel/og / Satori）や、高速なリアルタイム受付、特定の配信ルールに配慮したスマートな配信エンジンを内包しています。\n\n![ダッシュボードとデザインシステム](https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80)\n\n■ 3. フィジカルとデジタルの新しい関係性\nオンラインでのイベント体験にとどまらず、現場でのコレクタブルカードやオリジナルプロダクトのEC購買をシームレスに繋ぐことで、継続的なコミュニティを形成します。`,
    imageUrl: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=800&q=80",
    readTime: "5分",
    isPublished: true,
    authorName: "岡 浩平 / Future Studio",
    authorUsername: "oka",
    authorAvatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
    authorBio: "Future Studio 代表。ディープテック、フィジカルプロダクト(emolink)、小倉コーラ、AIエージェントの社会実装を推進中。",
    contentParagraphs: [
      "イベント運営のあらゆるステップをシンプルに統合するプラットフォーム「GAO HUB」の設計思想について解説します。",
      "■ 1. なぜ既存のイベント管理ツールでは不十分なのか\n従来のイベントツールは集客のみ、決済のみ、あるいは名簿管理のみに分断されており、主催者は複数のサービスを行き来する手間を強いられていました。GAO HUB では『開催準備 → 自動LP生成 → セルフサーブチケット販売 → PWA即時受付 → EC物販 ＆ メディア配信』を一元管理できます。",
      "![GAO HUB システムアーキテクチャ](https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=1200&q=80)",
      "■ 2. ディープテックとUI/UXの融合\nAIエージェントによるバナー自動生成（@vercel/og / Satori）や、高速なリアルタイム受付、スマートな配信エンジンを内包しています。",
      "![ダッシュボードとデザインシステム](https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80)",
      "■ 3. フィジカルとデジタルの新しい関係性\nオンラインでのイベント体験にとどまらず、現場でのコレクタブルカードやオリジナルプロダクトのEC購買をシームレスに繋ぐことで、継続的なコミュニティを形成します。"
    ],
    imageUrls: [
      "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1000&q=80"
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
    likeCount: 38,
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
