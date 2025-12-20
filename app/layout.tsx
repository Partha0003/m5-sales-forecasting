import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Retail Sales Analytics & Forecasting',
  description: 'Professional retail sales analytics and demand forecasting dashboard',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  )
}

