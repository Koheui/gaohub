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
    id: "hanro-subsidy-2026",
    title: "【祝・採択】北九州市「販路拡大支援助成金」採択決定！AIエージェントと2,929件のCRMが創り出す自動営業ファンネルの裏側",
    category: "プロダクト思考",
    publishedAtText: "2026.07.24",
    summary: "北九州市「販路拡大支援助成金」の採択が正式決定！AIエージェント『軍師』と名刺CRM、特定電子メール法準拠の自動配信エンジンを統合した自律営業ファンネルの構築ストーリーと今後の展望を公開。",
    content: `本日、弊社（Future Studio 株式会社）が申請しておりました北九州市の「販路拡大支援助成金」の採択が正式決定いたしました！

■ 1. 「アイデア3割：ファクト7割」が生んだ確信
前回の敗因分析から導き出した必勝の原則。「素晴らしい計画」ではなく、すでに弊社が所有している確定アセット・2,929件の名刺データ・AI技術基盤を前面に出したことが、評価に直結しました。

![北九州市 助成金プロジェクトとチームアセット](https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=1200&q=80)

■ 2. 2,929件の名刺CRMとGemini AI自動タグ付け
大量の顧客データをGemini APIで自動業界分類・タグ付け。特定電子メール法に準拠したオプトアウト自動付与およびResendバッチ配信基盤をGAO HUB内に完結させました。

![GAO HUB ダッシュボードとAIマーケティングファンネル](https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80)

■ 3. チャネル別2大キラーアプローチの展開
・店舗・企業向け「ゲーム化プロモーション」
・不動産・工務店向け「emolink 引き渡しカード」

単なる受託の枠を超え、自社プロダクトと知財の力で年商1.8億円への跳躍を目指します。`,
    imageUrl: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=800&q=80",
    readTime: "6分",
    isPublished: true,
    authorName: "岡 浩平 / Future Studio",
    authorUsername: "oka",
    authorAvatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
    authorBio: "Future Studio 代表。ディープテック、フィジカルプロダクト(emolink)、小倉コーラ、AIエージェントの社会実装を推進中。",
    contentParagraphs: [
      "本日、弊社（Future Studio 株式会社）が申請しておりました北九州市の「販路拡大支援助成金」の採択が正式に決定いたしました。",
      "単なる資金支援の獲得にとどまらず、弊社が推進してきた『受託の天井をプロダクトと知財で突破する』という経営戦略の妥当性が、公的な評価によって証明された瞬間です。",
      "本記事では、今回の助成金申請において適用した『公募必勝4大原則』の教訓と、GAO HUBダッシュボード上に構築した2,929件の顧客CRM＆AI自動営業ファンネルの裏側について詳しくお伝えします。",
      "■ 1. 「アイデア3割 : ファクト7割」で挑んだ構造改革\n過去の公募案件における敗因を冷徹に分析した結果、行政や審査員が最も評価するのは『これからやる素晴らしいアイデア』ではなく『すでに保有している確定アセット・自社メディア・顧客基盤』であるという確信に至りました。今回の申請書では計画の魅言を3割に抑え、7割を自社所有インフラと顧客データの具体的数値で埋め尽くしました。",
      "■ 2. 2,929件の名刺CRMとGemini AIによる超高速セグメント\n名刺管理アプリから取り込んだ2,929件の顧客データに対し、Gemini APIを活用した全自動業界分類バッチを適用。さらに特定電子メール法準拠の自動オプトアウトリンク生成、およびResend APIをダイレクトに統合した自律型一斉配信エンジンをダッシュボードへ完全実装しました。",
      "■ 3. 勝てる土俵での2大キラーアプローチ\nターゲットを明確にセグメントし、①店舗・企業向けの『ゲーム化広告プロモーション』、②不動産・工務店向けの『emolink 引き渡しカード（一生モノの施工記録・引渡カード）』の2大軸で自律提案を展開していきます。",
      "これからも代表の時間を守りつつ、AIエージェント軍団（軍師）とともに非連続な事業成長を加速させてまいります。"
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
    likeCount: 42,
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
