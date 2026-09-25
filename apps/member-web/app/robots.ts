import type { MetadataRoute } from 'next';
import { absoluteUrl } from '@mettlo/web-core';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Panel, hesap, ödeme ve API yolları + üye/yönetim profilleri indekslenmez
        disallow: ['/api/', '/app/', '/creator/', '/admin/', '/login', '/register', '/checkout/', '/cart', '/account/', '/*?q=', '/*?page='],
      },
      // Yapay zekâ eğitim tarayıcıları (kullanıcı verisi/gizlilik) kapalı
      { userAgent: ['GPTBot', 'CCBot', 'Google-Extended', 'anthropic-ai', 'ClaudeBot'], disallow: '/' },
    ],
    sitemap: absoluteUrl('/sitemap.xml'),
    host: absoluteUrl('/'),
  };
}
