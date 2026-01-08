import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "KR 음MAD TAG",
  description: "대한민국 음MAD 영상 태그 저장소",
  // 브라우저 탭에 로고(favicon.png)를 띄우는 설정
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <head>
        {/* 브라우저 호환성을 위한 추가 태그 */}
        <link rel="icon" href="/favicon.png" />
      </head>
      <body style={{ 
        margin: 0, 
        padding: 0, 
        backgroundColor: '#0a0a0a',
        overflowX: 'hidden' // 가로 스크롤 방지
      }}>
        {children}
      </body>
    </html>
  );
}