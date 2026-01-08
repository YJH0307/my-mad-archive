import type { Metadata } from "next";
import "./globals.css"; // 기존에 있던 CSS import 유지

export const metadata: Metadata = {
  // 1. 요청하신 타이틀로 변경
  title: "KR 음MAD TAG", 
  // 2. 요청하신 설명으로 변경
  description: "대한민국 음MAD 영상 태그 저장소",
  // 3. 파비콘 설정 (public 폴더의 favicon.png 연결)
  icons: {
    icon: "/favicon.png",
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
        {/* 브라우저 호환성을 위해 link 태그 추가 */}
        <link rel="icon" href="/favicon.png" sizes="any" />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}