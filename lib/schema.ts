/**
 * JSON-LD 생성 헬퍼
 *
 * _rules/05-SCHEMA_RULES.md 의 템플릿을 그대로 구현.
 * 모든 URL 은 절대 경로. sameAs 는 라이브치과 그룹 3도메인 묶기.
 */

import {
    SITE,
    OPERATOR,
    REVIEWER,
    SAME_AS,
    BRANCHES,
    OPENING_HOURS,
    getCategorySlug,
} from './site-config';
import type { Post } from './posts';

const ORG_ID = `${SITE.url}/#organization`;
const WEBSITE_ID = `${SITE.url}/#website`;

function absoluteUrl(maybeRelative: string): string {
    if (!maybeRelative) return SITE.url;
    if (maybeRelative.startsWith('http')) return maybeRelative;
    return `${SITE.url}${maybeRelative.startsWith('/') ? '' : '/'}${maybeRelative}`;
}

/**
 * 운영 주체 = 라이브치과병원 (Dentist 의료기관)
 * - 메인 주소는 강남점 (본 사이트의 컨텍스트)
 * - 부평점은 location 으로 추가
 * - 진료시간은 openingHoursSpecification 으로
 */
export function getOrganizationSchema() {
    return {
        '@context': 'https://schema.org',
        '@type': 'Dentist',
        '@id': ORG_ID,
        name: OPERATOR.legalName,
        alternateName: '강남임플란트 정보 운영사',
        url: OPERATOR.url,
        logo: {
            '@type': 'ImageObject',
            url: absoluteUrl(OPERATOR.logoUrl),
            width: 600,
            height: 60,
        },
        sameAs: SAME_AS,
        founder: {
            '@type': 'Person',
            name: OPERATOR.representative,
        },
        telephone: OPERATOR.telephone,
        ...(OPERATOR.businessRegistration && {
            taxID: OPERATOR.businessRegistration,
        }),
        address: {
            '@type': 'PostalAddress',
            streetAddress: OPERATOR.address.streetAddress,
            addressLocality: OPERATOR.address.addressLocality,
            addressRegion: OPERATOR.address.addressRegion,
            addressCountry: OPERATOR.address.addressCountry,
        },
        contactPoint: {
            '@type': 'ContactPoint',
            telephone: OPERATOR.telephone,
            contactType: 'customer service',
            areaServed: 'KR',
            availableLanguage: 'Korean',
        },
        openingHoursSpecification: OPENING_HOURS.map((h) => ({
            '@type': 'OpeningHoursSpecification',
            dayOfWeek: h.days,
            opens: h.opens,
            closes: h.closes,
        })),
        location: BRANCHES.map((b) => ({
            '@type': 'Dentist',
            name: b.name,
            telephone: b.telephone,
            address: {
                '@type': 'PostalAddress',
                streetAddress: b.address.streetAddress,
                addressLocality: b.address.addressLocality,
                addressRegion: b.address.addressRegion,
                addressCountry: b.address.addressCountry,
            },
        })),
    };
}

export function getWebSiteSchema() {
    return {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        '@id': WEBSITE_ID,
        url: SITE.url,
        name: SITE.name,
        description: SITE.tagline,
        publisher: { '@id': ORG_ID },
        inLanguage: SITE.locale,
    };
}

export function getBreadcrumbSchema(items: { name: string; url: string }[]) {
    return {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: items.map((item, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            name: item.name,
            item: item.url,
        })),
    };
}

export function getMedicalWebPageSchema(post: Post, slug: string) {
    const url = `${SITE.url}/blog/${slug}/`;
    const reviewer = post.reviewer || {
        name: REVIEWER.name,
        title: REVIEWER.jobTitle,
        organization: REVIEWER.organization,
        url: REVIEWER.profileUrl,
    };

    return {
        '@context': 'https://schema.org',
        '@type': 'MedicalWebPage',
        '@id': `${url}#webpage`,
        url,
        name: post.title,
        headline: post.title,
        description: post.description,
        inLanguage: SITE.locale,
        isPartOf: { '@id': WEBSITE_ID },
        publisher: { '@id': ORG_ID },
        author: {
            '@type': 'Organization',
            name: '강남임플란트 정보 편집부',
            url: `${SITE.url}/about/`,
        },
        reviewedBy: {
            '@type': 'Person',
            name: reviewer.name,
            jobTitle: reviewer.title,
            worksFor: {
                '@type': 'Dentist',
                name: reviewer.organization,
                url: REVIEWER.organizationUrl,
            },
            url: reviewer.url || REVIEWER.profileUrl,
        },
        ...(post.lastReviewed && { lastReviewed: post.lastReviewed }),
        ...(post.publishedAt && { datePublished: post.publishedAt }),
        ...(post.dateModified || post.publishedAt
            ? { dateModified: post.dateModified || post.publishedAt }
            : {}),
        image: {
            '@type': 'ImageObject',
            url: absoluteUrl(post.featuredImage),
            width: 1200,
            height: 900,
        },
        audience: {
            '@type': 'MedicalAudience',
            audienceType: 'Patient',
            geographicArea: {
                '@type': 'Country',
                name: 'South Korea',
            },
        },
        mainEntityOfPage: { '@id': `${url}#webpage` },
    };
}

export function getArticleSchema(post: Post, slug: string) {
    const url = `${SITE.url}/blog/${slug}/`;
    return {
        '@context': 'https://schema.org',
        '@type': 'Article',
        '@id': `${url}#article`,
        headline: post.title,
        description: post.description,
        image: [
            {
                '@type': 'ImageObject',
                url: absoluteUrl(post.featuredImage),
                width: 1200,
                height: 900,
            },
        ],
        ...(post.publishedAt && { datePublished: post.publishedAt }),
        ...(post.dateModified || post.publishedAt
            ? { dateModified: post.dateModified || post.publishedAt }
            : {}),
        author: {
            '@type': 'Organization',
            name: '강남임플란트 정보 편집부',
            url: `${SITE.url}/about/`,
        },
        publisher: { '@id': ORG_ID },
        mainEntityOfPage: { '@id': `${url}#webpage` },
        isPartOf: { '@id': `${url}#webpage` },
    };
}

export function getFAQPageSchema(faqs: { question: string; answer: string }[]) {
    return {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faqs.map((f) => ({
            '@type': 'Question',
            name: f.question,
            acceptedAnswer: {
                '@type': 'Answer',
                text: f.answer,
            },
        })),
    };
}

export function getPostBreadcrumb(post: Post, slug: string) {
    const categorySlug = getCategorySlug(post.category || 'dental-general');
    return getBreadcrumbSchema([
        { name: '홈', url: SITE.url },
        {
            name: post.category || '정보',
            url: `${SITE.url}/blog/category/${categorySlug}/`,
        },
        { name: post.title, url: `${SITE.url}/blog/${slug}/` },
    ]);
}

export function getPostJsonLdGraph(post: Post, slug: string) {
    const graph: Record<string, unknown>[] = [
        getMedicalWebPageSchema(post, slug),
        getArticleSchema(post, slug),
        getPostBreadcrumb(post, slug),
    ];

    if (post.faq && post.faq.length > 0) {
        graph.push(getFAQPageSchema(post.faq));
    }

    return {
        '@context': 'https://schema.org',
        '@graph': graph,
    };
}
