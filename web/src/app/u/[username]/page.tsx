import { CorporateBrandPortal, type CorporateProfileData } from "@/components/sns/CorporateBrandPortal";

export const dynamic = "force-dynamic";

export async function generateMetadata(props: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await props.params;
  const brandName = username === "oka" ? "株式会社 Future Studio" : `公式ポータル @${username}`;
  return {
    title: `${brandName} | 公式コーポレート＆メディアポータル`,
    description: `${brandName} のGAO HUB公式Webメディアポータル。最新の公式ジャーナル、プロジェクトPick up、イベントおよび直営ECストア情報。`,
  };
}

export default async function UserMySpacePage(props: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await props.params;

  // デンソー型公式コーポレート / ブランドポータルのモックデータ
  const corporateProfile: CorporateProfileData = {
    username,
    brandName: username === "oka" ? "株式会社 Future Studio" : `公式プロジェクト ${username}`,
    tagline: "リアルとデジタルの融合。ディープテックとフィジカルプロダクトの未来を構築する。",
    heroImageUrl: "https://images.unsplash.com/photo-1541888946425-d0fbb186a5b7?auto=format&fit=crop&w=1600&q=80",
    aboutTitle: "フィジカルとデジタルを繋ぎ、ビジネスの非連続な成長を実現する",
    aboutDescription: `Future Studio は、AIエージェントシステム「軍師」、実物IPプロダクト「emolink」、小倉の魅力を詰めた「小倉コーラ」などを展開するディープテック＆ブランドカンパニーです。\n\n代表・岡浩平の指揮のもと、行政プロポーザル、イベントプラットフォームGAO HUB、地方創生知財プロダクトまでをワンストップで企画・開発・プロデュースしています。`,
    aboutImageUrl: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80",
    followerCount: 2450,
    pickups: [
      {
        id: "p-1",
        type: "event",
        badgeText: "🎟️ 注目イベント",
        title: "Future Tech Conference 2027",
        subtitle: "AIエージェントと人間が織りなす次世代開発の最前線。福岡・小倉にてリアル＆オンライン開催。",
        imageUrl: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80",
        href: "/e/future-tech-conference-2027",
      },
      {
        id: "p-2",
        type: "shop",
        badgeText: "📦 公式ECショップ",
        title: "小倉コーラ 原液シロップ (500ml)",
        subtitle: "ハーブと柑橘が織りなす小倉発のクラフトコーラ。炭酸やミルクで割って楽しめます。",
        imageUrl: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=800&q=80",
        href: "/u/oka",
      },
      {
        id: "p-3",
        type: "journal",
        badgeText: "📖 注目ジャーナル",
        title: "【購入レビュー】YAMAHA SEQTRAKを選んだ4つの理由",
        subtitle: "実機音源・トラックメイキングの魅力と現場イベントでの活用展望を徹底レポート。",
        imageUrl: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=800&q=80",
        href: "/j/seqtrak-review-2026",
      },
    ],
    journals: [
      {
        id: "seqtrak-review-2026",
        title: "【購入レビュー】YAMAHA SEQTRAKを選んだ4つの理由",
        publishedAtText: "2026.07.15",
        imageUrl: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=800&q=80",
        summary: "YAMAHAがリリースしたグルーヴボックス「SEQTRAK」を購入。現場イベントやワークショップでの活用展望をレポート。",
      },
      {
        id: "j-2",
        title: "emolinkが創り出す『物理思い出カード』の体験設計",
        publishedAtText: "2026.07.10",
        imageUrl: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=800&q=80",
        summary: "スマホをかざすだけで想い出の音楽や写真が蘇るフィジカルプロダクトの裏側と、世間感覚の調和について。",
      },
      {
        id: "j-3",
        title: "地方創生とクラフトコーラ：小倉コーラ誕生秘話",
        publishedAtText: "2026.07.01",
        imageUrl: "https://images.unsplash.com/photo-1527661591475-527312dd65f5?auto=format&fit=crop&w=800&q=80",
        summary: "北九州・小倉のスパイスと物語を詰め込んだクラフトコーラの開発ストーリーと直営EC展開への挑戦。",
      },
    ],
  };

  return <CorporateBrandPortal profile={corporateProfile} />;
}
