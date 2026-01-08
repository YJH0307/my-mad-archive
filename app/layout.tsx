import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'KR 음MAD 태그',
  description: '음MAD 태그 아카이브 사이트',
  // 파비콘 설정을 위해 아래 icons 항목만 추가했습니다.
  icons: {
    icon: '/favicon.ico',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  )
}