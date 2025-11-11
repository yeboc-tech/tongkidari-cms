import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { buildSearchIndex, searchIndex, getHighlightSegments, type SearchIndexItem } from '../../utils/searchIndex';

interface SearchInputProps {
  placeholder?: string;
}

function SearchInput({ placeholder = 'Search Everything' }: SearchInputProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchIndexItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // 검색 인덱스를 앱 로드 시 한 번만 생성
  const searchIndexData = useMemo(() => buildSearchIndex(), []);

  // 검색어 변경 시 결과 업데이트
  useEffect(() => {
    if (query.trim()) {
      const searchResults = searchIndex(query, searchIndexData);

      // "문제"라는 단어가 있으면 problem만, 없으면 exam만 필터링
      const hasProblemKeyword = query.includes('문제');
      const filteredResults = searchResults.filter(item =>
        hasProblemKeyword ? item.type === 'problem' : item.type === 'exam'
      );

      // 최대 50개 결과로 제한
      setResults(filteredResults.slice(0, 50));
      setIsOpen(true);
      setSelectedIndex(-1);
    } else {
      setResults([]);
      setIsOpen(false);
    }
  }, [query, searchIndexData]);

  // 외부 클릭 시 드롭다운 닫기
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || results.length === 0) {
      if (e.key === 'Enter') {
        setIsOpen(false);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : prev));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < results.length) {
          handleResultClick(results[selectedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const handleResultClick = (item: SearchIndexItem) => {
    setIsOpen(false);
    setQuery('');
    setSelectedIndex(-1);

    // exam 또는 problem 페이지로 이동
    if (item.type === 'exam') {
      navigate(`/exam/${item.id}`);
    } else if (item.type === 'problem') {
      // problem_id에서 exam_id 추출
      const examId = item.id.replace(/_\d+_문제$/, '');
      // 문제 번호를 쿼리 파라미터로 전달
      navigate(`/exam/${examId}?problem_number=${item.problemNumber}`);
    }
  };

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        placeholder={placeholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => query.trim() && setIsOpen(true)}
        className="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
      />

      {/* 검색 결과 드롭다운 */}
      {isOpen && results.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-96 overflow-y-auto z-50"
        >
          {results.map((item, index) => (
            <div
              key={item.id}
              onClick={() => handleResultClick(item)}
              className={`px-3 py-2 text-sm cursor-pointer border-b border-gray-100 last:border-b-0 ${
                index === selectedIndex ? 'bg-blue-50' : 'hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-2">
                <span
                  className={`px-2 py-0.5 text-xs rounded ${
                    item.type === 'exam' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                  }`}
                >
                  {item.type === 'exam' ? '시험' : '문제'}
                </span>
                <div className="flex-1">
                  {getHighlightSegments(item.displayText, query).map((segment, segIdx) =>
                    segment.highlight ? (
                      <mark key={segIdx} className="bg-yellow-200 font-semibold">
                        {segment.text}
                      </mark>
                    ) : (
                      <span key={segIdx}>{segment.text}</span>
                    )
                  )}
                </div>
              </div>
            </div>
          ))}
          {results.length === 50 && (
            <div className="px-3 py-2 text-xs text-gray-500 text-center border-t border-gray-200">
              더 많은 결과가 있습니다. 검색어를 구체화하세요.
            </div>
          )}
        </div>
      )}

      {/* 검색어가 있지만 결과가 없을 때 */}
      {isOpen && query.trim() && results.length === 0 && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg z-50"
        >
          <div className="px-3 py-2 text-sm text-gray-500 text-center">검색 결과가 없습니다.</div>
        </div>
      )}
    </div>
  );
}

export default SearchInput;
