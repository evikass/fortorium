import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  
  // Генерация уникального Build ID для каждого деплоя
  // Это гарантирует, что chunk-файлы будут иметь разные имена
  generateBuildId: async () => {
    return `fortorium-${Date.now()}-${process.env.npm_package_version || '3.2.0'}`
  },
  
  // Настройка заголовков для контроля кэширования
  async headers() {
    return [
      {
        // HTML страницы - всегда проверять актуальность
        source: '/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
        ],
      },
      {
        // Статические ресурсы с хэшем - можно кэшировать
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // API роуты - не кэшировать
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate',
          },
        ],
      },
    ]
  },
  
  // Настройки для оптимизации сборки
  experimental: {
    // Улучшенная генерация chunk-файлов
    optimizePackageImports: ['lucide-react', 'recharts', 'framer-motion'],
  },
}

export default nextConfig
