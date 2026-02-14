import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    50: '#e6f2ff',
                    100: '#cce5ff',
                    200: '#99ccff',
                    300: '#66b3ff',
                    400: '#3399ff',
                    500: '#0066CC',
                    600: '#0052a3',
                    700: '#003d7a',
                    800: '#002952',
                    900: '#001429',
                },
                secondary: {
                    50: '#e6faf5',
                    100: '#ccf5eb',
                    200: '#99ebd7',
                    300: '#66e0c3',
                    400: '#33d6af',
                    500: '#00B894',
                    600: '#009376',
                    700: '#006e59',
                    800: '#004a3b',
                    900: '#00251e',
                },
            },
            fontFamily: {
                sans: ['Pretendard', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'sans-serif'],
            },
            typography: {
                DEFAULT: {
                    css: {
                        maxWidth: '70ch',
                        color: '#1f2937',
                        a: {
                            color: '#0066CC',
                            '&:hover': {
                                color: '#0052a3',
                            },
                        },
                        h2: {
                            color: '#1f2937',
                            fontWeight: '700',
                        },
                        h3: {
                            color: '#374151',
                            fontWeight: '600',
                        },
                    },
                },
            },
        },
    },
    plugins: [
        require('@tailwindcss/typography'),
    ],
};

export default config;
