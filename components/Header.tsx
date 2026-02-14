import Link from 'next/link';

export default function Header() {
    return (
        <header className="bg-white shadow-sm border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <Link href="/" className="flex items-center">
                        <h1 className="text-2xl font-bold text-primary-600">
                            강남임플란트
                        </h1>
                    </Link>

                    {/* Navigation */}
                    <nav className="hidden md:flex space-x-8">
                        <Link
                            href="/"
                            className="text-gray-700 hover:text-primary-600 transition-colors font-medium"
                        >
                            홈
                        </Link>
                        <Link
                            href="/#blog"
                            className="text-gray-700 hover:text-primary-600 transition-colors font-medium"
                        >
                            블로그
                        </Link>
                        <Link
                            href="/about"
                            className="text-gray-700 hover:text-primary-600 transition-colors font-medium"
                        >
                            About
                        </Link>
                        <Link
                            href="/contact"
                            className="text-gray-700 hover:text-primary-600 transition-colors font-medium"
                        >
                            문의
                        </Link>
                    </nav>

                    {/* Mobile menu button */}
                    <button
                        className="md:hidden p-2 rounded-md text-gray-700 hover:text-primary-600 hover:bg-gray-100"
                        aria-label="메뉴"
                    >
                        <svg
                            className="h-6 w-6"
                            fill="none"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path d="M4 6h16M4 12h16M4 18h16"></path>
                        </svg>
                    </button>
                </div>
            </div>
        </header>
    );
}
