/**
 * SSOT: 교과 구조 정의
 * Single Source of Truth for curriculum structure
 */

/**
 * 중단원 구조
 */
interface Topic {
  id: string; // 예: "1-1-1", "1-1-2"
  title: string; // 예: "01. 인간, 사회, 환경을 바라보는 다양한 관점"
}

/**
 * 대단원 구조
 */
interface Chapter {
  id: string; // 예: "1-1", "1-2"
  title: string; // 예: "I. 통합적 관점"
  topics: Topic[];
}

/**
 * 교과(통합사회 1 또는 2) 구조
 */
interface Book {
  id: string; // 예: "1", "2"
  title: string; // 예: "통합사회 1", "통합사회 2"
  chapters: Chapter[];
}

/**
 * 통합사회 전체 교과 구조 (Book 배열)
 */
export const 자세한통합사회_단원_태그: Book[] = [
    {
      id: '1',
      title: '통합사회 1',
      chapters: [
        {
          id: '1-1',
          title: 'I. 통합적 관점',
          topics: [
            {
              id: '1-1-1',
              title: '01. 인간, 사회, 환경을 바라보는 다양한 관점',
            },
            {
              id: '1-1-2',
              title: '02. 통합적 관점의 필요성과 적용',
            },
          ],
        },
        {
          id: '1-2',
          title: 'II. 인간, 사회, 환경과 행복',
          topics: [
            {
              id: '1-2-1',
              title: '01. 행복의 기준과 의미',
            },
            {
              id: '1-2-2',
              title: '02. 행복한 삶을 실현하기 위한 조건',
            },
          ],
        },
        {
          id: '1-3',
          title: 'III. 자연환경과 인간',
          topics: [
            {
              id: '1-3-1',
              title: '01. 자연환경과 인간 생활',
            },
            {
              id: '1-3-2',
              title: '02. 인간과 자연의 관계',
            },
            {
              id: '1-3-3',
              title: '03. 환경 문제 해결을 위한 다양한 노력',
            },
          ],
        },
        {
          id: '1-4',
          title: 'IV. 문화와 다양성',
          topics: [
            {
              id: '1-4-1',
              title: '01. 세계의 다양한 문화권',
            },
            {
              id: '1-4-2',
              title: '02. 문화 변동과 전통문화',
            },
            {
              id: '1-4-3',
              title: '03. 문화 상대주의와 보편 윤리',
            },
            {
              id: '1-4-4',
              title: '04. 다문화 사회와 문화적 다양성 존중',
            },
          ],
        },
        {
          id: '1-5',
          title: 'V. 생활공간과 사회',
          topics: [
            {
              id: '1-5-1',
              title: '01. 산업화와 도시화에 따른 변화',
            },
            {
              id: '1-5-2',
              title: '02. 교통·통신 및 과학기술의 발달에 따른 변화',
            },
            {
              id: '1-5-3',
              title: '03. 우리 지역의 공간 변화',
            },
          ],
        },
      ],
    },
    {
      id: '2',
      title: '통합사회 2',
      chapters: [
        {
          id: '2-1',
          title: 'I. 인권 보장과 헌법',
          topics: [
            {
              id: '2-1-1',
              title: '01. 인권의 의미와 현대 사회의 인권',
            },
            {
              id: '2-1-2',
              title: '02. 인권 보장을 위한 헌법의 역할과 시민 참여',
            },
            {
              id: '2-1-3',
              title: '03. 인권 문제의 양상과 해결 방안',
            },
          ],
        },
        {
          id: '2-2',
          title: 'II. 사회정의와 불평등',
          topics: [
            {
              id: '2-2-1',
              title: '01. 정의의 의미와 실질적 기준',
            },
            {
              id: '2-2-2',
              title: '02. 다양한 정의관의 특징과 적용',
            },
            {
              id: '2-2-3',
              title: '03. 다양한 불평등 현상과 정의로운 사회 실현',
            },
          ],
        },
        {
          id: '2-3',
          title: 'III. 시장경제와 지속가능발전',
          topics: [
            {
              id: '2-3-1',
              title: '01. 자본주의의 전개 과정과 경제 체제',
            },
            {
              id: '2-3-2',
              title: '02. 합리적 선택과 경제 주체의 역할',
            },
            {
              id: '2-3-3',
              title: '03. 자산 관리와 금융 생활 설계',
            },
            {
              id: '2-3-4',
              title: '04. 국제 분업과 무역',
            },
          ],
        },
        {
          id: '2-4',
          title: 'IV. 세계화와 평화',
          topics: [
            {
              id: '2-4-1',
              title: '01. 세계화의 다양한 양상과 문제 해결 방안',
            },
            {
              id: '2-4-2',
              title: '02. 평화의 의미와 국제 사회의 역할',
            },
            {
              id: '2-4-3',
              title: '03. 남북 분단 및 동아시아 역사 갈등과 세계 평화를 위한 노력',
            },
          ],
        },
        {
          id: '2-5',
          title: 'V. 미래와 지속가능한 삶',
          topics: [
            {
              id: '2-5-1',
              title: '01. 세계의 인구 변화와 인구 문제',
            },
            {
              id: '2-5-2',
              title: '02. 에너지 자원과 지속가능한 발전',
            },
            {
              id: '2-5-3',
              title: '03. 미래 사회와 세계시민으로서의 삶',
            },
          ],
        },
      ],
    },
];

/**
 * 전체 대단원 목록 (통합사회 1 + 2)
 */
export const 전체_대단원_목록: Chapter[] = [
  ...자세한통합사회_단원_태그[0].chapters,
  ...자세한통합사회_단원_태그[1].chapters,
];

/**
 * 대단원 ID로 대단원 찾기
 * @param chapterId - 예: "1-1", "2-3"
 */
export const findChapterById = (chapterId: string): Chapter | undefined => {
  return 전체_대단원_목록.find((chapter) => chapter.id === chapterId);
};

/**
 * 중단원 ID로 중단원 찾기
 * @param topicId - 예: "1-1-1", "2-3-2"
 */
export const findTopicById = (topicId: string): Topic | undefined => {
  for (const chapter of 전체_대단원_목록) {
    const topic = chapter.topics.find((t) => t.id === topicId);
    if (topic) return topic;
  }
  return undefined;
};

/**
 * 교과(통합사회 1 또는 2) ID로 찾기
 * @param bookId - "1" 또는 "2"
 */
export const findBookById = (bookId: string): Book | undefined => {
  return 자세한통합사회_단원_태그.find((book) => book.id === bookId);
};

// Type exports
export type { Book, Chapter, Topic };
