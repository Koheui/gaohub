import { CorporateBrandPortal, type CorporateProfileData } from "@/components/sns/CorporateBrandPortal";
import { adminDb } from "@/lib/firebase/admin";
import { INITIAL_JOURNAL_ARTICLES } from "@/lib/journalData";

export const dynamic = "force-dynamic";

export async function generateMetadata(props: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await props.params;
  const brandName = username === "oka" ? "Future Studio 株式会社" : `公式ポータル @${username}`;
  return {
    title: `${brandName} | 公式コーポレート＆メディアポータル`,
    description: `${brandName} のGAO HUB公式Webメディアポータル。最新の公式ジャーナル、プロジェクトPick up、イベントおよび直営ECストア情報。`,
  };
}

export default async function UserMySpacePage(props: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await props.params;

  let savedConfig: any = null;
  let publishedEvents: Array<{ id: string; title: string; slug: string; tagline: string; coverImageUrl: string }> = [];
  let fetchedPosts: Array<{ id: string; title: string; publishedAtText: string; imageUrl: string; summary: string }> = [];

  try {
    const db = adminDb();

    // 1. Firestore から siteConfigs を取得
    const configSnap = await db.doc(`siteConfigs/${username}`).get();
    if (configSnap.exists) {
      savedConfig = configSnap.data();
    }

    // 2. 実際の公開イベント一覧を取得
    const eventsSnap = await db
      .collection("events")
      .where("status", "==", "published")
      .get();

    publishedEvents = eventsSnap.docs
      .map((d) => {
        const data = d.data();
        return {
          id: d.id,
          title: data.title ?? "イベント",
          slug: data.slug ?? d.id,
          tagline: data.tagline ?? data.description ?? "",
          coverImageUrl: data.coverImageUrl ?? "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80",
          createdAt: data.createdAt?.toDate?.()?.getTime?.() ?? 0,
        };
      })
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 5);

    // 3. 実際の投稿記事一覧を取得
    const postsSnap = await db.collection("posts").get();
    if (!postsSnap.empty) {
      fetchedPosts = postsSnap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          title: data.title ?? "ジャーナル記事",
          publishedAtText: data.publishedAtText ?? "2026.07.24",
          imageUrl: data.imageUrl ?? "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=800&q=80",
          summary: data.summary ?? "",
        };
      });
    }
  } catch (err) {
    console.warn("Failed to fetch siteConfig, events, or posts for UserMySpacePage:", err);
  }

  // PickUp の初期設定: 実際の公開イベントが存在すればそちらに自動差し替え
  let defaultPickups = savedConfig?.pickups;

  if (!defaultPickups || defaultPickups.length === 0) {
    const firstEvent = publishedEvents[0];
    defaultPickups = [
      {
        id: "p-1",
        type: "event",
        badgeText: "🎟️ 注目イベント",
        title: firstEvent ? firstEvent.title : "Future Tech Conference 2027",
        subtitle: firstEvent ? firstEvent.tagline || "最新のテクノロジーカンファレンス" : "AIエージェントと人間が織りなす次世代開発の最前線。",
        imageUrl: firstEvent ? firstEvent.coverImageUrl : "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80",
        href: firstEvent ? `/e/${firstEvent.slug}` : "/e/future-tech-conference-2027",
      },
      {
        id: "p-2",
        type: "shop",
        badgeText: "📦 公式ECショップ",
        title: "小倉コーラ 原液シロップ (500ml)",
        subtitle: "ハーブと柑橘が織りなす小倉発のクラフトコーラ。炭酸やミルクで割って楽しめます。",
        imageUrl: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=800&q=80",
        href: `/u/${username}`,
      },
      {
        id: "p-3",
        type: "journal",
        badgeText: "📖 注目ジャーナル",
        title: fetchedPosts[0] ? fetchedPosts[0].title : "【開発裏話】次世代イベントSaaS「GAO HUB」の設計思想",
        subtitle: fetchedPosts[0] ? fetchedPosts[0].summary : "イベント準備から自動LP生成、Stripe決済、PWA受付、EC物販、ジャーナル連動までを一元統合する裏側。",
        imageUrl: fetchedPosts[0] ? fetchedPosts[0].imageUrl : "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=800&q=80",
        href: fetchedPosts[0] ? `/j/${fetchedPosts[0].id}` : "/j/gaohub-architecture-2026",
      },
    ];
  }

  // デンソー型公式コーポレート / ブランドポータルのデータ組み立て
  const corporateProfile: CorporateProfileData = {
    username,
    brandName: savedConfig?.brandName ?? (username === "oka" ? "Future Studio 株式会社" : `公式プロジェクト ${username}`),
    tagline: savedConfig?.tagline ?? "リアルとデジタルの融合。ディープテックとフィジカルプロダクトの未来を構築する。",
    heroImages: savedConfig?.heroImages ?? [
      "https://images.unsplash.com/photo-1541888946425-d0fbb186a5b7?auto=format&fit=crop&w=1600&q=80",
      "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1600&q=80",
    ],
    youtubeUrl: savedConfig?.youtubeUrl ?? "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    aboutTitle: savedConfig?.aboutTitle ?? "フィジカルとデジタルを繋ぎ、ビジネスの非連続な成長を実現する",
    aboutDescription:
      savedConfig?.aboutDescription ??
      `Future Studio は、AIエージェントシステム「軍師」、実物IPプロダクト「emolink」、小倉の魅力を詰めた「小倉コーラ」などを展開するディープテック＆ブランドカンパニーです。`,
    aboutImageUrl: savedConfig?.aboutImageUrl ?? "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80",
    followerCount: 2450,
    pickups: defaultPickups,
    journals: fetchedPosts.length > 0
      ? fetchedPosts
      : INITIAL_JOURNAL_ARTICLES.map((item) => ({
          id: item.id,
          title: item.title,
          publishedAtText: item.publishedAtText,
          imageUrl: item.imageUrl,
          summary: item.summary,
        })),
  };

  return <CorporateBrandPortal profile={corporateProfile} />;
}
