/**
 * 의학 감수자 박스 — _rules/02-YMYL_TRUST_RULES.md §1
 * 모든 블로그 글의 lead 직후, 첫 번째 H2 직전에 박는다.
 */
import { REVIEWER } from '@/lib/site-config';
import type { PostReviewer } from '@/lib/posts';

interface MedicalReviewerBoxProps {
    reviewer?: PostReviewer;
    lastReviewed?: string;
}

export default function MedicalReviewerBox({ reviewer, lastReviewed }: MedicalReviewerBoxProps) {
    const r = reviewer || {
        name: REVIEWER.name,
        title: REVIEWER.jobTitle,
        organization: REVIEWER.organization,
        url: REVIEWER.profileUrl,
    };

    const profileUrl = r.url || REVIEWER.organizationUrl;

    const formatted = lastReviewed
        ? new Date(lastReviewed).toLocaleDateString('ko-KR', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
          })
        : null;

    return (
        <aside
            className="ebugo-reviewer-box my-8 p-4 sm:p-5 bg-primary-50 border-l-4 border-primary-600 rounded-r-lg"
            aria-label="의학 감수 정보"
        >
            <p className="text-sm sm:text-base text-gray-800">
                <span className="font-semibold">감수</span>: {r.name} {r.title}{' '}
                <span className="text-gray-600">
                    (
                    <a
                        href={profileUrl}
                        target="_blank"
                        rel="noopener"
                        className="hover:underline"
                    >
                        {r.organization}
                    </a>
                    )
                </span>
            </p>
            {formatted && (
                <p className="text-sm text-gray-600 mt-1">
                    <span className="font-semibold">최종 업데이트</span>: {formatted}
                </p>
            )}
            <p className="text-sm text-gray-700 mt-2">
                본 글은 라이브치과병원 의료진이 의학적 정확성을 감수했습니다.
            </p>
        </aside>
    );
}
