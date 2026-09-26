/** Para hesapları kuruş (integer) üzerinden yapılır: yuvarlama hatası olmasın. */
export const toKurus = (tl: number) => Math.round(tl * 100);
export const fromKurus = (k: number) => k / 100;

/** İçerik erişimi aboneliği ve 1:1 koçluk için platform komisyonu: %10 */
export const PLATFORM_COMMISSION_PCT = 10;
/** Oturum seansları için platform komisyonu: %0 (koçun geliri) */
export const SESSION_COMMISSION_PCT = 0;
/** Canlı ders kredisi geliri altyapı (canlı yayın) maliyetidir: koça PAY VERİLMEZ, %100 Mettlo. Kredi herhangi bir koçta kullanılabilir. */
export const LIVE_CREDIT_CREATOR_SHARE = 0;

export interface Split {
  netKurus: number;
  platformKurus: number;
  creatorKurus: number;
}

/** Abonelik ve 1:1 koçluk satışı: mağaza kesintisi düşülür, kalan net üzerinden %90 koç / %10 Mettlo. */
export function splitSale(grossKurus: number, storeFeeKurus = 0): Split {
  const netKurus = grossKurus - storeFeeKurus;
  const platformKurus = Math.round((netKurus * PLATFORM_COMMISSION_PCT) / 100);
  return { netKurus, platformKurus, creatorKurus: netKurus - platformKurus };
}

/** Oturum seansı satışı: komisyon yok, net tutarın tamamı koça aittir. */
export function splitSession(grossKurus: number, storeFeeKurus = 0): Split {
  const netKurus = grossKurus - storeFeeKurus;
  return { netKurus, platformKurus: 0, creatorKurus: netKurus };
}

/** Canlı kredi geliri: %100 Mettlo (altyapı); koça ödeme yapılmaz. */
export function splitLiveCredit(grossKurus: number, storeFeeKurus = 0): Split {
  const netKurus = grossKurus - storeFeeKurus;
  const creatorKurus = Math.round(netKurus * LIVE_CREDIT_CREATOR_SHARE);
  return { netKurus, platformKurus: netKurus - creatorKurus, creatorKurus };
}

/** Premium Live: taban üyelik kısmı %20 komisyon, ek kısım (add-on, canlı altyapı) %100 Mettlo. */
export function splitPremiumLive(baseKurus: number, addOnKurus: number, storeFeeKurus = 0): Split {
  const total = baseKurus + addOnKurus;
  const feeBase = total === 0 ? 0 : Math.round((storeFeeKurus * baseKurus) / total);
  const base = splitSale(baseKurus, feeBase);
  const addon = splitLiveCredit(addOnKurus, storeFeeKurus - feeBase);
  return {
    netKurus: base.netKurus + addon.netKurus,
    platformKurus: base.platformKurus + addon.platformKurus,
    creatorKurus: base.creatorKurus + addon.creatorKurus,
  };
}
