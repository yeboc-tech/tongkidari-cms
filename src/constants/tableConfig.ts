// ========== 테이블 설정 상수 ==========

// 교육과정 그룹 설정
export const CURRICULUM_GROUPS = [
  {
    name: '2015교육과정',
    startYear: 2014,
    endYear: 2025,
    bgColor: 'bg-blue-50',
  },
  {
    name: '2022교육과정',
    startYear: 2026,
    endYear: 2027,
    bgColor: 'bg-green-50',
  },
] as const;

// 학년 설정
export const GRADES = ['고3', '고2', '고1'] as const;

// 과목 설정
export const SUBJECTS = {
  사회: {
    '2015교육과정': [
      '사회문화',
      '정치와법',
      '경제',
      '세계지리',
      '한국지리',
      '생활과윤리',
      '윤리와사상',
      '세계사',
      '동아시아사',
    ],
    '2022교육과정': [],
  },
  과학: {
    '2015교육과정': [
      '물리학1',
      '화학1',
      '생명과학1',
      '지구과학1',
      '물리학2',
      '화학2',
      '생명과학2',
      '지구과학2',
    ],
    '2022교육과정': [],
  },
} as const;

// 타입 정의
export type CurriculumGroup = (typeof CURRICULUM_GROUPS)[number];
export type Grade = (typeof GRADES)[number];
export type CategoryName = keyof typeof SUBJECTS;
export type CurriculumName = '2015교육과정' | '2022교육과정';
