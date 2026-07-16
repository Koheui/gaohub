import "server-only";
import { ImageResponse } from "next/og";
import { loadNotoSansJpBlack } from "@/lib/og-font";
import { NOISE_PNG_DATA_URI } from "@/lib/noise";
import { spectrumStopsRgba } from "@/lib/color";
import type { PublicEvent, PublicSpeaker } from "@/lib/server/events";

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

/** 登壇者の顔写真を円形に並べる列。photoUrl が無い場合はイニシャル円で埋める */
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

  const color = event.themeColor;
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

  let background: string;
  if (event.template === "spectrum") {
    const [c1, c2, c3, c4] = spectrumStopsRgba(color, 0.8);
    background = `
      radial-gradient(ellipse 60% 40% at 85% 10%, ${c1}, transparent 62%),
      radial-gradient(ellipse 55% 38% at 55% 40%, ${c2}, transparent 62%),
      radial-gradient(ellipse 55% 38% at 25% 70%, ${c3}, transparent 62%),
      radial-gradient(ellipse 60% 40% at 0% 100%, ${c4}, transparent 66%),
      #a1a19c
    `;
  } else if (event.template === "aurora") {
    background = `
      radial-gradient(ellipse 45% 35% at 10% 8%, ${color}88, transparent 60%),
      radial-gradient(ellipse 40% 32% at 90% 25%, ${color}55, transparent 60%),
      radial-gradient(ellipse 42% 34% at 40% 95%, ${color}44, transparent 62%),
      #f7f8fd
    `;
  } else {
    background = `linear-gradient(150deg, ${PAPER} 0%, ${PAPER} 30%, ${color} 92%)`;
  }

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
          backgroundImage: background,
          fontFamily: "NotoSansJP",
        }}
      >
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

        {/* フィルムグレイン */}
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

          {/* フッター */}
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
                letterSpacing: "0.35em",
                textTransform: "uppercase",
                color: "rgba(24,24,27,0.6)",
              }}
            >
              Powered by
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
