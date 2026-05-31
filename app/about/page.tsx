import type { Metadata } from 'next';
import Link from 'next/link';
import { SITE, OPERATOR, REVIEWER, SAME_AS, BRANCHES, OPENING_HOURS } from '@/lib/site-config';

const KOREAN_DAYS: Record<string, string> = {
    Monday: '월', Tuesday: '화', Wednesday: '수', Thursday: '목',
    Friday: '금', Saturday: '토', Sunday: '일',
};

const ABOUT_URL = `${SITE.url}/about/`;

export const metadata: Metadata = {
    title: '사이트 소개',
    description: `${SITE.name}는 ${OPERATOR.legalName}이 운영하는 임플란트 정보 사이트입니다. 운영 주체, 콘텐츠 감수, 편집 정책을 안내합니다.`,
    alternates: { canonical: ABOUT_URL },
    openGraph: {
        type: 'website',
        url: ABOUT_URL,
        title: `사이트 소개 | ${SITE.name}`,
        description: `${SITE.tagline}. 콘텐츠 감수: ${REVIEWER.name} ${REVIEWER.jobTitle} (${REVIEWER.organization}).`,
    },
};

export default function AboutPage() {
    const aboutSchema = {
        '@context': 'https://schema.org',
        '@type': 'AboutPage',
        '@id': `${ABOUT_URL}#aboutpage`,
        url: ABOUT_URL,
        name: `사이트 소개 | ${SITE.name}`,
        description: SITE.description,
        publisher: { '@id': `${SITE.url}/#organization` },
        mainEntity: { '@id': `${SITE.url}/#organization` },
    };

    return (
        <div className="bg-white">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(aboutSchema) }}
            />

            <section className="bg-gray-50 py-16 sm:py-20 border-b border-gray-200">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
                    <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4 leading-tight">
                        사이트 소개
                    </h1>
                    <p className="text-base sm:text-lg text-gray-700 leading-relaxed">
                        {SITE.name}는 {OPERATOR.legalName}이 운영하는 임플란트 정보 사이트입니다.
                        <br className="hidden sm:block" />
                        본 사이트는 의료기관이 아니며, 임플란트 가격·시술·관리·보험 등에 대한
                        일반적인 정보를 의료진 감수를 거쳐 제공합니다.
                    </p>
                </div>
            </section>

            <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16 space-y-12">
                <section>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">운영 주체</h2>
                    <div className="text-gray-700 leading-relaxed space-y-3">
                        <p>
                            본 사이트는{' '}
                            <a
                                href={OPERATOR.url}
                                target="_blank"
                                rel="noopener"
                                className="text-primary-600 hover:underline"
                            >
                                {OPERATOR.legalName}
                            </a>
                            이 운영합니다. {OPERATOR.legalName}은 서울 강남구에 위치한 치과
                            의료기관으로, 임플란트와 보존·보철 진료를 제공합니다.
                        </p>
                        <p>
                            진료 정보와 임상 콘텐츠는{' '}
                            <a
                                href={OPERATOR.url}
                                target="_blank"
                                rel="noopener"
                                className="text-primary-600 hover:underline"
                            >
                                라이브치과병원 공식 사이트
                            </a>
                            와{' '}
                            <a
                                href={OPERATOR.brandUrl}
                                target="_blank"
                                rel="noopener"
                                className="text-primary-600 hover:underline"
                            >
                                라이브치과병원 브랜드 사이트
                            </a>
                            에서 확인하실 수 있습니다.
                        </p>
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-5 text-sm space-y-2">
                            <p>
                                <span className="font-semibold">대표</span>: {OPERATOR.representative}
                            </p>
                            <p>
                                <span className="font-semibold">대표 전화</span>: {OPERATOR.telephone}
                            </p>
                            <p>
                                <span className="font-semibold">사업자등록번호</span>:{' '}
                                {OPERATOR.businessRegistration}
                            </p>
                            <p>
                                <span className="font-semibold">홈페이지</span>:{' '}
                                <a
                                    href={OPERATOR.url}
                                    target="_blank"
                                    rel="noopener"
                                    className="text-primary-600 hover:underline"
                                >
                                    {OPERATOR.url.replace('https://', '')}
                                </a>
                            </p>
                        </div>

                        <div className="grid sm:grid-cols-2 gap-4 mt-4">
                            {BRANCHES.map((b) => (
                                <div
                                    key={b.slug}
                                    className="bg-white border border-gray-200 rounded-lg p-4 text-sm"
                                >
                                    <p className="font-semibold text-gray-900 mb-1">{b.name}</p>
                                    <p className="text-gray-700">
                                        {b.address.addressRegion} {b.address.addressLocality}{' '}
                                        {b.address.streetAddress}
                                    </p>
                                    <p className="text-gray-600 mt-1">대표 전화: {b.telephone}</p>
                                </div>
                            ))}
                        </div>

                        <div className="bg-primary-50 border border-primary-100 rounded-lg p-4 text-sm mt-4">
                            <p className="font-semibold text-gray-900 mb-2">진료시간</p>
                            <ul className="space-y-1 text-gray-700">
                                {OPENING_HOURS.map((h, i) => (
                                    <li key={i}>
                                        <span className="font-medium">
                                            {h.days.map((d) => KOREAN_DAYS[d]).join('·')}
                                        </span>{' '}
                                        {h.opens} ~ {h.closes}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </section>

                <section>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">콘텐츠 감수</h2>
                    <div className="bg-primary-50 border-l-4 border-primary-600 rounded-r-lg p-5 text-gray-800 leading-relaxed">
                        <p className="font-semibold mb-2">
                            감수: {REVIEWER.name} {REVIEWER.jobTitle} ({REVIEWER.organization})
                        </p>
                        <p className="text-sm">
                            본 사이트의 모든 임플란트 관련 콘텐츠는 {REVIEWER.organization}의{' '}
                            {REVIEWER.name} {REVIEWER.jobTitle}이 의학적 정확성을 감수합니다.
                            자세한 진료 정보는{' '}
                            <a
                                href={REVIEWER.profileUrl}
                                target="_blank"
                                rel="noopener"
                                className="text-primary-700 hover:underline"
                            >
                                감수자 프로필
                            </a>
                            에서 확인하실 수 있습니다.
                        </p>
                    </div>
                </section>

                <section>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">편집 정책</h2>
                    <ul className="list-disc list-inside text-gray-700 leading-relaxed space-y-2 marker:text-primary-600">
                        <li>
                            모든 의학 정보는 보건복지부·대한치과의사협회·건강보험심사평가원 등
                            공식 출처를 근거로 작성합니다.
                        </li>
                        <li>
                            가격 정보는 단일 금액이 아닌 일반적 시세 범위로 표기하며, 실제 비용은
                            의료기관·환자 상태·재료에 따라 달라질 수 있음을 명시합니다.
                        </li>
                        <li>특정 의료기관을 비교·서열화하거나 추천하지 않습니다.</li>
                        <li>본 사이트는 환자 사례·시술 전후 사진을 사용하지 않습니다.</li>
                        <li>
                            정보 일러스트의 일부는 AI 생성 이미지를 사용하며, 해당 이미지에는
                            출처를 명시합니다.
                        </li>
                        <li>
                            오류 또는 정정 요청은 contact@gangnamimplant.com 으로 알려주시면
                            검토 후 반영합니다.
                        </li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">정보의 한계</h2>
                    <p className="text-gray-700 leading-relaxed">
                        본 사이트의 정보는 일반적인 참고용입니다. 개인의 의학적 진단·치료를
                        대신하지 않으며, 임플란트 시술 여부·방법·비용 등은 반드시 치과의사와의
                        상담을 통해 결정하시기 바랍니다. 의료 상담은 본 사이트에서 직접 진행하지
                        않습니다.
                    </p>
                </section>

                <section>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">관련 사이트</h2>
                    <ul className="space-y-2 text-gray-700">
                        {SAME_AS.filter((u) => u !== SITE.url).map((url) => (
                            <li key={url}>
                                <a
                                    href={url}
                                    target="_blank"
                                    rel="noopener"
                                    className="text-primary-600 hover:underline"
                                >
                                    {url.replace('https://', '')}
                                </a>
                            </li>
                        ))}
                    </ul>
                </section>

                <section className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-2">문의</h2>
                    <p className="text-gray-700 leading-relaxed mb-3">
                        정정 요청 또는 정보 관련 문의는 이메일로 보내주세요. 임플란트 상담은{' '}
                        <a
                            href={OPERATOR.url}
                            target="_blank"
                            rel="noopener"
                            className="text-primary-600 hover:underline"
                        >
                            {OPERATOR.legalName}
                        </a>
                        에서 받으실 수 있습니다.
                    </p>
                    <a
                        href="mailto:contact@gangnamimplant.com"
                        className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium hover:underline"
                    >
                        contact@gangnamimplant.com
                    </a>
                </section>

                <section className="text-center pt-4">
                    <Link
                        href="/"
                        className="inline-block text-primary-600 hover:underline font-medium"
                    >
                        ← 홈으로 돌아가기
                    </Link>
                </section>
            </div>
        </div>
    );
}
