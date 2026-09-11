const WEB_URL = (import.meta.env.VITE_WEB_URL || 'https://web-car-washing.vercel.app').replace(/\/+$/, '');

export const customerUrl = (slug: string) => `${WEB_URL}/w/${encodeURIComponent(slug)}`;
