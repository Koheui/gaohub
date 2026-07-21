import "server-only";
import { ImageResponse } from "next/og";
import { loadNotoSansJpBlack } from "@/lib/og-font";
import { NOISE_PNG_DATA_URI } from "@/lib/noise";
import { spectrumStopsRgba } from "@/lib/color";
import type { PublicEvent, PublicSession, PublicSpeaker } from "@/lib/server/events";

export type BannerSize = "wide" | "square" | "story";

/** セッションバナーのデザインパターン */
export type SessionBannerStyle =
  | "classic"
  | "duotone"
  | "geo"
  | "workandrole"
  | "type-heavy"
  | "monochrome-minimal"
  | "split-duotone";

/** イベント全体バナーのデザインパターン */
export type EventBannerStyle = "classic" | "timetable";

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

/**
 * バナーのアクセント色を rgba() で返す。Satori は hsl() の扱いが不安定なため
 * 常に rgba 文字列にする。spectrum はLPと同じ生成パレットの第一色に揃える。
 */
function accentRgba(event: PublicEvent, alpha: number): string {
  if (event.template === "spectrum") {
    return spectrumStopsRgba(event.themeColor, alpha)[0];
  }
  const m = /^#?([0-9a-f]{6})$/i.exec(event.themeColor.trim());
  if (!m) return `rgba(109, 40, 217, ${alpha})`;
  const n = parseInt(m[1], 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

/** テンプレート(kodak/spectrum/aurora)に応じた背景グラデーションを作る。バナー共通ロジック */
function computeBackground(event: PublicEvent): string {
  const color = event.themeColor || "#18181b";
  return `linear-gradient(150deg, ${PAPER} 0%, ${PAPER} 35%, ${color} 95%)`;
}

/** バナー共通の背景レイヤー(テンプレート背景 + カバー画像 + フィルムグレインノイズ) */
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
              top: 0,
            left: 0,
            width: "100%",
            height: "100%",
              backgroundImage:
                "linear-gradient(150deg, rgba(246,245,242,0.96) 0%, rgba(246,245,242,0.82) 45%, rgba(246,245,242,0.25) 100%)",
            }}
          />
        </>
      )}
      {/* フィルムグレインノイズ(ざらざらした粒子感) */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={NOISE_PNG_DATA_URI}
        alt=""
        width={dim.width}
        height={dim.height}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          opacity: 0.35,
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
          fontFamily: fontData ? "NotoSansJP" : "sans-serif",
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
  size: BannerSize,
  style: SessionBannerStyle = "classic"
): Promise<ImageResponse> {
  const dim = SIZES[size];
  const isTall = size !== "wide";
  const scale = size === "story" ? 1.5 : size === "square" ? 1.25 : 1;

  const dateText = dayFmt.format(session.startsAt);
  const timeText = `${timeFmt.format(session.startsAt)} – ${timeFmt.format(session.endsAt)}`;

  const fontText = `${session.title}${event.title}${dateText}${timeText}${session.track}${speakers
    .map((s) => `${s.name}${s.company}${s.title}`)
    .join("")}DATE TIME TRACK SPEAKERS GAO HUB0123456789:– /・`;
  const fontData = await loadNotoSansJpBlack(fontText);
  const fonts = fontData
    ? [{ name: "NotoSansJP", data: fontData, weight: 900 as const, style: "normal" as const }]
    : undefined;

  const shared = { event, session, speakers, size, dim, isTall, scale, dateText, timeText, fonts };
  if (style === "workandrole") return renderSessionWorkAndRole(shared);
  if (style === "duotone") return renderSessionDuotone(shared);
  if (style === "geo") return renderSessionGeo(shared);
  if (style === "type-heavy") return renderSessionTypeHeavy(shared);
  if (style === "monochrome-minimal") return renderSessionMonochrome(shared);
  if (style === "split-duotone") return renderSessionSplitDuotone(shared);

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
          fontFamily: fontData ? "NotoSansJP" : "sans-serif",
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

interface SessionBannerArgs {
  event: PublicEvent;
  session: PublicSession;
  speakers: PublicSpeaker[];
  size: BannerSize;
  dim: { width: number; height: number };
  isTall: boolean;
  scale: number;
  dateText: string;
  timeText: string;
  fonts?: { name: string; data: ArrayBuffer; weight: 900; style: "normal" }[];
}

/**
 * デュオトーン: 紙地に特大タイトル+登壇者写真の矩形カードへ
 * アクセントカラーのグラデーションを重ねる(RIOBook風のウェビナー告知)。
 */
function renderSessionDuotone(args: SessionBannerArgs): ImageResponse {
  const { event, session, speakers, dim, isTall, scale, dateText, timeText, fonts } = args;
  const n = Math.max(1, Math.min(speakers.length, 4));
  const shown = speakers.slice(0, 4);

  const titleLen = session.title.length;
  const titleSize = (titleLen <= 16 ? 64 : titleLen <= 32 ? 50 : 38) * (isTall ? scale : 0.9);
  // カードは 3:4。Wide は縦が厳しいので小さめに固定
  const cardH = (isTall ? 430 : 240) * (isTall ? scale * 0.8 : 1);
  const cardW = Math.min(cardH * 0.76, (dim.width - 200 * scale) / n);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          position: "relative",
          backgroundColor: PAPER,
          fontFamily: fonts ? "NotoSansJP" : "sans-serif",
          padding: `${40 * scale}px ${64 * scale}px`,
        }}
      >


        {/* イベント名チップ */}
        <div
          style={{
            display: "flex",
            backgroundColor: accentRgba(event, 1),
            color: "#ffffff",
            padding: `${6 * scale}px ${18 * scale}px`,
            fontSize: 18 * scale,
            borderRadius: 6 * scale,
          }}
        >
          {truncate(event.title, 24)}
        </div>

        {/* タイトル(中央揃え) */}
        <div
          style={{
            display: "flex",
            marginTop: 18 * scale,
            fontSize: titleSize,
            lineHeight: 1.06,
            letterSpacing: "-0.02em",
            color: INK,
            textAlign: "center",
            maxWidth: dim.width - 128 * scale,

          }}
        >
          {session.title}
        </div>

        {/* 日時スペック */}
        <div
          style={{
            display: "flex",
            marginTop: 14 * scale,
            fontSize: 22 * scale,
            color: "rgba(24,24,27,0.7)",
          }}
        >
          {dateText} ・ {timeText}
          {session.track ? ` ・ ${session.track}` : ""}
        </div>

        {/* 登壇者カード列 */}
        <div
          style={{
            display: "flex",
            flex: 1,
            alignItems: "center",
            gap: 28 * scale,
            marginTop: 20 * scale,
          }}
        >
          {shown.map((sp) => (
            <div
              key={sp.id}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", width: cardW }}
            >
              <div
                style={{
                  display: "flex",
                  position: "relative",
                  width: cardW,
                  height: cardH,
                  borderRadius: 10 * scale,
                  overflow: "hidden",
                  backgroundColor: "#e4e4e7",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {sp.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={sp.photoUrl}
                    alt={sp.name}
                    width={cardW}
                    height={cardH}
                    style={{ width: cardW, height: cardH, objectFit: "cover" }}
                  />
                ) : (
                  <span style={{ fontSize: cardW * 0.42, fontWeight: 900, color: "#a1a1aa" }}>
                    {sp.name.charAt(0)}
                  </span>
                )}
                {/* デュオトーンの色被せ(下ほど濃く) */}
                <div
                  style={{
                    position: "absolute",
                    top: 0,
            left: 0,
            width: "100%",
            height: "100%",
                    backgroundImage: `linear-gradient(180deg, ${accentRgba(event, 0.08)} 0%, ${accentRgba(event, 0.28)} 55%, ${accentRgba(event, 0.82)} 100%)`,
                  }}
                />
                {/* カード内の名前(下部) */}
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    bottom: 12 * scale,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                  }}
                >
                  <span style={{ fontSize: 22 * scale, fontWeight: 900, color: "#ffffff" }}>
                    {truncate(sp.name, 10)}
                  </span>
                  {(sp.company || sp.title) && (
                    <span style={{ fontSize: 13 * scale, color: "rgba(255,255,255,0.85)" }}>
                      {truncate([sp.company, sp.title].filter(Boolean).join(" / "), 18)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* フッター */}
        <div
          style={{
            display: "flex",
            width: "100%",
            alignItems: "center",
            justifyContent: "space-between",
            borderTop: `${3 * scale}px solid ${INK}`,
            paddingTop: 16 * scale,
            marginTop: 20 * scale,
          }}
        >
          <span style={{ fontSize: 16 * scale, letterSpacing: "0.3em", color: "rgba(24,24,27,0.55)" }}>
            FREE / TICKET
          </span>
          <span style={{ fontSize: 26 * scale, letterSpacing: "0.12em", color: INK }}>GAO HUB</span>
        </div>
      </div>
    ),
    { ...dim, fonts }
  );
}

/**
 * ジオメトリック: 登壇者写真を全面に敷き、斜めのカラーブロックを
 * 重ねて文字を載せる(コーポレートフライヤー/DCPilot風)。
 */
function renderSessionGeo(args: SessionBannerArgs): ImageResponse {
  const { event, session, speakers, dim, isTall, scale, dateText, timeText, fonts } = args;
  const shown = speakers.slice(0, 3);

  const titleLen = session.title.length;
  const titleSize = (titleLen <= 16 ? 58 : titleLen <= 32 ? 46 : 36) * (isTall ? scale : 0.95);
  const namesLine = shown
    .map((s) => s.name)
    .filter(Boolean)
    .join(" / ");

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          backgroundColor: INK,
          fontFamily: fonts ? "NotoSansJP" : "sans-serif",
        }}
      >
        {/* 登壇者写真を全面のカラムとして敷く */}
        <div style={{ display: "flex", width: "100%", height: "100%" }}>
          {(shown.length > 0 ? shown : [null]).map((sp, i) => (
            <div
              key={sp?.id ?? i}
              style={{
                display: "flex",
                flex: 1,
                position: "relative",
                backgroundColor: i % 2 === 0 ? "#26262b" : "#1c1c20",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
              }}
            >
              {sp?.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={sp.photoUrl}
                  alt={sp.name}
                  width={dim.width}
                  height={dim.height}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                <span style={{ fontSize: 160 * scale, fontWeight: 900, color: accentRgba(event, 0.5) }}>
                  {sp?.name.charAt(0) ?? "G"}
                </span>
              )}
            </div>
          ))}
        </div>

        {/* 下部グラデーション(文字の可読性) */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundImage: `linear-gradient(180deg, transparent 0%, ${INK} 90%)`,
          }}
        />


        {/* テキストブロック(左下) */}
        <div
          style={{
            position: "absolute",
            left: 56 * scale,
            right: 56 * scale,
            bottom: 44 * scale,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <span
            style={{
              fontSize: 18 * scale,
              letterSpacing: "0.25em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.75)",
            }}
          >
            {dateText} ・ {timeText}
            {session.track ? ` ・ ${session.track}` : ""}
          </span>
          <span
            style={{
              marginTop: 12 * scale,
              fontSize: titleSize,
              lineHeight: 1.08,
              letterSpacing: "-0.02em",
              color: "#ffffff",
              maxWidth: dim.width - (isTall ? 112 : 260) * scale,
  
            }}
          >
            {session.title}
          </span>
          {namesLine && (
            <span
              style={{
                marginTop: 14 * scale,
                fontSize: 24 * scale,
                fontWeight: 900,
                color: accentRgba(event, 1),
              }}
            >
              {truncate(namesLine, 30)}
            </span>
          )}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginTop: 18 * scale,
              borderTop: "2px solid rgba(255,255,255,0.35)",
              paddingTop: 12 * scale,
            }}
          >
            <span style={{ fontSize: 15 * scale, letterSpacing: "0.12em", color: "rgba(255,255,255,0.65)" }}>
              {truncate(event.title, 24)}
            </span>
            <span style={{ fontSize: 22 * scale, letterSpacing: "0.12em", color: "#ffffff" }}>
              GAO HUB
            </span>
          </div>
        </div>
      </div>
    ),
    { ...dim, fonts }
  );
}

