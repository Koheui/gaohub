import type { BoxSize, RegionType, CartItem } from "./types";

export const REGION_NAMES: Record<RegionType, string> = {
  hokkaido: "北海道",
  tohoku: "東北",
  kanto: "関東",
  chubu: "中部・東海",
  hokuriku: "北陸",
  kansai: "関西",
  chugoku: "中国",
  shikoku: "四国",
  kyushu: "九州",
  okinawa: "沖縄",
};

export const ALL_BOX_SIZES: BoxSize[] = ["60", "80", "100", "120", "140", "160"];

// 地方別 ✕ サイズ別 デフォルト送料マトリックス表 (ヤマト運輸/佐川急便準拠)
export type ShippingMatrixRates = Record<RegionType, Record<BoxSize, number>>;

export const DEFAULT_SHIPPING_MATRIX: ShippingMatrixRates = {
  hokkaido: { "60": 1300, "80": 1600, "100": 1900, "120": 2200, "140": 2500, "160": 2900 },
  tohoku:   { "60": 900,  "80": 1150, "100": 1400, "120": 1700, "140": 2000, "160": 2400 },
  kanto:    { "60": 700,  "80": 900,  "100": 1150, "120": 1400, "140": 1700, "160": 2100 },
  chubu:    { "60": 700,  "80": 900,  "100": 1150, "120": 1400, "140": 1700, "160": 2100 },
  hokuriku: { "60": 700,  "80": 900,  "100": 1150, "120": 1400, "140": 1700, "160": 2100 },
  kansai:   { "60": 700,  "80": 900,  "100": 1150, "120": 1400, "140": 1700, "160": 2100 },
  chugoku:  { "60": 800,  "80": 1000, "100": 1250, "120": 1500, "140": 1800, "160": 2200 },
  shikoku:  { "60": 800,  "80": 1000, "100": 1250, "120": 1500, "140": 1800, "160": 2200 },
  kyushu:   { "60": 900,  "80": 1150, "100": 1400, "120": 1700, "140": 2000, "160": 2400 },
  okinawa:  { "60": 1400, "80": 1900, "100": 2400, "120": 3000, "140": 3600, "160": 4200 },
};

/**
 * 都道府県から地方区分 (RegionType) を自動判定
 */
export function getRegionFromPrefecture(prefecture: string): RegionType {
  const pref = prefecture.trim();
  if (pref.includes("北海道")) return "hokkaido";

  if (
    pref.includes("青森") ||
    pref.includes("岩手") ||
    pref.includes("宮城") ||
    pref.includes("秋田") ||
    pref.includes("山形") ||
    pref.includes("福島")
  ) {
    return "tohoku";
  }

  if (
    pref.includes("茨城") ||
    pref.includes("栃木") ||
    pref.includes("群馬") ||
    pref.includes("埼玉") ||
    pref.includes("千葉") ||
    pref.includes("東京") ||
    pref.includes("神奈川") ||
    pref.includes("山梨")
  ) {
    return "kanto";
  }

  if (pref.includes("富山") || pref.includes("石川") || pref.includes("福井")) {
    return "hokuriku";
  }

  if (
    pref.includes("長野") ||
    pref.includes("岐阜") ||
    pref.includes("静岡") ||
    pref.includes("愛知") ||
    pref.includes("三重") ||
    pref.includes("新潟")
  ) {
    return "chubu";
  }

  if (
    pref.includes("滋賀") ||
    pref.includes("京都") ||
    pref.includes("大阪") ||
    pref.includes("兵庫") ||
    pref.includes("奈良") ||
    pref.includes("和歌山")
  ) {
    return "kansai";
  }

  if (
    pref.includes("鳥取") ||
    pref.includes("島根") ||
    pref.includes("岡山") ||
    pref.includes("広島") ||
    pref.includes("山口")
  ) {
    return "chugoku";
  }

  if (
    pref.includes("徳島") ||
    pref.includes("香川") ||
    pref.includes("愛媛") ||
    pref.includes("高知")
  ) {
    return "shikoku";
  }

  if (
    pref.includes("福岡") ||
    pref.includes("佐賀") ||
    pref.includes("長崎") ||
    pref.includes("熊本") ||
    pref.includes("大分") ||
    pref.includes("宮崎") ||
    pref.includes("鹿児島")
  ) {
    return "kyushu";
  }

  if (pref.includes("沖縄")) return "okinawa";

  // デフォルトは関東/標準
  return "kanto";
}

/**
 * カート内商品の最大梱包サイズを選出
 */
export function getMaxBoxSizeFromCart(cartItems: CartItem[]): BoxSize {
  if (cartItems.length === 0) return "60";

  let maxNum = 60;
  cartItems.forEach((item) => {
    const sizeStr = item.product.boxSize || "60";
    const num = Number(sizeStr) || 60;
    if (num > maxNum) {
      maxNum = num;
    }
  });

  return String(maxNum) as BoxSize;
}

/**
 * お届け先都道府県とカート内商品群から、同梱配送料金を自動算出
 */
export function calculateSmartShippingFee(
  cartItems: CartItem[],
  prefecture: string,
  matrixRates: ShippingMatrixRates = DEFAULT_SHIPPING_MATRIX,
  freeShippingThreshold: number = 5000,
  isFreeShippingEnabled: boolean = true
): {
  shippingFee: number;
  regionName: string;
  maxBoxSize: BoxSize;
  isFreeShippingApplied: boolean;
} {
  const subtotal = cartItems.reduce(
    (acc, item) => acc + item.product.priceJpy * item.quantity,
    0
  );

  if (subtotal === 0 || cartItems.length === 0) {
    return {
      shippingFee: 0,
      regionName: "一律",
      maxBoxSize: "60",
      isFreeShippingApplied: false,
    };
  }

  // 送料無料ライン適用判定
  if (isFreeShippingEnabled && subtotal >= freeShippingThreshold) {
    const region = getRegionFromPrefecture(prefecture);
    const maxBoxSize = getMaxBoxSizeFromCart(cartItems);
    return {
      shippingFee: 0,
      regionName: REGION_NAMES[region],
      maxBoxSize,
      isFreeShippingApplied: true,
    };
  }

  // 地域と最大サイズを判定
  const region = getRegionFromPrefecture(prefecture);
  const maxBoxSize = getMaxBoxSizeFromCart(cartItems);
  const regionRates = matrixRates[region] || DEFAULT_SHIPPING_MATRIX[region];
  const shippingFee = regionRates[maxBoxSize] || 700;

  return {
    shippingFee,
    regionName: REGION_NAMES[region],
    maxBoxSize,
    isFreeShippingApplied: false,
  };
}
