import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Providers from './providers'
import '@/styles/globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'CloudArc — Premium Cloud Storage',
  description: 'CloudArc is a premium cloud storage app with advanced file management, sharing, and collaboration.',
  keywords: 'cloud storage, file sharing, file management, CloudArc',
  authors: [{ name: 'CloudArc Team' }],
  creator: 'CloudArc',
  publisher: 'CloudArc',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  openGraph: {
    title: 'CloudArc — Premium Cloud Storage',
    description: 'CloudArc is a premium cloud storage app with advanced file management, sharing, and collaboration.',
    url: '/',
    siteName: 'CloudArc',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'CloudArc',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CloudArc — Premium Cloud Storage',
    description: 'CloudArc is a premium cloud storage app with advanced file management, sharing, and collaboration.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${inter.className} antialiased`}>
        <Providers>
          <div className="min-h-screen bg-background text-foreground">
            {children}
          </div>
        </Providers>
      </body>
    </html>
  )
}
