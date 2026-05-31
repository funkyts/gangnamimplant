/**
 * 의학 정보 면책 — _rules/02-YMYL_TRUST_RULES.md §4
 * 모든 블로그 글의 본문 마지막, FAQ 직후 + References 직전에 박는다.
 */
import { MEDICAL_DISCLAIMER } from '@/lib/site-config';

interface MedicalDisclaimerProps {
    extra?: string;
}

export default function MedicalDisclaimer({ extra }: MedicalDisclaimerProps) {
    return (
        <aside
            className="ebugo-medical-disclaimer my-10 p-5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 leading-relaxed"
            aria-label="의학 정보 면책"
        >
            <p className="font-semibold text-gray-800 mb-2">의학 정보 면책</p>
            <p>{MEDICAL_DISCLAIMER}</p>
            {extra && <p className="mt-2">{extra}</p>}
        </aside>
    );
}