/**
 * type-heavy(タイポグラフィ・ポスター): 登壇者写真を暗く敷き詰めた上に、
 * セッションタイトルを画面いっぱいの巨大文字で配置するポスター調。
 */
function renderSessionTypeHeavy(args: SessionBannerArgs): ImageResponse {
  const { event, session, speakers, dim, isTall, scale, dateText, timeText, fonts } = args;
  const hero = speakers.find((s) => s.photoUrl) ?? speakers[0];
  const titleLen = session.title.length;
  const titleSize = (titleLen <= 12 ? 130 : titleLen <= 24 ? 96 : titleLen <= 40 ? 68 : 52) * (isTall ? scale : 0.9);
  const names = speakers.map((s) => s.name).filter(Boolean).join("  /  ");

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          position: "relative",
          backgroundColor: "#0b0b0d",
          fontFamily: fonts ? "NotoSansJP" : "sans-serif",
        }}
      >
        {hero?.photoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={hero.photoUrl}
            alt=""
            width={dim.width}
            height={dim.height}
            style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover" }}
          />
        )}
        {/* 濃い色被せ(可読性 + テーマカラーの気配) */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundImage: `linear-gradient(180deg, rgba(11,11,13,0.72) 0%, rgba(11,11,13,0.55) 45%, ${accentRgba(event, 0.6)} 130%)`,
          }}
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={NOISE_PNG_DATA_URI}
          alt=""
          width={dim.width}
          height={dim.height}
          style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.28 }}
        />

        <div style={{ display: "flex", flexDirection: "column", flex: 1, position: "relative", padding: `${56 * scale}px ${60 * scale}px` }}>
          <span style={{ fontSize: 20 * scale, letterSpacing: "0.28em", textTransform: "uppercase", color: "rgba(255,255,255,0.8)" }}>
            {dateText} ・ {timeText}
            {session.track ? ` ・ ${session.track}` : ""}
          </span>
          <div style={{ display: "flex", flex: 1, alignItems: "center" }}>
            <div
              style={{
                fontSize: titleSize,
                lineHeight: 0.98,
                letterSpacing: "-0.03em",
                color: "#ffffff",
                textTransform: "uppercase",
                maxWidth: dim.width - 120 * scale,
              }}
            >
              {session.title}
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {names && (
              <span style={{ fontSize: 26 * scale, fontWeight: 900, color: accentRgba(event, 1), marginBottom: 16 * scale }}>
                {truncate(names, isTall ? 40 : 34)}
              </span>
            )}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                borderTop: "2px solid rgba(255,255,255,0.3)",
                paddingTop: 14 * scale,
              }}
            >
              <span style={{ fontSize: 15 * scale, letterSpacing: "0.12em", color: "rgba(255,255,255,0.7)" }}>
                {truncate(event.title, 26)}
              </span>
              <span style={{ fontSize: 22 * scale, letterSpacing: "0.12em", color: "#ffffff" }}>GAO HUB</span>
            </div>
          </div>
        </div>
      </div>
    ),
    { ...dim, fonts }
  );
}

