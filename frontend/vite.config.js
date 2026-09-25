import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
    plugins: [
        react(),

        VitePWA({
            registerType: 'autoUpdate',

            devOptions: {
                enabled: true,
            },

            includeAssets: [
                'favicon.svg',
                'icons.svg',
                'icons/job.svg',
                'icons/job-192.png',
                'icons/job-512.png',
            ],

            manifest: {
                id: '/login',

                name: 'JOB - Plataforma de Serviços',
                short_name: 'JOB',
                description: 'Plataforma de intermediação de serviços',

                theme_color: '#863bff',
                background_color: '#ffffff',

                display: 'standalone',
                orientation: 'portrait',

                start_url: '/login',
                scope: '/',

                icons: [
                    {
                        src: '/icons/job-192.png',
                        sizes: '192x192',
                        type: 'image/png',
                    },
                    {
                        src: '/icons/job-512.png',
                        sizes: '512x512',
                        type: 'image/png',
                    },
                ],
            },

            workbox: {
                globPatterns: [
                    '**/*.{js,css,html,ico,png,svg,woff2}',
                ],
            },
        }),
    ],

    server: {
        host: '0.0.0.0',
        port: 5173,
    },
});