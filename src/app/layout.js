import './globals.css'

export const metadata = {
  title: 'Mock Test Generator',
  description: 'Interactive math test generator with AI-powered questions',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