/**
 * monochrome-minimal(モノクロ・エディトリアル): 白地に細い黒フレームと
 * 直線グリッド、黒の特大タイトル、登壇者は円形サムネイルで端正に並べる。
 */
function renderSessionMonochrome(args: SessionBannerArgs): ImageResponse {
  const { event, session, speakers, dim, isTall, scale, dateText, timeText, fonts } = args;
  const shown = speakers.slice(0, isTall ? 5 : 4);
  const titleLen = session.title.length;
  const titleSize = (titleLen <= 16 ? 72 : titleLen <= 32 ? 54 : 42) * (isTall ? scale * 0.95 : 0.82);
  const thumb = (isTall ? 96 : 82) * scale;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          backgroundColor: "#ffffff",
          fontFamily: fonts ? "NotoSansJP" : "sans-serif",
        }}
      >
        {/* 細い黒フレーム */}
        <div
          style={{
            position: "absolute",
            top: 24 * scale,
            left: 24 * scale,
            width: dim.width - 48 * scale,
            height: dim.height - 48 * scale,
            border: `${2 * scale}px solid #111`,
          }}
        />
        {/* 中央の水平ルール */}
        <div
          style={{
            position: "absolute",
            left: 24 * scale,
            top: dim.height * 0.52,
            width: dim.width - 48 * scale,
            height: `${1 * scale}px`,
            backgroundColor: "#111",
          }}
        />
        <div style={{ display: "flex", flexDirection: "column", flex: 1, padding: `${60 * scale}px ${60 * scale}px` }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: 17 * scale, letterSpacing: "0.28em", textTransform: "uppercase", color: "#111" }}>
              {dateText} ・ {timeText}
            </span>
            {session.track && (
              <span style={{ fontSize: 17 * scale, letterSpacing: "0.28em", textTransform: "uppercase", color: "#111" }}>
                {session.track}
              </span>
            )}
          </div>
          <div style={{ display: "flex", flex: 1, alignItems: "center", marginTop: 20 * scale }}>
            <div style={{ fontSize: titleSize, lineHeight: 1.06, letterSpacing: "-0.02em", color: "#111", maxWidth: dim.width - 130 * scale }}>
              {session.title}
            </div>
          </div>
          <div style={{ display: "flex", gap: 26 * scale, alignItems: "flex-start", marginBottom: 8 * scale }}>
            {shown.map((sp) => (
              <div key={sp.id} style={{ display: "flex", flexDirection: "column", alignItems: "center", width: thumb + 20 * scale }}>
                <div
                  style={{
                    display: "flex",
                    width: thumb,
                    height: thumb,
                    borderRadius: thumb,
                    border: `${2 * scale}px solid #111`,
                    backgroundColor: "#e5e5e5",
                    overflow: "hidden",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {sp.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={sp.photoUrl} alt={sp.name} width={thumb} height={thumb} style={{ width: thumb, height: thumb, objectFit: "cover" }} />
                  ) : (
                    <span style={{ fontSize: thumb * 0.4, fontWeight: 900, color: "#111" }}>{sp.name.charAt(0)}</span>
                  )}
                </div>
                <span style={{ marginTop: 8 * scale, fontSize: 14 * scale, fontWeight: 900, color: "#111", textAlign: "center" }}>
                  {truncate(sp.name, 10)}
                </span>
              </div>
            ))}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderTop: "2px solid #111",
              paddingTop: 14 * scale,
            }}
          >
            <span style={{ fontSize: 15 * scale, letterSpacing: "0.12em", color: "#555" }}>{truncate(event.title, 26)}</span>
            <span style={{ fontSize: 22 * scale, letterSpacing: "0.12em", color: "#111" }}>GAO HUB</span>
          </div>
        </div>
      </div>
    ),
    { ...dim, fonts }
  );
}

