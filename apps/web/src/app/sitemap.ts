import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://hotelflexi.novaxai.in';
  const lastModified = new Date();

  const routes: MetadataRoute.Sitemap = [
    // Core Marketing & Flagship Solutions
    { url: `${baseUrl}`, priority: 1.0, changeFrequency: 'daily', lastModified },
    { url: `${baseUrl}/features`, priority: 0.95, changeFrequency: 'weekly', lastModified },
    { url: `${baseUrl}/hotel-management`, priority: 0.9, changeFrequency: 'weekly', lastModified },
    { url: `${baseUrl}/channel-manager`, priority: 0.9, changeFrequency: 'weekly', lastModified },
    { url: `${baseUrl}/booking-engine`, priority: 0.9, changeFrequency: 'weekly', lastModified },
    { url: `${baseUrl}/dine-out`, priority: 0.9, changeFrequency: 'weekly', lastModified },
    { url: `${baseUrl}/ai-hotel-agent`, priority: 0.9, changeFrequency: 'weekly', lastModified },
    { url: `${baseUrl}/download-app`, priority: 0.9, changeFrequency: 'weekly', lastModified },
    { url: `${baseUrl}/pricing`, priority: 0.9, changeFrequency: 'weekly', lastModified },

    // Competitor Comparison SEO Hub & In-Depth Matchups
    { url: `${baseUrl}/compare`, priority: 0.85, changeFrequency: 'weekly', lastModified },
    { url: `${baseUrl}/compare/stayflexi`, priority: 0.85, changeFrequency: 'weekly', lastModified },
    { url: `${baseUrl}/compare/yojna-cloud`, priority: 0.85, changeFrequency: 'weekly', lastModified },
    { url: `${baseUrl}/compare/ezee-absolute`, priority: 0.85, changeFrequency: 'weekly', lastModified },
    { url: `${baseUrl}/compare/djubo`, priority: 0.85, changeFrequency: 'weekly', lastModified },

    // Knowledge Hub & Actionable Hotelier Guides
    { url: `${baseUrl}/blog`, priority: 0.85, changeFrequency: 'weekly', lastModified },
    { url: `${baseUrl}/blog/best-hotel-channel-manager-india`, priority: 0.8, changeFrequency: 'monthly', lastModified },
    { url: `${baseUrl}/blog/contactless-guest-portal-self-check-in-flexilink`, priority: 0.8, changeFrequency: 'monthly', lastModified },
    { url: `${baseUrl}/blog/hotel-dine-out-table-booking-restaurant-guide`, priority: 0.8, changeFrequency: 'monthly', lastModified },
    { url: `${baseUrl}/blog/hotel-pms-gst-billing-guide-india`, priority: 0.8, changeFrequency: 'monthly', lastModified },
    { url: `${baseUrl}/blog/how-to-automate-hotel-operations-with-ai`, priority: 0.8, changeFrequency: 'monthly', lastModified },
    { url: `${baseUrl}/blog/streamline-housekeeping-with-urgent-siren-alerts`, priority: 0.8, changeFrequency: 'monthly', lastModified },

    // Conversion & Company Information
    { url: `${baseUrl}/about`, priority: 0.75, changeFrequency: 'monthly', lastModified },
    { url: `${baseUrl}/contact`, priority: 0.8, changeFrequency: 'monthly', lastModified },
    { url: `${baseUrl}/faq`, priority: 0.8, changeFrequency: 'weekly', lastModified },
    { url: `${baseUrl}/signup`, priority: 0.8, changeFrequency: 'monthly', lastModified },
    { url: `${baseUrl}/login`, priority: 0.7, changeFrequency: 'monthly', lastModified },

    // Legal Policies & Compliance
    { url: `${baseUrl}/privacy`, priority: 0.5, changeFrequency: 'yearly', lastModified },
    { url: `${baseUrl}/terms`, priority: 0.5, changeFrequency: 'yearly', lastModified },
    { url: `${baseUrl}/refund-policy`, priority: 0.5, changeFrequency: 'yearly', lastModified },
  ];

  return routes;
}
