import "server-only";
import { ImageResponse } from "next/og";
import { loadNotoSansJpBlack } from "@/lib/og-font";
import { NOISE_PNG_DATA_URI } from "@/lib/noise";
import { spectrumStopsRgba } from "@/lib/color";
import type { PublicEvent, PublicSession, PublicSpeaker } from "@/lib/server/events";

export type BannerSize = "wide" | "square" | "story";

const SIZES: Record<BannerSize, { width: number; height: number }> = {
  wide: { width: 1200, height: 630 },
  square: { width: 1080, height: 1080 },
  story: { width: 1080, height: 1920 },
};

const PAPER = "#f6f5f2";
const INK = "#18181b";

const dayFmt = new Intl.DateTimeFormat("ja-JP", {
  year: "numeric",
  month: "long",
  day: "numeric",
  weekday: "short",
  timeZone: "Asia/Tokyo",
});
const timeFmt = new Intl.DateTimeFormat("ja-JP", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Asia/Tokyo",
});

function Spec({
  label,
  value,
  scale,
}: {
  label: string;
  value: string;
  scale: number;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <span
        style={{
          fontSize: 18 * scale,
          letterSpacing: "0.3em",
          textTransform: "uppercase",
          color: "rgba(24,24,27,0.55)",
        }}
      >
        {label}
      </span>
      <span style={{ marginTop: 8 * scale, fontSize: 30 * scale, color: INK }}>{value}</span>
    </div>
  );
}

/** テンプレート(kodak/spectrum/aurora)に応じた背景グラデーションを作る。バナー共通ロジック */
function computeBackground(event: PublicEvent): string {
  const color = event.themeColor;
  if (event.template === "spectrum") {
    const [c1, c2, c3, c4] = spectrumStopsRgba(color, 0.8);
    return `
      radial-gradient(ellipse 60% 40% at 85% 10%, ${c1}, transparent 62%),
      radial-gradient(ellipse 55% 38% at 55% 40%, ${c2}, transparent 62%),
      radial-gradient(ellipse 55% 38% at 25% 70%, ${c3}, transparent 62%),
      radial-gradient(ellipse 60% 40% at 0% 100%, ${c4}, transparent 66%),
      #a1a19c
    `;
  }
  if (event.template === "aurora") {
    return `
      radial-gradient(ellipse 45% 35% at 10% 8%, ${color}88, transparent 60%),
      radial-gradient(ellipse 40% 32% at 90% 25%, ${color}55, transparent 60%),
      radial-gradient(ellipse 42% 34% at 40% 95%, ${color}44, transparent 62%),
      #f7f8fd
    `;
  }
  return `linear-gradient(150deg, ${PAPER} 0%, ${PAPER} 30%, ${color} 92%)`;
}

/** バナー共通の背景レイヤー(テンプレート背景 + カバー画像 + フィルムグレイン) */
function BannerBackdrop({
  event,
  dim,
  scale,
}: {
  event: PublicEvent;
  dim: { width: number; height: number };
  scale: number;
}) {
  return (
    <>
      {event.coverImageUrl && (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={event.coverImageUrl}
            alt=""
            width={dim.width}
            height={dim.height}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage:
                "linear-gradient(150deg, rgba(246,245,242,0.96) 0%, rgba(246,245,242,0.82) 45%, rgba(246,245,242,0.25) 100%)",
            }}
          />
        </>
      )}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `url(${NOISE_PNG_DATA_URI})`,
          backgroundRepeat: "repeat",
          backgroundSize: `${96 * scale}px ${96 * scale}px`,
          opacity: 0.5,
        }}
      />
    </>
  );
}

/** バナー共通のフッター(イベント名 + Powered by GAO HUB) */
function BannerFooter({
  eventTitle,
  scale,
}: {
  eventTitle: string;
  scale: number;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        borderTop: `${4 * scale}px solid ${INK}`,
        paddingTop: 22 * scale,
      }}
    >
      <span
        style={{
          fontSize: 18 * scale,
          letterSpacing: "0.1em",
          color: "rgba(24,24,27,0.6)",
        }}
      >
        {truncate(eventTitle, 24)}
      </span>
      <span
        style={{
          fontSize: 30 * scale,
          letterSpacing: "0.12em",
          color: INK,
        }}
      >
        GAO HUB
      </span>
    </div>
  );
}

