/**
 * 사이트 공통 설정 + 라이브치과 그룹 entity 상수
 *
 * 룰북 참조:
 * - _rules/01-POSITIONING_RULES.md (정체성, NAP)
 * - _rules/02-YMYL_TRUST_RULES.md (감수자)
 * - _rules/05-SCHEMA_RULES.md (sameAs)
 */

export const SITE = {
    name: '강남임플란트 정보',
    fullName: '강남임플란트 정보 (운영: 라이브치과병원)',
    tagline: '라이브치과병원이 운영하는 임플란트 정보 사이트',
    description:
        '강남임플란트 정보는 라이브치과병원이 운영하는 임플란트 정보 사이트입니다. 임플란트 가격, 시술, 관리, 보험 등에 대한 일반적인 정보를 의료진 감수를 거쳐 제공합니다.',
    url: process.env.NEXT_PUBLIC_SITE_URL || 'https://www.gangnamimplant.com',
    locale: 'ko-KR',
    defaultOgImage: '/images/og-default.png',
};

// 라이브치과병원 (의료기관) — 운영 주체
export const OPERATOR = {
    legalName: '라이브치과병원',
    representative: '최정우',
    type: 'Dentist' as const,
    url: process.env.NEXT_PUBLIC_OPERATOR_URL || 'https://livedentalcenter.com',
    brandUrl: 'https://liveliveh.com',
    logoUrl: '/images/logo-livedental.svg',
    telephone: process.env.NEXT_PUBLIC_OPERATOR_TEL || '1599-2275',
    businessRegistration: process.env.NEXT_PUBLIC_OPERATOR_BIZ_REG || '120-12-10090',
    medicalLicense: process.env.NEXT_PUBLIC_OPERATOR_MED_LIC || '',
    // 강남점이 본 사이트(강남임플란트 정보)의 주된 표시 지점
    address: {
        streetAddress: process.env.NEXT_PUBLIC_OPERATOR_STREET || '논현로105길 48 라이브빌딩 1, 2층',
        addressLocality: process.env.NEXT_PUBLIC_OPERATOR_LOCALITY || '강남구',
        addressRegion: process.env.NEXT_PUBLIC_OPERATOR_REGION || '서울특별시',
        postalCode: process.env.NEXT_PUBLIC_OPERATOR_POSTAL || '',
        addressCountry: 'KR',
    },
};

// 2지점 정보 (Dentist schema 의 location 또는 LocalBusiness 다중 표기용)
export const BRANCHES = [
    {
        name: '라이브치과병원 강남점',
        slug: 'gangnam',
        address: {
            streetAddress: '논현로105길 48 라이브빌딩 1, 2층',
            addressLocality: '강남구',
            addressRegion: '서울특별시',
            addressCountry: 'KR',
        },
        telephone: '1599-2275',
    },
    {
        name: '라이브치과병원 부평점',
        slug: 'bupyeong',
        address: {
            streetAddress: '부평대로 52 라이브빌딩 2, 3층',
            addressLocality: '부평구',
            addressRegion: '인천광역시',
            addressCountry: 'KR',
        },
        telephone: '1599-2275',
    },
];

// 진료시간 (OpeningHoursSpecification 변환용)
export const OPENING_HOURS = [
    { days: ['Monday', 'Wednesday', 'Friday'], opens: '09:30', closes: '18:30' },
    { days: ['Tuesday', 'Thursday'], opens: '09:30', closes: '21:30' },
    { days: ['Saturday', 'Sunday'], opens: '09:30', closes: '17:00' },
];

export const REVIEWER = {
    name: '최정우',
    jobTitle: '원장',
    organization: '라이브치과병원',
    organizationUrl: 'https://livedentalcenter.com',
    profileUrl: process.env.NEXT_PUBLIC_REVIEWER_URL || 'https://livedentalcenter.com/about/',
};

// entity association — _rules/05 §2, 라이브치과 메모리 룰
export const SAME_AS = [
    'https://livedentalcenter.com',
    'https://liveliveh.com',
    'https://www.gangnamimplant.com',
];

