import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: '문의하기 - 강남임플란트 | 올바른 치과 정보',
    description: '강남임플란트 블로그에 오신 것을 환영합니다. 정보 수정 요청, 제휴 제안, 기타 궁금한 점이 있으시면 언제든지 문의해주세요.',
    keywords: '강남임플란트 문의, 치과 정보 수정, 제휴 문의, 블로그 운영 문의',
};

export default function ContactPage() {
    return (
        <div className="bg-white">
            {/* Hero Section - Clean & Minimal */}
            <section className="bg-gray-50 py-16 sm:py-24 border-b border-gray-100">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
                    <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
                        안녕하세요, 강남임플란트입니다.
                    </h1>
                    <p className="text-lg text-gray-600 leading-relaxed">
                        정확하고 투명한 임플란트 정보를 전달하기 위해 노력하고 있습니다.<br className="hidden sm:block" />
                        잘못된 정보에 대한 정정 요청이나, 더 좋은 정보를 위한 제휴 제안 등<br className="hidden sm:block" />
                        다양한 의견을 귀담아듣겠습니다.
                    </p>
                </div>
            </section>

            {/* Main Content */}
            <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16">

                <div className="grid md:grid-cols-12 gap-12">
                    {/* Contact Info (Left) */}
                    <div className="md:col-span-4 space-y-8">
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">운영 원칙</h3>
                            <p className="text-gray-600 text-sm leading-relaxed">
                                본 블로그는 정보 제공을 목적으로 운영됩니다.
                                특정 병원의 과도한 홍보보다는 객관적인 사실 전달을 최우선으로 합니다.
                            </p>
                        </div>

                        <div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">이메일 문의</h3>
                            <a href="mailto:contact@gangnamimplant.com" className="text-primary-600 font-medium hover:underline block mb-1">
                                contact@gangnamimplant.com
                            </a>
                            <p className="text-gray-500 text-sm">
                                * 평일 기준 1~2일 내로 답변드립니다.
                            </p>
                        </div>

                        <div className="pt-6 border-t border-gray-100">
                            <p className="text-xs text-gray-400">
                                ※ 의료 상담은 진행하지 않습니다.<br />
                                정확한 진단은 치과 병원을 방문해주세요.
                            </p>
                        </div>
                    </div>

                    {/* Contact Form (Right) */}
                    <div className="md:col-span-8">
                        <form className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">이름 / 업체명</label>
                                    <input
                                        type="text"
                                        id="name"
                                        className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-200 focus:bg-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                                        placeholder="홍길동"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
                                    <input
                                        type="email"
                                        id="email"
                                        className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-200 focus:bg-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                                        placeholder="example@email.com"
                                    />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">문의 유형</label>
                                <select
                                    id="subject"
                                    className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-200 focus:bg-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                                >
                                    <option value="">문의하실 내용을 선택해주세요</option>
                                    <option value="info">정보 수정 및 제보</option>
                                    <option value="partnership">제휴 및 광고 문의</option>
                                    <option value="other">기타 문의</option>
                                </select>
                            </div>

                            <div>
                                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">메시지</label>
                                <textarea
                                    id="message"
                                    rows={5}
                                    className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-200 focus:bg-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all resize-none"
                                    placeholder="자유롭게 내용을 남겨주세요."
                                ></textarea>
                            </div>

                            <button
                                type="submit"
                                className="inline-flex justify-center items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-gray-900 hover:bg-gray-800 transition-colors"
                            >
                                문의 보내기
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
