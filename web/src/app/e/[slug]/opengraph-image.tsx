import { ImageResponse } from "next/og";
import { getPublishedEventBySlug } from "@/lib/server/events";
import { loadNotoSansJpBlack } from "@/lib/og-font";
import { NOISE_PNG_DATA_URI } from "@/lib/noise";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "イベント告知画像";

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

const PAPER = "#f6f5f2";
const INK = "#18181b";

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <span
        style={{
          fontSize: 18,
          letterSpacing: "0.3em",
          textTransform: "uppercase",
          color: "rgba(24,24,27,0.55)",
        }}
      >
        {label}
      </span>
      <span style={{ marginTop: 8, fontSize: 30, color: INK }}>{value}</span>
    </div>
  );
}

export default async function OgImage(props: { params: Promise<{ slug: string }> }) {
  const { slug } = await props.params;
  const event = await getPublishedEventBySlug(slug);

  const title = event?.title ?? "GAO HUB";
  const color = event?.themeColor ?? "#6d28d9";
  const dateText = event ? dayFmt.format(event.startsAt) : "";
  const doorsText = event ? `${timeFmt.format(event.startsAt)} – ${timeFmt.format(event.endsAt)}` : "";
  const venueText = event?.venueName || "Online";

  const fontText = `${title}${dateText}${doorsText}${venueText}DATEVENUEDOORSPOWERED BY GAO HUB0123456789:– `;
  const fontData = await loadNotoSansJpBlack(fontText);

  // タイトル長でフォントサイズを段階調整
  const titleSize = title.length <= 12 ? 110 : title.length <= 22 ? 84 : 62;

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
          backgroundImage: `linear-gradient(150deg, ${PAPER} 0%, ${PAPER} 32%, ${color} 92%)`,
          fontFamily: "NotoSansJP",
        }}
      >
        {/* カバー画像(あれば): 紙色グラデーションを重ねて可読性を確保 */}
        {event?.coverImageUrl && (
          <img
            src={event.coverImageUrl}
            alt=""
            width={1200}
            height={630}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        )}
        {event?.coverImageUrl && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage: `linear-gradient(150deg, rgba(246,245,242,0.96) 0%, rgba(246,245,242,0.82) 45%, rgba(246,245,242,0.25) 100%)`,
            }}
          />
        )}

        {/* フィルムグレイン */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `url(${NOISE_PNG_DATA_URI})`,
            backgroundRepeat: "repeat",
            backgroundSize: "96px 96px",
            opacity: 0.55,
          }}
        />

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            padding: "56px 72px",
          }}
        >
          {/* スペック行 */}
          <div style={{ display: "flex", gap: 72 }}>
            <Spec label="Date" value={dateText} />
            <Spec label="Doors" value={doorsText} />
            <Spec label="Venue" value={venueText} />
          </div>

          {/* タイトル */}
          <div style={{ display: "flex", flex: 1, alignItems: "center" }}>
            <div
              style={{
                fontSize: titleSize,
                lineHeight: 1.02,
                letterSpacing: "-0.03em",
                color: INK,
                maxWidth: 1056,
                textWrap: "balance" as never,
              }}
            >
              {title}
            </div>
          </div>

          {/* フッター */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderTop: `4px solid ${INK}`,
              paddingTop: 24,
            }}
          >
            <span
              style={{
                fontSize: 20,
                letterSpacing: "0.35em",
                textTransform: "uppercase",
                color: "rgba(24,24,27,0.6)",
              }}
            >
              Powered by
            </span>
            <span
              style={{
                fontSize: 34,
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
      ...size,
      fonts: fontData
        ? [{ name: "NotoSansJP", data: fontData, weight: 900 as const, style: "normal" as const }]
        : undefined,
    }
  );
}
