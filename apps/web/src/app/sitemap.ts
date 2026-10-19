import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://hotelflexi.novaxai.in';
  const lastModified = new Date();

  const routes = [
    { url: `${baseUrl}`, priority: 1.0, changeFrequency: 'weekly' as const },
    { url: `${baseUrl}/features`, priority: 0.9, changeFrequency: 'weekly' as const },
    { url: `${baseUrl}/hotel-management`, priority: 0.9, changeFrequency: 'weekly' as const },
    { url: `${baseUrl}/channel-manager`, priority: 0.9, changeFrequency: 'weekly' as const },
    { url: `${baseUrl}/booking-engine`, priority: 0.9, changeFrequency: 'weekly' as const },
    { url: `${baseUrl}/ai-hotel-agent`, priority: 0.9, changeFrequency: 'weekly' as const },
    { url: `${baseUrl}/pricing`, priority: 0.9, changeFrequency: 'weekly' as const },

    // Competitor Comparison SEO Hub & Subpages
    { url: `${baseUrl}/compare`, priority: 0.9, changeFrequency: 'weekly' as const },
    { url: `${baseUrl}/compare/stayflexi`, priority: 0.9, changeFrequency: 'weekly' as const },
    { url: `${baseUrl}/compare/yojna-cloud`, priority: 0.9, changeFrequency: 'weekly' as const },
    { url: `${baseUrl}/compare/ezee-absolute`, priority: 0.9, changeFrequency: 'weekly' as const },
    { url: `${baseUrl}/compare/djubo`, priority: 0.9, changeFrequency: 'weekly' as const },

    // Blog Knowledge Hub & High-Converting Articles
    { url: `${baseUrl}/blog`, priority: 0.9, changeFrequency: 'weekly' as const },
    { url: `${baseUrl}/blog/how-to-automate-hotel-operations-with-ai`, priority: 0.8, changeFrequency: 'monthly' as const },
    { url: `${baseUrl}/blog/best-hotel-channel-manager-india`, priority: 0.8, changeFrequency: 'monthly' as const },
    { url: `${baseUrl}/blog/streamline-housekeeping-with-urgent-siren-alerts`, priority: 0.8, changeFrequency: 'monthly' as const },
    { url: `${baseUrl}/blog/hotel-pms-gst-billing-guide-india`, priority: 0.8, changeFrequency: 'monthly' as const },

    // Company & Legal Pages
    { url: `${baseUrl}/about`, priority: 0.7, changeFrequency: 'monthly' as const },
    { url: `${baseUrl}/contact`, priority: 0.7, changeFrequency: 'monthly' as const },
    { url: `${baseUrl}/faq`, priority: 0.8, changeFrequency: 'weekly' as const },
    { url: `${baseUrl}/signup`, priority: 0.8, changeFrequency: 'monthly' as const },
    { url: `${baseUrl}/login`, priority: 0.7, changeFrequency: 'monthly' as const },
    { url: `${baseUrl}/privacy`, priority: 0.5, changeFrequency: 'yearly' as const },
    { url: `${baseUrl}/terms`, priority: 0.5, changeFrequency: 'yearly' as const },
    { url: `${baseUrl}/refund-policy`, priority: 0.5, changeFrequency: 'yearly' as const },
  ];

  return routes.map((r) => ({
    url: r.url,
    lastModified,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));
}
