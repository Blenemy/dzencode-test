import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'Inventory — приходы и продукты',
    short_name: 'Inventory',
    description: 'Учёт приходов и продуктов',
    lang: 'ru',
    start_url: '/orders',
    scope: '/',
    display: 'standalone',
    background_color: '#f0f3f5',
    theme_color: '#8bc34a',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      {
        src: '/icons/icon-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
    shortcuts: [
      { name: 'Приходы', url: '/orders' },
      { name: 'Продукты', url: '/products' },
    ],
  };
}
