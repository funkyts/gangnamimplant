import type { Metadata } from 'next';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { SITE, OPERATOR } from '@/lib/site-config';
import { getOrganizationSchema, getWebSiteSchema } from '@/lib/schema';

export const metadata: Metadata = {
    metadataBase: new URL(SITE.url),
    title: {
        default: `${SITE.name} - ${SITE.tagline}`,
        template: `%s | ${SITE.name}`,
    },
    description: SITE.description,
    authors: [{ name: `${SITE.name} 편집부`, url: `${SITE.url}/about/` }],
    creator: OPERATOR.legalName,
    publisher: OPERATOR.legalName,
    openGraph: {
        type: 'website',
        locale: 'ko_KR',
        url: SITE.url,
        siteName: SITE.name,
        title: `${SITE.name} - ${SITE.tagline}`,
        description: SITE.description,
        images: [
            {
                url: SITE.defaultOgImage,
                width: 1200,
                height: 630,
                alt: SITE.name,
            },
        ],
    },
    twitter: {
        card: 'summary_large_image',
        title: `${SITE.name} - ${SITE.tagline}`,
        description: SITE.description,
        images: [SITE.defaultOgImage],
    },
    alternates: {
        canonical: SITE.url,
        types: {
            'application/rss+xml': [{ url: '/rss/', title: `${SITE.name} RSS` }],
        },
    },
    verification: {
        google: 'nBo3qW5vLn5EkmEbwAetJAWiUxbbhZvTlSjLB2S5dKI',
        other: {
            'naver-site-verification': 'a0eabcc18cd1d23aa496539adc3774390d8bd357',
        },
    },
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            'max-image-preview': 'large',
            'max-snippet': -1,
            'max-video-preview': -1,
        },
    },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    const globalSchema = {
        '@context': 'https://schema.org',
        '@graph': [getOrganizationSchema(), getWebSiteSchema()],
    };

    return (
        <html lang="ko">
            <head>
                <link
                    rel="stylesheet"
                    as="style"
                    crossOrigin="anonymous"
                    href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css"
                />
                <link rel="me" href={OPERATOR.url} />
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(globalSchema) }}
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
