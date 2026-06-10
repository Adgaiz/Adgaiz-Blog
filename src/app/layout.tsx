import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ReadingModeProvider } from "@/components/ReadingModeProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "现代个人博客",
  description: "一个基于 Next.js 构建的极简优雅的个人博客",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider>
          <ReadingModeProvider>
            {children}
          </ReadingModeProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
