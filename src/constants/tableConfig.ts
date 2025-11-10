// ========== 테이블 설정 상수 ==========

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

// 학년 설정
export const GRADES = ['고3', '고2', '고1'] as const;

// 드롭다운용 학년 목록 (역순: 고3, 고2, 고1)
export const GRADE_OPTIONS = ['고3', '고2', '고1'] as const;

// 시험 컬럼 정의 (고정값)
export const EXAM_COLUMNS = [
  { month: '3', type: '학평', region: '서울' },
  { month: '4', type: '학평', region: '경기' },
  { month: '6', type: '모평', region: '평가원' },
  { month: '7', type: '학평', region: '인천' },
  { month: '9', type: '모평', region: '평가원' },
  { month: '10', type: '학평', region: '서울' },
  { month: '11', type: '수능', region: '평가원' },
] as const;

// 교육과정 전환 설정
// 전환 순서: 항상 고1 → 고2 → 고3 순서로 전환
export const CURRICULUM_TRANSITIONS = [
  {
    oldCurriculum: '2015교육과정',
    newCurriculum: '2022교육과정',
    transitionStartYear: 2025, // 2025년에 고1부터 2022교육과정 시작
  },
  // 미래에 다른 교육과정 전환이 있을 경우 여기에 추가
] as const;

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
    '2022교육과정': ['통합사회'],
  },
  과학: {
    '2015교육과정': ['물리학1', '화학1', '생명과학1', '지구과학1', '물리학2', '화학2', '생명과학2', '지구과학2'],
    '2022교육과정': ['통합과학'],
  },
} as const;

// 타입 정의
export type CurriculumGroup = (typeof CURRICULUM_GROUPS)[number];
export type Grade = (typeof GRADES)[number];
export type CategoryName = keyof typeof SUBJECTS;
export type CurriculumName = '2015교육과정' | '2022교육과정';

// ========== 헬퍼 함수 ==========

/**
 * 특정 연도와 학년에 해당하는 교육과정을 반환합니다.
 * 전환 순서: 고1 → 고2 → 고3
 *
 * 예시:
 * - 2025년: 고1=2022교육과정, 고2=2015교육과정, 고3=2015교육과정
 * - 2026년: 고1=2022교육과정, 고2=2022교육과정, 고3=2015교육과정
 * - 2027년: 고1=2022교육과정, 고2=2022교육과정, 고3=2022교육과정
 */
export const getCurriculumByYearAndGrade = (year: number, grade: Grade): CurriculumName => {
  // 가장 최근 전환부터 역순으로 확인 (여러 전환이 있을 수 있으므로)
  for (let i = CURRICULUM_TRANSITIONS.length - 1; i >= 0; i--) {
    const transition = CURRICULUM_TRANSITIONS[i];
    const { transitionStartYear, newCurriculum, oldCurriculum } = transition;

    if (year >= transitionStartYear) {
      // 전환이 시작된 이후
      const yearsSinceTransition = year - transitionStartYear;

      // 학년을 인덱스로 변환 (고1=0, 고2=1, 고3=2)
      const gradeIndex = grade === '고1' ? 0 : grade === '고2' ? 1 : 2;

      // 전환된 연수가 학년 인덱스 이상이면 새 교육과정
      if (yearsSinceTransition >= gradeIndex) {
        return newCurriculum as CurriculumName;
      }

      return oldCurriculum as CurriculumName;
    }
  }

  // 어떤 전환도 시작되지 않았으면 가장 오래된 교육과정 반환
  return '2015교육과정';
};
