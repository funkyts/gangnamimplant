import Link from 'next/link';
import { SITE, REVIEWER, SITE_FOOTER_DISCLAIMER } from '@/lib/site-config';

export default function Footer() {
    return (
        <footer className="bg-gray-50 border-t border-gray-200 mt-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">
                            {SITE.name}
                        </h3>
                        <p className="text-gray-600 text-sm leading-relaxed mb-3">
                            {SITE.tagline}.
                        </p>
                        <p className="text-gray-500 text-xs leading-relaxed">
                            {SITE_FOOTER_DISCLAIMER}
                        </p>
                    </div>

                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">바로가기</h3>
                        <ul className="space-y-2 text-sm">
                            <li>
                                <Link href="/" className="text-gray-600 hover:text-primary-600 transition-colors">
                                    홈
                                </Link>
                            </li>
                            <li>
                                <Link href="/about/" className="text-gray-600 hover:text-primary-600 transition-colors">
                                    사이트 소개
                                </Link>
                            </li>
                            <li>
                                <Link href="/contact/" className="text-gray-600 hover:text-primary-600 transition-colors">
                                    문의
                                </Link>
                            </li>
                            <li>
                                <a href="/rss/" className="text-gray-600 hover:text-primary-600 transition-colors">
                                    RSS
                                </a>
                            </li>
                            <li>
                                <a href="/sitemap.xml" className="text-gray-600 hover:text-primary-600 transition-colors">
                                    사이트맵
                                </a>
                            </li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">콘텐츠 감수</h3>
                        <ul className="space-y-2 text-sm text-gray-600">
                            <li>
                                감수:{' '}
                                <a
                                    href={REVIEWER.profileUrl}
                                    target="_blank"
                                    rel="noopener"
                                    className="hover:text-primary-600 hover:underline"
                                >
                                    {REVIEWER.name} {REVIEWER.jobTitle}
                                </a>{' '}
                                (
                                <a
                                    href={REVIEWER.organizationUrl}
                                    target="_blank"
                                    rel="noopener"
                                    className="hover:text-primary-600 hover:underline"
                                >
                                    {REVIEWER.organization}
                                </a>
                                )
                            </li>
                            <li className="text-gray-500 text-xs leading-snug">
                                본 사이트의 임플란트 관련 콘텐츠는 라이브치과병원 의료진이
                                의학적 정확성을 감수합니다.
                            </li>
                            <li className="pt-2">
                                <a
                                    href="mailto:contact@gangnamimplant.com"
                                    className="hover:text-primary-600 hover:underline"
                                >
                                    contact@gangnamimplant.com
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="mt-8 pt-8 border-t border-gray-200">
                    <p className="text-center text-gray-500 text-sm">
                        © {new Date().getFullYear()} {SITE.name}. All rights reserved.
                    </p>
                </div>
            </div>
        </footer>
    );
}
