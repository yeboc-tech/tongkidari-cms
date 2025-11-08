// 시험 정보 (월, 종류, 주관 기관)
export const EXAM_COLUMNS = [
  { month: '3월', type: '학평', organizer: '서울시' },
  { month: '4월', type: '학평', organizer: '경기도' },
  { month: '6월', type: '모평', organizer: '평가원' },
  { month: '7월', type: '학평', organizer: '인천시' },
  { month: '9월', type: '모평', organizer: '평가원' },
  { month: '10월', type: '학평', organizer: '서울시' },
  { month: '11월', type: '수능', organizer: '평가원' },
] as const;

// 연도별 시험 문항 수 데이터
export const EXAM_DATA = [
  { year: 2024, data: [20, 20, 20, 20, 20, 20, 20] },
  { year: 2023, data: [20, 20, 20, 20, 20, 20, 20] },
  { year: 2022, data: [20, 20, 20, 20, 20, 20, 20] },
  { year: 2021, data: [20, 20, 20, 20, 20, 20, 20] },
  { year: 2020, data: [20, 20, 20, 20, 20, 20, 20] },
  { year: 2019, data: [11, 13, 16, 10, 15, 9, 16] },
  { year: 2018, data: [5, 5, 8, 4, 5, 5, 6] },
  { year: 2017, data: [2, 2, 4, 2, 5, 1, 1] },
  { year: 2016, data: [2, 1, 2, 2, 3, null, 1] },
  { year: 2014, data: [null, null, null, 1, null, null, null] },
  { year: 2013, data: [null, null, null, null, null, null, 1] },
] as const;

// 타입 정의
export type ExamColumn = (typeof EXAM_COLUMNS)[number];
export type ExamDataRow = (typeof EXAM_DATA)[number];
