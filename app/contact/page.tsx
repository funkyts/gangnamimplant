import type { Metadata } from 'next';
import { SITE, OPERATOR, BRANCHES } from '@/lib/site-config';

const CONTACT_URL = `${SITE.url}/contact/`;

export const metadata: Metadata = {
    title: '문의',
    description: `${SITE.name} 정정 요청·정보 문의 안내. 임플란트 상담은 ${OPERATOR.legalName}에서 받으실 수 있습니다.`,
    alternates: { canonical: CONTACT_URL },
    openGraph: {
        type: 'website',
        url: CONTACT_URL,
        title: `문의 | ${SITE.name}`,
        description: `정보 정정 요청·제휴 문의는 이메일로, 임플란트 상담은 ${OPERATOR.legalName}에서 받으실 수 있습니다.`,
    },
};

export default function ContactPage() {
    const contactSchema = {
        '@context': 'https://schema.org',
        '@type': 'ContactPage',
        '@id': `${CONTACT_URL}#contactpage`,
        url: CONTACT_URL,
        name: `문의 | ${SITE.name}`,
        description: '정보 정정 요청·제휴 문의 및 임플란트 상담 안내',
        publisher: { '@id': `${SITE.url}/#organization` },
    };

    return (
        <div className="bg-white">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(contactSchema) }}
            />

            <section className="bg-gray-50 py-16 sm:py-20 border-b border-gray-200">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
                    <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                        문의
                    </h1>
                    <p className="text-base sm:text-lg text-gray-700 leading-relaxed">
                        본 사이트의 정보 정정 요청·제휴 문의와
                        <br className="hidden sm:block" />
                        임플란트 상담 안내를 분리하여 드립니다.
                    </p>
                </div>
            </section>

            <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16 space-y-12">
                <section>
                    <h2 className="text-2xl font-bold text-gray-900 mb-3">
                        정보 관련 문의 (사이트 자체)
                    </h2>
                    <p className="text-gray-700 leading-relaxed mb-4">
                        잘못된 정보의 정정 요청, 콘텐츠 오류 신고, 제휴 제안 등 본 사이트와
                        관련된 문의는 이메일로 보내주세요. 평일 기준 1~2일 내로 회신드립니다.
                    </p>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-5">
                        <p className="text-sm text-gray-600 mb-1">이메일</p>
                        <a
                            href="mailto:contact@gangnamimplant.com"
                            className="text-primary-600 hover:text-primary-700 font-medium hover:underline"
                        >
                            contact@gangnamimplant.com
                        </a>
                    </div>
                    <p className="text-xs text-gray-500 mt-3">
                        ※ 본 사이트에서는 의료 상담을 진행하지 않습니다.
                    </p>
                </section>

                <section>
                    <h2 className="text-2xl font-bold text-gray-900 mb-3">
                        임플란트 상담 안내
                    </h2>
                    <p className="text-gray-700 leading-relaxed mb-4">
                        임플란트 시술 여부, 비용, 진료 일정 등 의학적 상담은 본 사이트 운영
                        주체인{' '}
                        <a
                            href={OPERATOR.url}
                            target="_blank"
                            rel="noopener"
                            className="text-primary-600 hover:underline font-medium"
                        >
                            {OPERATOR.legalName}
                        </a>
                        에서 받으실 수 있습니다.
                    </p>
                    <div className="bg-primary-50 border-l-4 border-primary-600 rounded-r-lg p-5 text-gray-800 leading-relaxed space-y-3">
                        <div>
                            <p className="font-semibold mb-1">{OPERATOR.legalName}</p>
                            <p className="text-sm">대표 전화: {OPERATOR.telephone}</p>
                        </div>
                        {BRANCHES.map((b) => (
                            <div key={b.slug} className="text-sm">
                                <p className="font-medium text-gray-900">{b.name}</p>
                                <p>
                                    {b.address.addressRegion} {b.address.addressLocality}{' '}
                                    {b.address.streetAddress}
                                </p>
                            </div>
                        ))}
                        <p className="text-sm">
                            상담 페이지:{' '}
                            <a
                                href={OPERATOR.url}
                                target="_blank"
                                rel="noopener"
                                className="text-primary-700 hover:underline"
                            >
                                {OPERATOR.url.replace('https://', '')}
                            </a>
                        </p>
                    </div>
                </section>

                <section className="text-xs text-gray-500 border-t border-gray-200 pt-6">
                    <p>
                        본 사이트는 라이브치과병원이 운영하는 임플란트 정보 채널이며, 의료기관이
                        아닙니다. 의학적 진단·치료는 의료기관에서만 가능합니다.
                    </p>
                </section>
            </div>
        </div>
    );
}