/**
 * split-duotone(左右2色分割デュオトーン): 画面を2色に大胆に分割し、
 * 片側に登壇者写真を配置してアクセントカラーの半透明レイヤーで染める。
 */
function renderSessionSplitDuotone(args: SessionBannerArgs): ImageResponse {
  const { event, session, speakers, dim, isTall, scale, dateText, timeText, fonts } = args;
  const hero = speakers.find((s) => s.photoUrl) ?? speakers[0];
  const names = speakers.map((s) => s.name).filter(Boolean).join(" / ");
  const titleLen = session.title.length;
  const titleSize = (titleLen <= 16 ? 58 : titleLen <= 32 ? 44 : 34) * (isTall ? scale : 0.95);
  const NAVY = "#14293f";
  // 縦長サイズは上下分割、横長は左右分割
  const rowLayout = isTall ? "column" : "row";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: rowLayout,
          position: "relative",
          backgroundColor: NAVY,
          fontFamily: fonts ? "NotoSansJP" : "sans-serif",
        }}
      >
        {/* テキスト側(ネイビー) */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flexBasis: isTall ? "50%" : "56%",
            padding: `${52 * scale}px ${52 * scale}px`,
            justifyContent: "space-between",
          }}
        >
          <span style={{ fontSize: 18 * scale, letterSpacing: "0.24em", textTransform: "uppercase", color: "rgba(255,255,255,0.75)" }}>
            {dateText} ・ {timeText}
            {session.track ? ` ・ ${session.track}` : ""}
          </span>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: titleSize, lineHeight: 1.08, letterSpacing: "-0.02em", color: "#ffffff", maxWidth: dim.width * (isTall ? 0.86 : 0.5) }}>
              {session.title}
            </div>
            {names && (
              <span style={{ marginTop: 16 * scale, fontSize: 24 * scale, fontWeight: 900, color: accentRgba(event, 1) }}>
                {truncate(names, isTall ? 34 : 26)}
              </span>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "2px solid rgba(255,255,255,0.3)", paddingTop: 12 * scale }}>
            <span style={{ fontSize: 15 * scale, letterSpacing: "0.12em", color: "rgba(255,255,255,0.65)" }}>{truncate(event.title, 22)}</span>
            <span style={{ fontSize: 22 * scale, letterSpacing: "0.12em", color: "#ffffff" }}>GAO HUB</span>
          </div>
        </div>
        {/* 写真側(アクセントで染める) */}
        <div style={{ display: "flex", flex: 1, position: "relative", overflow: "hidden", alignItems: "center", justifyContent: "center", backgroundColor: accentRgba(event, 1) }}>
          {hero?.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={hero.photoUrl}
              alt={hero.name}
              width={dim.width}
              height={dim.height}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <span style={{ fontSize: 180 * scale, fontWeight: 900, color: "rgba(255,255,255,0.6)" }}>
              {hero?.name.charAt(0) ?? "G"}
            </span>
          )}
          {/* デュオトーンの染めレイヤー(アクセント + ネイビー) */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              backgroundImage: `linear-gradient(145deg, ${accentRgba(event, 0.55)} 0%, ${accentRgba(event, 0.2)} 45%, rgba(20,41,63,0.62) 100%)`,
            }}
          />
        </div>
      </div>
    ),
    { ...dim, fonts }
  );
}

