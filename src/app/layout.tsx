import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Finance App',
  description: 'Application de gestion financière multi-devises',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" className="dark">
      <body className="bg-[#050B05] text-white antialiased">
        {children}
      </body>
    </html>
  )
}
