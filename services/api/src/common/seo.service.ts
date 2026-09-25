import { Injectable, Logger } from '@nestjs/common';
import { env } from './env';

/** İçerik yayınlanınca/değişince sitemap'i tazeler (Next revalidate) ve IndexNow ile arama motorlarını haberdar eder. */
@Injectable()
export class SeoService {
  private readonly log = new Logger('Seo');

  /** paths: /profile/ahmetyilmaz gibi göreli yollar */
  notify(paths: string[] = []): void {
    void this.revalidate().catch((e) => this.log.warn(`revalidate: ${e?.message}`));
    if (paths.length) void this.indexNow(paths).catch((e) => this.log.warn(`indexnow: ${e?.message}`));
  }

  private async revalidate() {
    if (!env.REVALIDATE_SECRET) return;
    await fetch('http://127.0.0.1:3300/revalidate-seo', {
      method: 'POST',
      headers: { 'x-revalidate-secret': env.REVALIDATE_SECRET },
      signal: AbortSignal.timeout(5000),
    });
  }

  private async indexNow(paths: string[]) {
    if (!env.INDEXNOW_KEY) return;
    const host = new URL(env.APP_URL).host;
    await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        host,
        key: env.INDEXNOW_KEY,
        keyLocation: `${env.APP_URL}/${env.INDEXNOW_KEY}.txt`,
        urlList: paths.map((p) => `${env.APP_URL}${p}`),
      }),
      signal: AbortSignal.timeout(8000),
    });
  }
}