/**
 * タイムテーブル型バナー(イベント全体)。参考: カンファレンスの
 * プログラムポスター — アクセントの淡色地に、日付・時間帯の特大ヘッダーと
 * セッション一覧(時刻/会場/タイトル/登壇者)を罫線区切りで並べる。
 * コンテンツ(セッション・登壇者)と完全連動し、手作業なしで最新の
 * プログラム表になる。
 */
export async function renderTimetableBannerImage(
  event: PublicEvent,
  sessions: PublicSession[],
  speakers: PublicSpeaker[],
  size: BannerSize
): Promise<ImageResponse> {
  const dim = SIZES[size];
  const isTall = size !== "wide";
  const scale = size === "story" ? 1.35 : size === "square" ? 1.15 : 1;

  const speakerById = new Map(speakers.map((s) => [s.id, s]));
  const maxRows = size === "story" ? 8 : size === "square" ? 5 : 3;
  const shown = sessions.slice(0, maxRows);
  const remaining = sessions.length - shown.length;

  const dateShort = new Intl.DateTimeFormat("ja-JP", {
    month: "2-digit",
    day: "2-digit",
    timeZone: "Asia/Tokyo",
  }).format(event.startsAt);
  const yearShort = new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    timeZone: "Asia/Tokyo",
  })
    .format(event.startsAt)
    .replace("年", "");
  const doorsText = `${timeFmt.format(event.startsAt)} – ${timeFmt.format(event.endsAt)}`;

  const rowsText = shown
    .map((s) => {
      const names = s.speakerIds
        .map((id) => speakerById.get(id)?.name)
        .filter(Boolean)
        .join("、");
      return `${s.title}${s.track}${names}${timeFmt.format(s.startsAt)}${timeFmt.format(s.endsAt)}`;
    })
    .join("");
  const fontText = `${event.title}${event.venueName}${dateShort}${yearShort}${doorsText}${rowsText}TIMETABLE GAO HUB0123456789:–・/ 他セッション`;
  const fontData = await loadNotoSansJpBlack(fontText);
  const fonts = fontData
    ? [{ name: "NotoSansJP", data: fontData, weight: 900 as const, style: "normal" as const }]
    : undefined;

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
          fontFamily: fontData ? "NotoSansJP" : "sans-serif",
        }}
      >
        {/* アクセントの淡色地 */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: accentRgba(event, 0.34),
          }}
        />


        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            padding: `${44 * scale}px ${60 * scale}px`,
          }}
        >
          {/* ヘッダー: 日付と時間帯を特大で */}
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
            }}
          >
            <span
              style={{
                fontSize: (isTall ? 64 : 52) * scale,
                letterSpacing: "-0.02em",
                color: INK,
              }}
            >
              {yearShort}.{dateShort.replace("/", ".")}
            </span>
            <span
              style={{
                fontSize: (isTall ? 64 : 52) * scale,
                letterSpacing: "-0.02em",
                color: INK,
              }}
            >
              {doorsText}
            </span>
          </div>

          {/* タイトル行 + 会場チップ */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 18 * scale,
              marginTop: (isTall ? 30 : 16) * scale,
            }}
          >
            <span
              style={{
                fontSize: (isTall ? 46 : 38) * scale,
                letterSpacing: "-0.02em",
                color: INK,
              }}
            >
              {truncate(event.title, 16)}
            </span>
            <span
              style={{
                display: "flex",
                backgroundColor: accentRgba(event, 1),
                color: "#ffffff",
                padding: `${5 * scale}px ${14 * scale}px`,
                borderRadius: 8 * scale,
                fontSize: 17 * scale,
              }}
            >
              TIMETABLE
            </span>
            {event.venueName && (
              <span
                style={{
                  display: "flex",
                  border: `${2 * scale}px solid ${INK}`,
                  color: INK,
                  padding: `${4 * scale}px ${14 * scale}px`,
                  borderRadius: 999,
                  fontSize: 17 * scale,
                }}
              >
                {truncate(event.venueName, 14)}
              </span>
            )}
          </div>

          {/* セッション一覧(罫線区切り) */}
          <div style={{ display: "flex", flexDirection: "column", flex: 1, marginTop: 14 * scale }}>
            {shown.map((s) => {
              const names = s.speakerIds
                .map((id) => speakerById.get(id)?.name)
                .filter(Boolean)
                .join("、");
              return (
                <div
                  key={s.id}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 22 * scale,
                    borderTop: `${2 * scale}px solid ${INK}`,
                    paddingTop: 12 * scale,
                    paddingBottom: 12 * scale,
                  }}
                >
                  <span
                    style={{
                      fontSize: 22 * scale,
                      color: INK,
                      width: 150 * scale,
                    }}
                  >
                    {timeFmt.format(s.startsAt)}–{timeFmt.format(s.endsAt)}
                  </span>
                  <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 * scale }}>
                      {s.track && (
                        <span
                          style={{
                            display: "flex",
                            border: `${1.5 * scale}px solid ${INK}`,
                            padding: `${2 * scale}px ${10 * scale}px`,
                            borderRadius: 6 * scale,
                            fontSize: 13 * scale,
                            color: INK,
                            textTransform: "uppercase",
                            letterSpacing: "0.08em",
                          }}
                        >
                          {truncate(s.track, 12)}
                        </span>
                      )}
                      <span style={{ fontSize: 22 * scale, color: INK }}>
                        {truncate(s.title, isTall ? 24 : 28)}
                      </span>
                    </div>
                    {names && (
                      <span
                        style={{
                          marginTop: 4 * scale,
                          fontSize: 16 * scale,
                          color: "rgba(24,24,27,0.65)",
                        }}
                      >
                        {truncate(names, 34)}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
            {remaining > 0 && (
              <div
                style={{
                  display: "flex",
                  borderTop: `${2 * scale}px solid ${INK}`,
                  paddingTop: 12 * scale,
                  fontSize: 17 * scale,
                  color: "rgba(24,24,27,0.6)",
                }}
              >
                他 {remaining} セッション
              </div>
            )}
          </div>

          {/* フッター */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderTop: `${3 * scale}px solid ${INK}`,
              paddingTop: 14 * scale,
            }}
          >
            <span style={{ fontSize: 15 * scale, letterSpacing: "0.12em", color: "rgba(24,24,27,0.6)" }}>
              {truncate(event.venueAddress || event.venueName || "", 26)}
            </span>
            <span style={{ fontSize: 24 * scale, letterSpacing: "0.12em", color: INK }}>GAO HUB</span>
          </div>
        </div>
      </div>
    ),
    { ...dim, fonts }
  );
}

