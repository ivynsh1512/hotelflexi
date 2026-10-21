import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/app/',
          '/admin/',
          '/central-command/',
          '/super-admin-portal',
          '/api/',
          '/guest/',
          '/offline',
          '/verify-email',
          '/forgot-password',
        ],
      },
      {
        userAgent: [
          'Googlebot',
          'Bingbot',
          'GPTBot',
          'ChatGPT-User',
          'ClaudeBot',
          'Claude-Web',
          'PerplexityBot',
          'Google-Extended',
          'Applebot',
          'Applebot-Extended',
          'cohere-ai',
          'Meta-ExternalAgent',
          'CCBot',
          'Diffbot',
          'Bytespider',
          'FacebookBot',
        ],
        allow: '/',
        disallow: [
          '/app/',
          '/admin/',
          '/central-command/',
          '/super-admin-portal',
          '/api/',
          '/guest/',
        ],
      },
    ],
    sitemap: 'https://hotelflexi.com/sitemap.xml',
    host: 'https://hotelflexi.com',
  };
}