// 의학 정보 면책 (_rules/02 §4)
export const MEDICAL_DISCLAIMER =
    '본 글은 일반적인 정보 제공을 목적으로 하며, 개인의 의학적 진단이나 치료를 대신하지 않습니다. 임플란트 시술 여부, 시술 방법, 비용 등은 개인의 구강 상태에 따라 달라지므로 반드시 치과의사와의 상담을 통해 결정하시기 바랍니다.';

export const SITE_FOOTER_DISCLAIMER =
    '본 사이트의 정보는 일반적인 참고용이며, 진단·치료를 대신하지 않습니다. 개인의 의학적 결정은 반드시 의료진과 상의하세요.';

// 카테고리 슬러그 매핑 (_rules/06 §3)
export const CATEGORY_SLUG_MAP: Record<string, string> = {
    '임플란트 가격': 'implant-price',
    '임플란트-비용': 'implant-price',
    '임플란트 비용': 'implant-price',
    '임플란트 시술': 'implant-procedure',
    '임플란트 관리': 'implant-care',
    '임플란트 브랜드': 'implant-brands',
    '임플란트 보험': 'implant-insurance',
    '치아 크라운': 'dental-crown',
    '치아 보철': 'dental-crown',
    '일반 치과 정보': 'dental-general',
    '치과 정보': 'dental-general',
    '치과 선택 가이드': 'dental-clinic-guide',
    '심미 치료': 'cosmetic-dentistry',
    '치아 교정': 'orthodontics',
};

export function getCategorySlug(category: string): string {
    return CATEGORY_SLUG_MAP[category] || category.toLowerCase().replace(/\s+/g, '-');
}

export function getCategoryDisplayName(slug: string): string {
    const entry = Object.entries(CATEGORY_SLUG_MAP).find(([, s]) => s === slug);
    return entry ? entry[0] : slug;
}

