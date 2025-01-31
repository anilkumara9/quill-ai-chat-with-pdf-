import { Inter } from "next/font/google"
import { ClerkProvider } from "@clerk/nextjs"
import { ThemeProvider } from "@/components/theme-provider"
import { Header } from "@/components/header"
import { Toaster } from "@/components/ui/toaster"
import "./globals.css"

const inter = Inter({ 
  subsets: ["latin"],
  display: 'swap',
  variable: '--font-inter',
})

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
}

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  title: "Quill - AI-Powered Document Analysis",
  description: "Advanced document analysis and interaction platform powered by AI. Upload, analyze, and chat with your documents using state-of-the-art AI technology.",
  keywords: ["AI", "document analysis", "chat", "machine learning", "text analysis"],
  authors: [{ name: "Quill Team" }],
  openGraph: {
    title: "Quill - AI-Powered Document Analysis",
    description: "Advanced document analysis and interaction platform powered by AI",
    type: "website",
    locale: "en_US",
    siteName: "Quill",
  },
  twitter: {
    card: "summary_large_image",
    title: "Quill - AI-Powered Document Analysis",
    description: "Advanced document analysis and interaction platform powered by AI",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <ClerkProvider
          appearance={{
            elements: {
              formButtonPrimary: 'bg-primary hover:bg-primary/90',
              footerActionLink: 'text-primary hover:text-primary/90',
            }
          }}
          fallbackRedirectUrl="/documents"
        >
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
            storageKey="quill-theme"
          >
            <div className="relative flex min-h-screen flex-col">
              <Header />
              <main className="flex-1">
                {children}
              </main>
            </div>
            <Toaster />
          </ThemeProvider>
        </ClerkProvider>
      </body>
    </html>
  )
}
