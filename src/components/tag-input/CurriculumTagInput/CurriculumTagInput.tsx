import { useState, useRef, useEffect } from 'react';
import type { Book, Chapter, Topic } from '../../../ssot/types';

// 한글 초성 추출 함수
const getChosung = (text: string): string => {
  const CHOSUNG_LIST = ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];

  return text
    .split('')
    .map((char) => {
      const code = char.charCodeAt(0);
      // 한글 유니코드 범위: 0xAC00 ~ 0xD7A3
      if (code >= 0xAC00 && code <= 0xD7A3) {
        const chosungIndex = Math.floor((code - 0xAC00) / 588);
        return CHOSUNG_LIST[chosungIndex];
      }
      return char;
    })
    .join('');
};

// 초성 검색 매칭 함수
const matchesChosung = (text: string, query: string): boolean => {
  // 띄어쓰기와 쉼표 제거
  const cleanedText = text.replace(/[\s,]/g, '');
  const cleanedQuery = query.replace(/[\s,]/g, '');

  // 검색어가 초성인지 확인
  const CHOSUNG_LIST = ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
  const isChosungQuery = cleanedQuery.split('').every(char => CHOSUNG_LIST.includes(char));

  if (!isChosungQuery) {
    // 일반 검색
    return cleanedText.toLowerCase().includes(cleanedQuery.toLowerCase());
  }

  // 초성 검색
  const textChosung = getChosung(cleanedText);
  return textChosung.includes(cleanedQuery);
};

interface SearchResult {
  book: Book;
  chapter: Chapter;
  topic: Topic;
  tagIds: string[];
  tagLabels: string[];
}

interface SelectedTag {
  tagIds: string[];
  tagLabels: string[];
}

interface CurriculumTagInputProps {
  data: Book[];
  onSelect: (tag: SelectedTag | null) => void;
  placeholder?: string;
  value?: SelectedTag | null;
  color?: string; // 태그 색상 (hex)
}

// 색상 유틸리티 함수
const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
};

