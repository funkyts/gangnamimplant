import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
    title: '강남 임플란트 전문 정보 - 가격부터 관리까지 | 강남임플란트',
    description: '2026년 강남 임플란트 가격, 시술 과정, 브랜드 비교(오스템, 덴티움, 스트라우만) 등 정확한 정보를 전문가가 제공합니다. 과잉 진료 없는 투명한 정보, 환자 중심 가이드.',
    keywords: '강남 임플란트, 임플란트 가격 2026, 오스템 임플란트, 덴티움, 스트라우만, 임플란트 비용, 강남 치과',
};

export default function AboutPage() {
    return (
        <div className="bg-gradient-to-b from-gray-50 to-white">
            {/* Hero Section */}
            <section className="bg-primary-600 text-white py-16 sm:py-20">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h1 className="text-4xl sm:text-5xl font-bold mb-6">
                        환자를 위한 정직한 임플란트 정보
                    </h1>
                    <p className="text-xl sm:text-2xl text-primary-100 leading-relaxed">
                        과잉 진료 없는 투명한 정보로<br className="sm:hidden" />
                        올바른 선택을 돕겠습니다
                    </p>
                </div>
            </section>

            {/* Main Content */}
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">

                {/* Mission Section */}
                <section className="mb-16 sm:mb-20">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                            우리의 미션
                        </h2>
                        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                            임플란트는 인생을 바꾸는 중요한 결정입니다.<br />
                            정확한 정보로 환자분들의 현명한 선택을 돕겠습니다.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6 sm:gap-8">
                        {/* 투명성 */}
                        <div className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-shadow p-6 sm:p-8 border border-gray-100">
                            <div className="w-14 h-14 bg-primary-100 rounded-xl flex items-center justify-center mb-4">
                                <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">투명한 가격 정보</h3>
                            <p className="text-gray-600 leading-relaxed">
                                2026년 최신 기준 강남 지역 임플란트 가격을 병원별, 브랜드별로 투명하게 비교합니다. 숨겨진 비용 없이 정확한 정보만 제공합니다.
                            </p>
                        </div>

                        {/* 전문성 */}
                        <div className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-shadow p-6 sm:p-8 border border-gray-100">
                            <div className="w-14 h-14 bg-primary-100 rounded-xl flex items-center justify-center mb-4">
                                <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">전문가 검증 정보</h3>
                            <p className="text-gray-600 leading-relaxed">
                                임플란트 시술 과정, 브랜드 비교(오스템, 덴티움, 스트라우만), 관리 방법 등 모든 정보는 치과 전문가의 검수를 거쳤습니다.
                            </p>
                        </div>

                        {/* 환자 중심 */}
                        <div className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-shadow p-6 sm:p-8 border border-gray-100">
                            <div className="w-14 h-14 bg-primary-100 rounded-xl flex items-center justify-center mb-4">
                                <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">환자 중심 관점</h3>
                            <p className="text-gray-600 leading-relaxed">
                                과잉 진료나 광고성 정보가 아닌, 오직 환자분들의 올바른 선택을 위한 정보만 제공합니다. 궁금증 해소가 목표입니다.
                            </p>
                        </div>
                    </div>
                </section>

                {/* 제공 정보 Section */}
                <section className="mb-16 sm:mb-20 bg-white rounded-2xl shadow-lg p-8 sm:p-12 border border-gray-100">
                    <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
                        제공하는 정보
                    </h2>

                    <div className="grid sm:grid-cols-2 gap-6">
                        <div className="flex gap-4">
                            <div className="flex-shrink-0">
                                <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                                    <span className="text-primary-600 font-bold">💰</span>
                                </div>
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900 mb-2">임플란트 가격 비교</h3>
                                <p className="text-gray-600 text-sm leading-relaxed">
                                    2026년 최신 강남 지역 임플란트 가격을 국산(오스템, 덴티움)과 수입(스트라우만, 아스트라) 브랜드별로 상세 비교합니다.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="flex-shrink-0">
                                <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                                    <span className="text-primary-600 font-bold">🏥</span>
                                </div>
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900 mb-2">시술 과정 가이드</h3>
                                <p className="text-gray-600 text-sm leading-relaxed">
                                    1차 수술부터 2차 수술, 뼈이식, 상악동거상술까지 전체 시술 과정을 단계별로 설명합니다.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="flex-shrink-0">
                                <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                                    <span className="text-primary-600 font-bold">⚕️</span>
                                </div>
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900 mb-2">관리 방법 & 주의사항</h3>
                                <p className="text-gray-600 text-sm leading-relaxed">
                                    임플란트 수명 연장을 위한 올바른 관리법, 식습관, 칫솔질 방법, 정기 검진 주기까지 상세 안내합니다.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="flex-shrink-0">
                                <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                                    <span className="text-primary-600 font-bold">📊</span>
                                </div>
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900 mb-2">브랜드 심층 비교</h3>
                                <p className="text-gray-600 text-sm leading-relaxed">
                                    오스템, 덴티움, 스트라우만, 아스트라 등 주요 브랜드의 특징, 장단점, 적합한 케이스를 객관적으로 비교합니다.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="flex-shrink-0">
                                <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                                    <span className="text-primary-600 font-bold">💳</span>
                                </div>
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900 mb-2">보험 적용 정보</h3>
                                <p className="text-gray-600 text-sm leading-relaxed">
                                    만 65세 이상 임플란트 건강보험 적용 기준, 신청 방법, 본인 부담금까지 상세히 안내합니다.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="flex-shrink-0">
                                <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                                    <span className="text-primary-600 font-bold">📍</span>
                                </div>
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900 mb-2">강남 지역 특화 정보</h3>
                                <p className="text-gray-600 text-sm leading-relaxed">
                                    강남, 서초, 역삼, 논현 등 강남 권역 임플란트 시장 동향과 지역별 특징을 분석합니다.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 신뢰성 보장 Section */}
                <section className="mb-16 sm:mb-20">
                    <div className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-2xl p-8 sm:p-12 border border-primary-200">
                        <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">
                            정보의 신뢰성을 보장합니다
                        </h2>

                        <div className="space-y-4 max-w-3xl mx-auto">
                            <div className="flex items-start gap-4 bg-white rounded-xl p-5 shadow-sm">
                                <div className="flex-shrink-0 w-6 h-6 bg-primary-600 rounded-full flex items-center justify-center">
                                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 mb-1">최신 정보 유지 (2026년 기준)</h3>
                                    <p className="text-gray-700 text-sm">모든 가격과 시술 정보는 2026년 현재 기준으로 정기 업데이트됩니다.</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4 bg-white rounded-xl p-5 shadow-sm">
                                <div className="flex-shrink-0 w-6 h-6 bg-primary-600 rounded-full flex items-center justify-center">
                                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 mb-1">객관적 정보 제공</h3>
                                    <p className="text-gray-700 text-sm">특정 병원이나 브랜드와 제휴 없이 순수하게 환자 관점에서 정보를 제공합니다.</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4 bg-white rounded-xl p-5 shadow-sm">
                                <div className="flex-shrink-0 w-6 h-6 bg-primary-600 rounded-full flex items-center justify-center">
                                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 mb-1">전문가 감수</h3>
                                    <p className="text-gray-700 text-sm">임상 경험이 풍부한 치과 전문의의 검수를 거친 정확한 의료 정보입니다.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section className="text-center bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-10 sm:p-12 text-white shadow-xl">
                    <h2 className="text-3xl font-bold mb-4">
                        임플란트 정보가 궁금하신가요?
                    </h2>
                    <p className="text-xl text-primary-100 mb-8">
                        지금 바로 가장 인기 있는 글을 확인해보세요
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link
                            href="/"
                            className="inline-block bg-white text-primary-600 px-8 py-4 rounded-xl font-bold text-lg hover:bg-primary-50 transition-colors shadow-lg hover:shadow-xl"
                        >
                            블로그 홈으로 →
                        </Link>
                        <Link
                            href="/#blog"
                            className="inline-block bg-primary-500 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-primary-400 transition-colors border-2 border-white shadow-lg hover:shadow-xl"
                        >
                            인기 글 보기
                        </Link>
                    </div>
                </section>

                {/* Contact Section */}
                <section className="mt-16 text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">
                        궁금한 점이 있으신가요?
                    </h2>
                    <p className="text-gray-600 mb-4">
                        임플란트 관련 궁금하신 사항이 있으시면 언제든 문의해주세요.
                    </p>
                    <a
                        href="mailto:contact@gangnamimplant.com"
                        className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-semibold text-lg hover:underline"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        contact@gangnamimplant.com
                    </a>
                </section>
            </div>
        </div>
    );
}
