/**
 * SSOT: 과목 및 교육과정 정의
 * Single Source of Truth for subjects and curriculum configuration
 */

// 교육과정 그룹 설정
export const CURRICULUM_GROUPS = [
  {
    name: '2015교육과정',
    startYear: 2013,
    endYear: 2026,
    bgColor: 'bg-blue-50',
  },
  {
    name: '2022교육과정',
    startYear: 2027,
    endYear: 2030,
    bgColor: 'bg-green-50',
  },
] as const;

// 과목 설정
export const SUBJECTS = {
  사회: {
    '2015교육과정': [
      '경제',
      '사회문화',
      '정치와법',
      '생활과윤리',
      '세계지리',
      '한국지리',
      '윤리와사상',
      '세계사',
      '동아시아사',
    ],
    '2022교육과정': ['통합사회'],
  },
  과학: {
    '2015교육과정': ['물리학1', '화학1', '생명과학1', '지구과학1', '물리학2', '화학2', '생명과학2', '지구과학2'],
    '2022교육과정': ['통합과학'],
  },
} as const;

// 타입 정의
export type CategoryName = keyof typeof SUBJECTS;
export type CurriculumName = '2015교육과정' | '2022교육과정';
