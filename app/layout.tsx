import type { Metadata } from "next";
import "./globals.css";
import TopNav from "@/components/TopNav";

export const metadata: Metadata = {
  title: "SkillTrack",
  description: "AI-powered career and skill tracking platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#0B1F3A] text-white antialiased">
        <TopNav />
        {children}
      </body>
    </html>
  );
}
