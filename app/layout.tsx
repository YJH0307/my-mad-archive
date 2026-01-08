export const metadata = {
  title: 'KR 음MAD 아카이브',
  description: '음MAD 태그 아카이브 사이트',
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