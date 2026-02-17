import type { Metadata } from "next";
import { Noto_Sans_JP } from "next/font/google";
import { Sidebar } from "@/components/sidebar";
import "./globals.css";

const notoSansJP = Noto_Sans_JP({
  subsets: ["latin"],
  variable: "--font-noto-sans-jp",
  weight: ["300", "400", "500", "700"],
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
    <html lang="ja">
      <body className={`${notoSansJP.variable} font-sans antialiased`}>
        <div className="flex min-h-screen bg-[#0c0e14] text-gray-200">
          <Sidebar />
          <main className="flex-1 overflow-y-auto">{children}</main>
        </div>
      </body>
    </html>
  );
}
