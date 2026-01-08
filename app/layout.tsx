import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "KR 음MAD TAG",
  description: "대한민국 음MAD 영상 태그 저장소",
  icons: {
    icon: "/favicon.png", // public 폴더의 파일을 가리킴
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body style={{ margin: 0, backgroundColor: '#0a0a0a' }}>
        {children}
      </body>
    </html>
  );
}