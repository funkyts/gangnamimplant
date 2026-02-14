export default function Footer() {
    return (
        <footer className="bg-gray-50 border-t border-gray-200 mt-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* About */}
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                            강남임플란트치과
                        </h3>
                        <p className="text-gray-600 text-sm leading-relaxed">
                            강남 지역 임플란트 전문 정보를 제공합니다.
                            정확하고 유용한 치과 정보로 여러분의 건강한 치아를 지켜드립니다.
                        </p>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                            바로가기
                        </h3>
                        <ul className="space-y-2 text-sm">
                            <li>
                                <a href="/" className="text-gray-600 hover:text-primary-600 transition-colors">
                                    홈
                                </a>
                            </li>
                            <li>
                                <a href="/#blog" className="text-gray-600 hover:text-primary-600 transition-colors">
                                    블로그
                                </a>
                            </li>
                            <li>
                                <a href="/about" className="text-gray-600 hover:text-primary-600 transition-colors">
                                    About
                                </a>
                            </li>
                        </ul>
                    </div>

                    {/* Contact */}
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                            문의
                        </h3>
                        <ul className="space-y-2 text-sm text-gray-600">
                            <li>서울시 강남구</li>
                            <li>
                                <a href="mailto:contact@gangnamimplant.com" className="hover:text-primary-600 transition-colors">
                                    contact@gangnamimplant.com
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Copyright */}
                <div className="mt-8 pt-8 border-t border-gray-200">
                    <p className="text-center text-gray-500 text-sm">
                        © {new Date().getFullYear()} 강남임플란트치과. All rights reserved.
                    </p>
                </div>
            </div>
        </footer>
    );
}
