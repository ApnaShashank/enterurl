import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://enterurl.vercel.app';
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/adminpanel/', '/api/admin/'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
