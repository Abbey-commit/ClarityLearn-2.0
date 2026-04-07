// export const dynamic = 'force-dynamic';
export const dynamicParams = true;
export const revalidate = 0;
import './globals.css'
import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/next'

export const metadata: Metadata = {
  title: 'ClarityLearn 2.0',
  description: 'Gamified blockchain dictionary - Stake STX to learn crypto terms',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  )
}