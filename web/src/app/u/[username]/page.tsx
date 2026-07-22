import { MySpacePortal } from "@/components/sns/MySpacePortal";

export const dynamic = "force-dynamic";

export async function generateMetadata(props: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await props.params;
  const name = username === "oka" ? "岡 浩平 / Future Studio" : `@${username}`;
  return {
    title: `${name} | GAO HUB マイスペース`,
    description: `${name} のGAO HUB公式マイスペース。最新の投稿、限定物販、イベント情報を配信中。`,
  };
}

export default async function UserMySpacePage(props: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await props.params;

  // モック / 将来的には Firestore からユーザー情報をフェッチ
  const dummyProfile = {
    username,
    displayName: username === "oka" ? "岡 浩平 / Future Studio" : `主催者 ${username}`,
    bio: "Future Studio 代表。ディープテック、空間デザイン、小倉コーラ、AIエージェントの社会実装を推進中。世界観とリアルの熱量を届けるコミュニティSNS「GAO HUB」を展開しています。",
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
    coverImageUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1600&q=80",
    categories: ["テック", "地域創生", "デザイン", "フード"],
    followerCount: 1280,
    links: [
      { label: "公式Webサイト", url: "https://future-studio.jp" },
      { label: "Note", url: "https://note.com" },
      { label: "X (Twitter)", url: "https://twitter.com" },
    ],
  };

  return <MySpacePortal profile={dummyProfile} />;
}
