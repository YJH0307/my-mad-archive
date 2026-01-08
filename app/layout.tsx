import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "KR 음MAD TAG",
  description: "대한민국 음MAD 영상 태그 저장소",
  icons: {
    icon: "/favicon.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body style={{ backgroundColor: '#0a0a0a', margin: 0, padding: 0 }}>
        {children}
      </body>
    </html>
  );
}