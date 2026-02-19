import type { Metadata } from "next";
import { Noto_Sans_JP } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { Sidebar } from "@/components/sidebar";
import "./globals.css";

const notoSansJP = Noto_Sans_JP({
  subsets: ["latin"],
  variable: "--font-noto-sans-jp",
  weight: ["300", "400", "500", "700", "900"],
});

export const metadata: Metadata = {
  title: "SkillForge - AIと対話して自分だけのスキルツリーを育てる",
  description:
    "YouTube動画を集めるだけで、自分だけの学習地図と次の一歩が見える",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body className={`${notoSansJP.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <div className="flex min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
            <Sidebar />
            <main className="flex-1 overflow-y-auto scroll-smooth">
              {children}
            </main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
