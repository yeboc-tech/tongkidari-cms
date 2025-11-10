import { useState, useRef, useEffect } from 'react';
import {
  자세한통합사회_단원_태그,
  type Book,
  type Chapter,
  type Topic
} from '../../../ssot/curriculumStructure';

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
  onSelect: (tags: SelectedTag[]) => void;
}

function CurriculumTagInput({ onSelect }: CurriculumTagInputProps) {
  const [searchText, setSearchText] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedTags, setSelectedTags] = useState<SelectedTag[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

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
    자세한통합사회_단원_태그.forEach((book) => {
      book.chapters.forEach((chapter) => {
        chapter.topics.forEach((topic) => {
          // Book, Chapter, Topic 중 하나라도 매치되면 결과에 추가
          if (
            book.title.toLowerCase().includes(query) ||
            chapter.title.toLowerCase().includes(query) ||
            topic.title.toLowerCase().includes(query)
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
  }, [searchText]);

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
  };

  // 결과 선택
  const handleSelect = (result: SearchResult) => {
    const newTag: SelectedTag = {
      tagIds: result.tagIds,
      tagLabels: result.tagLabels,
    };

    // 중복 체크
    const isDuplicate = selectedTags.some(
      (tag) => tag.tagIds.join('-') === result.tagIds.join('-')
    );

    if (!isDuplicate) {
      const updatedTags = [...selectedTags, newTag];
      setSelectedTags(updatedTags);
      onSelect(updatedTags);
    }

    setSearchText('');
    setIsOpen(false);
  };

  // 태그 제거
  const handleRemoveTag = (index: number) => {
    const updatedTags = selectedTags.filter((_, i) => i !== index);
    setSelectedTags(updatedTags);
    onSelect(updatedTags);
  };

  // 키보드 이벤트 핸들러
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Backspace로 태그 제거
    if (e.key === 'Backspace' && searchText === '' && selectedTags.length > 0) {
      handleRemoveTag(selectedTags.length - 1);
      return;
    }

    // 드롭다운이 열려있을 때만 방향키 처리
    if (!isOpen || results.length === 0) return;

    // ArrowDown: 다음 항목으로 이동
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev < results.length - 1 ? prev + 1 : prev));
    }

    // ArrowUp: 이전 항목으로 이동
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : -1));
    }

    // Enter: 현재 하이라이트된 항목 선택
    if (e.key === 'Enter' && highlightedIndex >= 0) {
      e.preventDefault();
      handleSelect(results[highlightedIndex]);
    }

    // Escape: 드롭다운 닫기
    if (e.key === 'Escape') {
      setIsOpen(false);
      setHighlightedIndex(-1);
    }
  };

  return (
    <div className="relative">
      <div className="flex flex-wrap gap-2 p-2 border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-blue-500">
        {/* 선택된 태그들을 chip 형태로 표시 */}
        {selectedTags.map((tag, index) => (
          <div
            key={`${tag.tagIds.join('-')}-${index}`}
            className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
          >
            <span>{tag.tagLabels[tag.tagLabels.length - 1]}</span>
            <button
              onClick={() => handleRemoveTag(index)}
              className="hover:bg-blue-200 rounded-full p-0.5 transition-colors"
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
        ))}

        {/* 검색 입력 필드 */}
        <input
          ref={inputRef}
          type="text"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => searchText && results.length > 0 && setIsOpen(true)}
          placeholder={selectedTags.length === 0 ? '단원 검색...' : ''}
          className="flex-1 min-w-[120px] outline-none"
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
                onMouseEnter={() => setHighlightedIndex(index)}
                className={`px-4 py-3 cursor-pointer border-b border-gray-100 last:border-b-0 ${
                  isHighlighted ? 'bg-blue-100' : 'hover:bg-blue-50'
                }`}
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