// 카테고리 hub 메타데이터 (slug → 표시 정보)
export const CATEGORY_META: Record<string, { name: string; description: string; intro: string }> = {
    'implant-price': {
        name: '임플란트 가격',
        description: '강남 임플란트 가격과 비용 구조를 브랜드·시술 조건별로 일반적인 시세 범위로 정리합니다. 보험 적용 본인부담금부터 추가 비용까지 확인하세요.',
        intro: '임플란트 가격은 단순 광고가만으로 비교하기 어렵습니다. 픽스처(고정체)·지대주·크라운·뼈이식·CT 촬영 등 시술 단계별 비용이 합쳐져 총비용이 결정되며, 같은 브랜드라도 의료기관·환자 상태에 따라 차이가 큽니다. 본 카테고리에서는 국산·수입 브랜드별 시세 범위, 강남 지역 평균 비용, 65세 이상 건강보험 적용 시 본인부담금, 숨겨진 추가 비용까지 정직하게 안내합니다. 평균 가격을 알아두면 견적서 비교가 훨씬 수월해집니다.',
    },
    'implant-procedure': {
        name: '임플란트 시술',
        description: '임플란트 시술 단계, 진료 기간, 임시 치아, 뼈이식 등 시술 과정 전반의 정보를 단계별로 안내합니다.',
        intro: '임플란트 시술은 진단·식립·골유합·보철 4단계로 이어지며 평균 3~6개월 정도가 소요됩니다. 환자의 잇몸뼈 상태, 발치 여부, 뼈이식 동반 여부에 따라 기간과 절차가 달라지므로 일반 흐름을 알고 진료받는 것이 안전합니다. 본 카테고리에서는 시술 단계, 평균 기간, 임시 치아 비용, 발치 즉시 임플란트, 2차 수술까지 진료 과정 전반을 정리합니다.',
    },
    'implant-care': {
        name: '임플란트 관리',
        description: '시술 후 양치, 식사, 음주, 흡연, 정기검진까지 임플란트를 오래 사용하기 위한 일상 관리 정보입니다.',
        intro: '임플란트는 시술 자체보다 이후 관리가 수명을 좌우합니다. 잘못된 양치 습관, 흡연, 음주, 무리한 운동은 임플란트 주위염과 골 흡수의 원인이 될 수 있어 시술 직후부터 일상 관리 루틴을 만드는 것이 권장됩니다. 본 카테고리에서는 일상 양치 방법, 치실 사용, 음주·흡연 허용 시점, 운동 복귀 시기, 정기 검진 주기까지 임플란트를 10년 이상 안정적으로 사용하기 위한 관리 정보를 안내합니다.',
    },
    'implant-brands': {
        name: '임플란트 브랜드',
        description: '국산·수입 임플란트 주요 브랜드의 특징, 가격대, 적용 상황별 선택 기준을 정리합니다.',
        intro: '국산 임플란트(오스템·덴티움 등)와 수입 임플란트(스트라우만·노벨·아스트라 등)는 평균 가격뿐 아니라 표면 처리, 골유착 속도, 임상 데이터 축적 정도가 다릅니다. 무조건 비싼 브랜드가 정답은 아니며 환자의 잇몸뼈 상태·예산·기대 수명에 맞춰 선택해야 합니다. 본 카테고리에서는 브랜드별 등급·가격·특징을 비교 정리합니다.',
    },
    'implant-insurance': {
        name: '임플란트 보험',
        description: '65세 이상 건강보험 적용 기준, 본인부담금, 신청 방법, 지르코니아 크라운 보험 적용까지 정리합니다.',
        intro: '만 65세 이상은 평생 2개까지 임플란트 건강보험을 적용받을 수 있고, 본인부담금은 평균 35~45만원 수준입니다. 다만 뼈이식은 비급여이고 부분 무치악만 적용 대상이라 사전 조건 확인이 필요합니다. 본 카테고리에서는 건강보험 적용 기준, 본인부담금, 사전 승인 절차, 지르코니아 크라운 보험 적용 변화까지 안내합니다.',
    },
    'dental-crown': {
        name: '치아 크라운',
        description: '지르코니아·올세라믹·PFM 등 크라운 종류별 가격대·내구성·심미성·적용 부위별 선택 기준입니다.',
        intro: '치아 크라운은 재료에 따라 강도·심미성·가격이 크게 다릅니다. 지르코니아는 강도가 높아 어금니에, 올세라믹은 자연치와 가까운 색감으로 앞니에, PFM은 비교적 합리적인 가격으로 폭넓게 사용됩니다. 본 카테고리에서는 종류별 특징·가격 범위·수명을 비교하고 본인 상황에 맞는 선택 기준을 정리합니다.',
    },
    'dental-general': {
        name: '일반 치과 정보',
        description: '치아 관리, 치과 진료, 일요일 진료, 치아 개수 등 일반적인 치과 정보 글 모음입니다.',
        intro: '치과는 평소에 자주 방문하지 않으면 기본 정보부터 막연하게 느껴지기 쉽습니다. 본 카테고리에서는 정상 치아 개수, 일요일·휴일 진료 안내, 치과 스케일러, 치아 신경치료까지 일상에서 자주 검색되는 일반 치과 정보를 정리합니다.',
    },
    'dental-clinic-guide': {
        name: '치과 선택 가이드',
        description: '치과 의료기관 선택 시 참고할 일반적인 기준과 체크리스트입니다.',
        intro: '치과 선택은 단순히 가까운 곳을 고르는 것이 아니라 의료진의 전문성, 장비, 사후 관리 시스템, 비용 투명성을 함께 살펴봐야 합니다. 본 카테고리에서는 의료기관 선택 시 확인해야 할 체크리스트를 정리합니다.',
    },
    'cosmetic-dentistry': {
        name: '심미 치료',
        description: '치아 미백, 미백제, 라미네이트 등 심미 치료에 대한 정보 글 모음입니다.',
        intro: '심미 치료는 기능적 문제가 없는 상태에서 미적 개선을 위해 받는 진료입니다. 치아 미백, 미백제, 라미네이트 등 종류별로 비용·지속 기간·시술 방법이 다르며, 치아 상태에 따라 효과 차이가 큽니다. 본 카테고리에서는 종류별 특징과 일반 정보를 안내합니다.',
    },
    'orthodontics': {
        name: '치아 교정',
        description: '치아 교정 종류, 기간, 비용, 세라믹·메탈·투명교정 등 교정 치료 전반의 정보입니다.',
        intro: '치아 교정은 평균 1.5~3년이 소요되는 장기 치료로, 교정 방법(메탈·세라믹·투명·설측)에 따라 비용·심미성·치료 기간이 달라집니다. 본 카테고리에서는 종류별 특징·비용 범위·평균 기간·강남역 교정 치과 선택 시 참고할 일반 정보를 정리합니다.',
    },
};