function CurriculumTagInput({
  data,
  onSelect,
  placeholder = '단원 검색...',
  value,
  color = '#3b82f6',
}: CurriculumTagInputProps) {
  const [searchText, setSearchText] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedTag, setSelectedTag] = useState<SelectedTag | null>(null);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const lastKeyTimeRef = useRef<number>(0); // 중복 키 이벤트 방지

  // 색상 계산
  const rgb = hexToRgb(color);
  const bgColor = rgb ? `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.1)` : 'rgba(59, 130, 246, 0.1)';
  const textColor = color;
  const hoverBgColor = rgb ? `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.2)` : 'rgba(59, 130, 246, 0.2)';
  const ringColor = color;
  const dropdownHoverBgColor = rgb ? `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.05)` : 'rgba(59, 130, 246, 0.05)';

  // value prop이 변경되면 내부 상태 동기화
  useEffect(() => {
    setSelectedTag(value ?? null);
  }, [value]);

  // 검색 로직
  useEffect(() => {
    if (!searchText.trim()) {
      setResults([]);
      setIsOpen(false);
      setHighlightedIndex(-1);
      return;
    }

    const searchResults: SearchResult[] = [];
    const query = searchText.toLowerCase();

    // 모든 Book, Chapter, Topic을 순회하며 검색
    data.forEach((book) => {
      book.chapters.forEach((chapter) => {
        chapter.topics.forEach((topic) => {
          // Book, Chapter, Topic 중 하나라도 매치되면 결과에 추가 (초성 검색 포함)
          if (
            matchesChosung(book.title, query) ||
            matchesChosung(chapter.title, query) ||
            matchesChosung(topic.title, query)
          ) {
            searchResults.push({
              book,
              chapter,
              topic,
              tagIds: [book.id, chapter.id, topic.id],
              tagLabels: [book.title, chapter.title, topic.title],
            });
          }
        });
      });
    });

    setResults(searchResults);
    setIsOpen(searchResults.length > 0);
    setHighlightedIndex(-1); // 검색어가 바뀌면 하이라이트 초기화
  }, [searchText, data]);

  // 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 하이라이트된 항목으로 스크롤
  useEffect(() => {
    if (highlightedIndex >= 0 && dropdownRef.current) {
      const highlightedElement = dropdownRef.current.children[highlightedIndex] as HTMLElement;
      if (highlightedElement) {
        highlightedElement.scrollIntoView({
          block: 'nearest',
          behavior: 'smooth',
        });
      }
    }
  }, [highlightedIndex]);

  // 텍스트 하이라이트 함수
  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text;

    // 띄어쓰기와 쉼표 제거
    const cleanedQuery = query.replace(/[\s,]/g, '');

    // 초성 리스트
    const CHOSUNG_LIST = ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
    const isChosungQuery = cleanedQuery.split('').every(char => CHOSUNG_LIST.includes(char));

    if (!isChosungQuery) {
      // 일반 검색 (기존 로직)
      const lowerText = text.toLowerCase();
      const lowerQuery = query.toLowerCase();
      const index = lowerText.indexOf(lowerQuery);

      if (index === -1) return text;

      const before = text.slice(0, index);
      const match = text.slice(index, index + query.length);
      const after = text.slice(index + query.length);

      return (
        <>
          {before}
          <span className="bg-blue-100 text-blue-700 font-semibold">{match}</span>
          {after}
        </>
      );
    }

    // 초성 검색 하이라이트
    // 1. 원본 텍스트의 각 문자와 정규화된 인덱스 매핑 생성
    const chars = text.split('');
    const cleanedChars: string[] = [];
    const indexMapping: number[] = []; // cleanedChars의 인덱스 -> 원본 text의 인덱스

    chars.forEach((char, originalIndex) => {
      if (char !== ' ' && char !== ',') {
        cleanedChars.push(char);
        indexMapping.push(originalIndex);
      }
    });

    const cleanedText = cleanedChars.join('');

    // 2. 정규화된 텍스트의 초성 추출
    const textChosung = getChosung(cleanedText);

    // 3. 초성에서 검색어 찾기
    const chosungIndex = textChosung.indexOf(cleanedQuery);

    if (chosungIndex === -1) return text;

    // 4. 매치된 범위 계산 (정규화된 텍스트 기준)
    const matchStart = chosungIndex;
    const matchEnd = chosungIndex + cleanedQuery.length;

    // 5. 원본 텍스트 인덱스로 변환
    const originalStart = indexMapping[matchStart];
    const originalEnd = indexMapping[matchEnd - 1] + 1;

    // 6. 하이라이트
    const before = text.slice(0, originalStart);
    const match = text.slice(originalStart, originalEnd);
    const after = text.slice(originalEnd);

    return (
      <>
        {before}
        <span className="bg-blue-100 text-blue-700 font-semibold">{match}</span>
        {after}
      </>
    );
  };

  // 결과 선택
  const handleSelect = (result: SearchResult) => {
    const newTag: SelectedTag = {
      tagIds: result.tagIds,
      tagLabels: result.tagLabels,
    };

    setSelectedTag(newTag);
    onSelect(newTag);
    setSearchText('');
    setIsOpen(false);
  };

  // 태그 제거
  const handleRemoveTag = () => {
    setSelectedTag(null);
    onSelect(null);
  };

  // 키보드 이벤트 핸들러
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // 중복 키 이벤트 방지 (10ms 이내 같은 이벤트 무시)
    const now = Date.now();
    if (now - lastKeyTimeRef.current < 10) {
      return;
    }
    lastKeyTimeRef.current = now;

    // Backspace로 태그 제거
    if (e.key === 'Backspace' && searchText === '' && selectedTag) {
      e.preventDefault();
      e.stopPropagation();
      handleRemoveTag();
      return;
    }

    // 드롭다운이 열려있을 때만 방향키 처리
    if (!isOpen || results.length === 0) return;

    // ArrowDown: 다음 항목으로 이동
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      e.stopPropagation();
      setHighlightedIndex((prev) => {
        // 아무것도 선택되지 않았으면 첫 번째 항목으로
        if (prev === -1) return 0;
        // 마지막 항목이 아니면 다음 항목으로
        return prev < results.length - 1 ? prev + 1 : prev;
      });
    }

    // ArrowUp: 이전 항목으로 이동
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      e.stopPropagation();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : -1));
    }

    // Enter 또는 Tab: 현재 하이라이트된 항목 선택
    if ((e.key === 'Enter' || e.key === 'Tab') && highlightedIndex >= 0) {
      e.preventDefault();
      e.stopPropagation();
      handleSelect(results[highlightedIndex]);
    }

    // Escape: 드롭다운 닫기
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      setIsOpen(false);
      setHighlightedIndex(-1);
    }
  };

  return (
    <div className="relative">
      <div
        className="flex flex-wrap gap-2 p-2 border border-gray-300 rounded-lg focus-within:ring-2 cursor-text"
        style={{ '--tw-ring-color': ringColor } as React.CSSProperties}
        onClick={() => inputRef.current?.focus()}
      >
        {/* 선택된 태그를 chip 형태로 표시 */}
        {selectedTag && (
          <div
            className="flex items-center gap-1 px-3 py-1 rounded-full text-sm"
            style={{ backgroundColor: bgColor, color: textColor }}
          >
            <span>{selectedTag.tagLabels.join(' > ')}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleRemoveTag();
              }}
              className="rounded-full p-0.5 transition-colors"
              style={{
                ['--hover-bg' as string]: hoverBgColor,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = hoverBgColor;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
              type="button"
            >
              <svg
                className="w-3 h-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        )}

        {/* 검색 입력 필드 */}
        <input
          ref={inputRef}
          type="text"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => searchText && results.length > 0 && setIsOpen(true)}
          placeholder={!selectedTag ? placeholder : ''}
          className="flex-1 min-w-0 outline-none"
        />
      </div>

      {isOpen && results.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-96 overflow-y-auto"
        >
          {results.map((result, index) => {
            const key = result.tagIds.join('-') + '-' + index;
            const isHighlighted = index === highlightedIndex;
            return (
              <div
                key={key}
                onClick={() => handleSelect(result)}
                className="px-4 py-3 cursor-pointer border-b border-gray-100 last:border-b-0"
                style={{
                  backgroundColor: isHighlighted ? bgColor : 'transparent',
                }}
                onMouseEnter={(e) => {
                  if (!isHighlighted) {
                    e.currentTarget.style.backgroundColor = dropdownHoverBgColor;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isHighlighted) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                <div className="text-sm text-gray-600">
                  {highlightText(result.book.title, searchText)}
                  <span className="mx-2 text-gray-400">&gt;</span>
                  {highlightText(result.chapter.title, searchText)}
                  <span className="mx-2 text-gray-400">&gt;</span>
                  {highlightText(result.topic.title, searchText)}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default CurriculumTagInput;