/**
 * WORK AND ROLE スタイル (決定版):
 * LP共通の洗練された斜めグラデーション背景に、背景透過切り抜き人物像がダイナミックに並び、
 * スタイリッシュなネームタグと大迫力セッションタイトルを配した決定版バナー。
 */
function renderSessionWorkAndRole(args: SessionBannerArgs): ImageResponse {
  const { event, session, speakers, dim, isTall, scale, dateText, timeText, fonts } = args;
  const accentColor = accentRgba(event, 1);
  const shownSpeakers = speakers.slice(0, 5);

  const speakerCount = shownSpeakers.length;
  const speakerHeight = (speakerCount <= 1 ? (isTall ? 540 : 440) : speakerCount <= 3 ? (isTall ? 440 : 360) : (isTall ? 360 : 300)) * scale;
  const speakerWidth = (speakerCount <= 1 ? (isTall ? 400 : 320) : speakerCount <= 3 ? (isTall ? 280 : 220) : (isTall ? 220 : 180)) * scale;
  const archRadius = (speakerCount <= 1 ? 200 : 140) * scale;

  const titleLen = session.title.length;
  const titleSize = (titleLen <= 14 ? 48 : titleLen <= 24 ? 36 : 28) * scale;
  const descSize = 14 * scale;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "row", // 左右非対称の黄金スプリットレイアウト
          position: "relative",
          backgroundColor: PAPER,
          backgroundImage: computeBackground(event),
          fontFamily: fonts ? "NotoSansJP" : "sans-serif",
          overflow: "hidden",
        }}
      >
        <BannerBackdrop event={event} dim={dim} scale={scale} />

        {/* 緻密で粒子の荒いノイズグラデーション (リピート描画で絶対ボケない高解像度テクスチャ) */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `url(${NOISE_PNG_DATA_URI})`,
            backgroundRepeat: "repeat",
            backgroundSize: `${128 * scale}px ${128 * scale}px`,
            opacity: 0.65,
            mixBlendMode: "overlay",
          }}
        />

        {/* 左半分：ドカンと大迫力かつクリーンな登壇者切り抜き人物像 (底辺へ接地) */}
        <div
          style={{
            display: "flex",
            width: "46%",
            height: "100%",
            alignItems: "flex-end",
            justifyContent: "center",
            position: "relative",
            zIndex: 10,
            paddingLeft: 32 * scale,
          }}
        >
          {shownSpeakers.map((sp, idx) => (
            <div
              key={sp.id || idx}
              style={{
                display: "flex",
                alignItems: "flex-end",
                position: "relative",
                margin: `0 ${speakerCount <= 1 ? 0 : -28 * scale}px`,
              }}
            >
              {sp.photoUrl ? (
                <div
                  style={{
                    display: "flex",
                    height: `${speakerHeight}px`,
                    width: `${speakerWidth}px`,
                    borderRadius: `${archRadius}px ${archRadius}px 0 0`,
                    overflow: "hidden",
                    alignItems: "flex-end",
                    justifyContent: "center",
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={sp.photoUrl}
                    alt=""
                    style={{
                      height: "100%",
                      width: "100%",
                      objectFit: "cover",
                      filter: "grayscale(100%) contrast(120%) brightness(102%)",
                    }}
                  />
                </div>
              ) : (
                <div
                  style={{
                    display: "flex",
                    width: `${speakerWidth}px`,
                    height: `${speakerHeight * 0.75}px`,
                    backgroundColor: "#3f3f46",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: `${archRadius}px ${archRadius}px 0 0`,
                    color: "#ffffff",
                    fontSize: 64 * scale,
                    fontWeight: 900,
                  }}
                >
                  {sp.name.charAt(0)}
                </div>
              )}
              {/* プロフィールネームプレート (被らないように配置) */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  padding: `${8 * scale}px ${12 * scale}px`,
                  backgroundColor: "rgba(24,24,27,0.95)",
                  color: "#ffffff",
                  borderRadius: 6 * scale,
                  boxShadow: "0 6px 18px rgba(0,0,0,0.35)",
                  marginLeft: -32 * scale,
                  marginBottom: 32 * scale,
                  zIndex: 20,
                  maxWidth: 160 * scale,
                  border: "1.5px solid rgba(255,255,255,0.25)",
                }}
              >
                <span style={{ fontSize: (speakerCount <= 1 ? 14 : 12) * scale, fontWeight: 900, color: "#ffffff" }}>
                  {truncate(sp.name, 10)}
                </span>
                {(sp.company || sp.title) && (
                  <span style={{ fontSize: 9 * scale, fontWeight: 700, color: "rgba(255,255,255,0.75)", marginTop: 2 * scale }}>
                    {truncate(sp.company || sp.title, 14)}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* 右半分：テキスト・詳細エリア (写真と重ならず完璧に読める！) */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: "54%",
            height: "100%",
            justifyContent: "center",
            padding: `40px ${48 * scale}px 40px ${24 * scale}px`,
            zIndex: 30,
            position: "relative",
          }}
        >
          {/* イベント名 & カテゴリバッジ */}
          <div style={{ display: "flex", alignItems: "center", gap: 14 * scale, marginBottom: 20 * scale }}>
            <span
              style={{
                fontSize: 14 * scale,
                fontWeight: 900,
                color: INK,
                letterSpacing: "0.08em",
                padding: `${5 * scale}px ${14 * scale}px`,
                border: `${2 * scale}px solid ${INK}`,
                borderRadius: 6 * scale,
                backgroundColor: "rgba(255,255,255,0.9)",
              }}
            >
              SESSION
            </span>
            <span style={{ fontSize: 13 * scale, fontWeight: 800, color: "rgba(24,24,27,0.6)" }}>
              {dateText} {session.track ? `| ${session.track}` : ""}
            </span>
          </div>

          {/* セッションタイトル (左揃えで大きく整然と配置) */}
          <div
            style={{
              fontSize: titleSize,
              fontWeight: 900,
              color: INK,
              letterSpacing: "-0.02em",
              lineHeight: 1.15,
              marginBottom: 16 * scale,
            }}
          >
            {session.title}
          </div>

          {/* セッション概要 (説明文) */}
          {session.description && (
            <div
              style={{
                fontSize: descSize,
                fontWeight: 700,
                color: "rgba(24,24,27,0.75)",
                lineHeight: 1.4,
              }}
            >
              {truncate(session.description, 100)}
            </div>
          )}
        </div>
      </div>
    ),
    { ...dim, fonts }
  );
}

export const BANNER_SIZES = SIZES;
