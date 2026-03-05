export const dynamic = 'force-dynamic';
export const dynamicParams = true;
export const revalidate = 0;
import './globals.css'
import type { Metadata } from 'next'

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
      <body>{children}</body>
    </html>
  )
}