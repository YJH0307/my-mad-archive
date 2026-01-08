import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'KR 음MAD 태그',
  description: '음MAD 태그 아카이브 사이트',
  icons: {
    icon: '/favicon.ico', // 바뀐 파일명에 맞춰 설정했습니다.
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