/** 登壇者の顔写真を円形に並べる列(重なり表示)。イベント全体バナー用 */
function SpeakerRow({
  speakers,
  scale,
}: {
  speakers: PublicSpeaker[];
  scale: number;
}) {
  const avatarSize = 92 * scale;
  const overlap = avatarSize * 0.32;
  if (speakers.length === 0) return null;
  return (
    <div style={{ display: "flex", alignItems: "center" }}>
      {speakers.map((sp, i) => (
        <div
          key={sp.id}
          style={{
            display: "flex",
            width: avatarSize,
            height: avatarSize,
            borderRadius: avatarSize,
            border: `${3 * scale}px solid ${PAPER}`,
            marginLeft: i === 0 ? 0 : -overlap,
            backgroundColor: "#d4d4d8",
            overflow: "hidden",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {sp.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={sp.photoUrl}
              alt={sp.name}
              width={avatarSize}
              height={avatarSize}
              style={{ width: avatarSize, height: avatarSize, objectFit: "cover" }}
            />
          ) : (
            <span style={{ fontSize: 32 * scale, fontWeight: 900, color: "#52525b" }}>
              {sp.name.charAt(0)}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

/**
 * Satori(next/og のレンダラー)は text-overflow: ellipsis の挙動が不安定なため、
 * 折り返し崩れを避けたい短いラベルは事前に文字数で切り詰めてから渡す。
 */
function truncate(s: string, max: number): string {
  return s.length > max ? `${s.slice(0, max - 1)}…` : s;
}

/**
 * 登壇者を写真+名前+肩書のカードとして並べる。セッションバナー用(登壇者が主役)。
 * compact は Wide(横長・低い)サイズ向けの縮小指定 — 縦スペースが少ないため、
 * 全情報を確実に収める(切れさせない)ことを優先してサイズを詰める。
 */
function SpeakerShowcase({
  speakers,
  scale,
  compact = false,
}: {
  speakers: PublicSpeaker[];
  scale: number;
  compact?: boolean;
}) {
  if (speakers.length === 0) return null;
  // 人数が増えるほど1人あたりのカードを小さくして折り返す
  const baseSize = speakers.length <= 2 ? 200 : speakers.length <= 4 ? 156 : 112;
  const photoSize = (compact ? baseSize * 0.72 : baseSize) * scale;
  const nameSize = (compact ? 17 : 22) * scale;
  const subSize = (compact ? 12 : 13) * scale;
  const gapTop = (compact ? 8 : 14) * scale;
  // テキスト(会社名・肩書き)が写真より広くなりがちなので、最低幅を別に確保する
  const cardWidth = Math.max(photoSize + 24 * scale, (compact ? 170 : 210) * scale);
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: (compact ? 18 : 28) * scale, alignItems: "flex-start" }}>
      {speakers.map((sp) => (
        <div
          key={sp.id}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            width: cardWidth,
          }}
        >
          <div
            style={{
              display: "flex",
              width: photoSize,
              height: photoSize,
              borderRadius: photoSize,
              backgroundColor: "#d4d4d8",
              overflow: "hidden",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {sp.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={sp.photoUrl}
                alt={sp.name}
                width={photoSize}
                height={photoSize}
                style={{ width: photoSize, height: photoSize, objectFit: "cover" }}
              />
            ) : (
              <span style={{ fontSize: photoSize * 0.38, fontWeight: 900, color: "#52525b" }}>
                {sp.name.charAt(0)}
              </span>
            )}
          </div>
          <span
            style={{
              marginTop: gapTop,
              fontSize: nameSize,
              fontWeight: 900,
              color: INK,
              textAlign: "center",
            }}
          >
            {truncate(sp.name, 12)}
          </span>
          {/* 会社名・肩書きは縦に使う行数を抑えるため1行にまとめ、
              折り返し崩れを避けるため事前に切り詰めて確定させる */}
          {(sp.company || sp.title) && (
            <span
              style={{
                marginTop: 3 * scale,
                fontSize: subSize,
                color: "rgba(24,24,27,0.6)",
                textAlign: "center",
              }}
            >
              {truncate([sp.company, sp.title].filter(Boolean).join(" / "), compact ? 18 : 22)}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

/**
 * イベント告知バナーを生成する。テンプレート(kodak/spectrum/aurora)に応じた
 * 背景に、タイトル・日時・会場・登壇者の顔写真を載せる。3サイズ共通ロジック。
 */
export async function renderBannerImage(
  event: PublicEvent,
  speakers: PublicSpeaker[],
  size: BannerSize
): Promise<ImageResponse> {
  const dim = SIZES[size];
  const isTall = size !== "wide";
  const scale = size === "story" ? 1.5 : size === "square" ? 1.25 : 1;

  const dateText = dayFmt.format(event.startsAt);
  const doorsText = `${timeFmt.format(event.startsAt)} – ${timeFmt.format(event.endsAt)}`;
  const venueText = event.venueName || "Online";

  const fontText = `${event.title}${dateText}${doorsText}${venueText}${speakers
    .map((s) => s.name)
    .join("")}DATEVENUEDOORSPOWERED BY GAO HUB0123456789:– `;
  const fontData = await loadNotoSansJpBlack(fontText);

  const titleLen = event.title.length;
  const baseTitleSize = titleLen <= 12 ? 108 : titleLen <= 22 ? 80 : 58;
  const titleSize = baseTitleSize * (isTall ? scale * 0.92 : 1);

  const shownSpeakers = speakers.filter((s) => s.name).slice(0, size === "story" ? 6 : 5);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          position: "relative",
          backgroundColor: PAPER,
          backgroundImage: computeBackground(event),
          fontFamily: "NotoSansJP",
        }}
      >
        <BannerBackdrop event={event} dim={dim} scale={scale} />

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            padding: `${56 * scale}px ${72 * scale}px`,
          }}
        >
          {/* スペック行 */}
          <div style={{ display: "flex", gap: 56 * scale, flexWrap: "wrap" }}>
            <Spec label="Date" value={dateText} scale={scale} />
            <Spec label="Doors" value={doorsText} scale={scale} />
            <Spec label="Venue" value={venueText} scale={scale} />
          </div>

          {/* タイトル */}
          <div style={{ display: "flex", flex: 1, alignItems: "center" }}>
            <div
              style={{
                fontSize: titleSize,
                lineHeight: 1.03,
                letterSpacing: "-0.03em",
                color: INK,
                maxWidth: dim.width - 144 * scale,
                textWrap: "balance" as never,
              }}
            >
              {event.title}
            </div>
          </div>

          {/* 登壇者 */}
          {shownSpeakers.length > 0 && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                marginBottom: 28 * scale,
              }}
            >
              <span
                style={{
                  fontSize: 16 * scale,
                  letterSpacing: "0.3em",
                  textTransform: "uppercase",
                  color: "rgba(24,24,27,0.55)",
                  marginBottom: 14 * scale,
                }}
              >
                Speakers
              </span>
              <SpeakerRow speakers={shownSpeakers} scale={scale} />
            </div>
          )}

          <BannerFooter eventTitle="GAO HUB" scale={scale} />
        </div>
      </div>
    ),
    {
      ...dim,
      fonts: fontData
        ? [{ name: "NotoSansJP", data: fontData, weight: 900 as const, style: "normal" as const }]
        : undefined,
    }
  );
}

/**
 * セッション(コンテンツ)ごとの告知バナーを生成する。カンファレンスは複数のセッションが
 * 集まって完成するため、セッション単位でも共有・告知できるようにする。登壇者の顔写真が主役。
 */
export async function renderSessionBannerImage(
  event: PublicEvent,
  session: PublicSession,
  speakers: PublicSpeaker[],
  size: BannerSize
): Promise<ImageResponse> {
  const dim = SIZES[size];
  const isTall = size !== "wide";
  const scale = size === "story" ? 1.5 : size === "square" ? 1.25 : 1;

  const dateText = dayFmt.format(session.startsAt);
  const timeText = `${timeFmt.format(session.startsAt)} – ${timeFmt.format(session.endsAt)}`;

  const fontText = `${session.title}${event.title}${dateText}${timeText}${session.track}${speakers
    .map((s) => `${s.name}${s.company}${s.title}`)
    .join("")}DATE TIME TRACK SPEAKERS GAO HUB0123456789:– /`;
  const fontData = await loadNotoSansJpBlack(fontText);

  const titleLen = session.title.length;
  const baseTitleSize = titleLen <= 16 ? 72 : titleLen <= 32 ? 54 : 40;
  // Wide は縦が狭く2行になった際のスペースが厳しいため、やや小さめに倒す
  const titleSize = baseTitleSize * (isTall ? scale * 0.92 : 0.84);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          position: "relative",
          backgroundColor: PAPER,
          backgroundImage: computeBackground(event),
          fontFamily: "NotoSansJP",
        }}
      >
        <BannerBackdrop event={event} dim={dim} scale={scale} />

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            padding: `${56 * scale}px ${72 * scale}px`,
          }}
        >
          {/* スペック行 */}
          <div style={{ display: "flex", gap: 56 * scale, flexWrap: "wrap" }}>
            <Spec label="Date" value={dateText} scale={scale} />
            <Spec label="Time" value={timeText} scale={scale} />
            {session.track && <Spec label="Track" value={session.track} scale={scale} />}
          </div>

          {/* セッションタイトル */}
          <div style={{ display: "flex", marginTop: (isTall ? 32 : 20) * scale }}>
            <div
              style={{
                fontSize: titleSize,
                lineHeight: 1.08,
                letterSpacing: "-0.02em",
                color: INK,
                maxWidth: dim.width - 144 * scale,
                textWrap: "balance" as never,
              }}
            >
              {session.title}
            </div>
          </div>

          {/* 登壇者(主役として大きく表示)。alignItems は center にすると
              コンテナが窮屈な場合に上下へはみ出すため、常に上詰めにする。
              Wide は縦が狭いので SpeakerShowcase を compact 表示にする */}
          <div
            style={{
              display: "flex",
              flex: 1,
              alignItems: "flex-start",
              marginTop: (isTall ? 24 : 16) * scale,
              marginBottom: 16 * scale,
              overflow: "hidden",
            }}
          >
            <SpeakerShowcase speakers={speakers} scale={scale} compact={!isTall} />
          </div>

          <BannerFooter eventTitle={event.title} scale={scale} />
        </div>
      </div>
    ),
    {
      ...dim,
      fonts: fontData
        ? [{ name: "NotoSansJP", data: fontData, weight: 900 as const, style: "normal" as const }]
        : undefined,
    }
  );
}

export const BANNER_SIZES = SIZES;
