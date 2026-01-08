// app/layout.tsx

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'KR MAD TAGS',
  description: '한국 음MAD 태그 사이트',
  // ✅ 브라우저 탭 아이콘 설정
  icons: {
    icon: '/favicon.png', // public 폴더에 넣은 파일명과 일치해야 합니다.
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  )
}