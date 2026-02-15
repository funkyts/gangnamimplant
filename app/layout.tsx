import type { Metadata } from 'next';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
    title: {
        default: '강남임플란트 - 임플란트 전문 정보',
        template: '%s | 강남임플란트',
    },
    description: '강남 지역 임플란트 전문 정보를 제공합니다. 가격, 시술 과정, 관리 방법 등 모든 정보를 확인하세요.',
    keywords: '강남 임플란트, 임플란트 가격, 치과, 강남 치과, 임플란트 시술',
    authors: [{ name: '강남임플란트치과' }],
    openGraph: {
        type: 'website',
        locale: 'ko_KR',
        url: process.env.NEXT_PUBLIC_SITE_URL || 'https://gangnamimplant.com',
        siteName: '강남임플란트',
        title: '강남임플란트 - 임플란트 전문 정보',
        description: '강남 지역 임플란트 전문 정보를 제공합니다.',
    },
    verification: {
        google: 'nBo3qW5vLn5EkmEbwAetJAWiUxbbhZvTlSjLB2S5dKI',
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
                <link
                    rel="stylesheet"
                    as="style"
                    crossOrigin="anonymous"
                    href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css"
                />
            </head>
            <body className="font-sans antialiased bg-gray-50">
                <Header />
                <main className="min-h-screen">{children}</main>
                <Footer />
            </body>
        </html>
    );
}
