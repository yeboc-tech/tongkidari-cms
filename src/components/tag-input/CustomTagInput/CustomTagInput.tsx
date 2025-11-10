import { useState, useRef, useEffect } from 'react';

// 한글 초성 추출 함수
const getChosung = (text: string): string => {
  const CHOSUNG_LIST = ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];

  return text
    .split('')
    .map((char) => {
      const code = char.charCodeAt(0);
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
  const cleanedText = text.replace(/[\s,]/g, '');
  const cleanedQuery = query.replace(/[\s,]/g, '');

  const CHOSUNG_LIST = ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
  const isChosungQuery = cleanedQuery.split('').every(char => CHOSUNG_LIST.includes(char));

  if (!isChosungQuery) {
    return cleanedText.toLowerCase().includes(cleanedQuery.toLowerCase());
  }

  const textChosung = getChosung(cleanedText);
  return textChosung.includes(cleanedQuery);
};

// 가짜 기존 태그 목록 가져오기 함수
const fetchExistingTags = async (): Promise<string[]> => {
  // TODO: 나중에 Supabase에서 가져오기
  return ["민간 부문의 순환", "기회비용", "편익과 비용"];
};

interface CustomTagInputProps {
  onTagsChange: (tags: string[]) => void;
}

function CustomTagInput({ onTagsChange }: CustomTagInputProps) {
  const [inputText, setInputText] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [existingTags, setExistingTags] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const lastKeyTimeRef = useRef<number>(0);

  // 기존 태그 목록 로드
  useEffect(() => {
    fetchExistingTags().then(tags => setExistingTags(tags));
  }, []);

  // 검색 로직
  useEffect(() => {
    if (!inputText.trim()) {
      setSuggestions([]);
      setIsOpen(false);
      setHighlightedIndex(-1);
      return;
    }

    const query = inputText.toLowerCase();
    const matchedTags = existingTags.filter(tag =>
      matchesChosung(tag, query) && !selectedTags.includes(tag)
    );

    setSuggestions(matchedTags);
    setIsOpen(matchedTags.length > 0);
    setHighlightedIndex(-1);
  }, [inputText, existingTags, selectedTags]);

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

    const cleanedQuery = query.replace(/[\s,]/g, '');
    const CHOSUNG_LIST = ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
    const isChosungQuery = cleanedQuery.split('').every(char => CHOSUNG_LIST.includes(char));

    if (!isChosungQuery) {
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
    const chars = text.split('');
    const cleanedChars: string[] = [];
    const indexMapping: number[] = [];

    chars.forEach((char, originalIndex) => {
      if (char !== ' ' && char !== ',') {
        cleanedChars.push(char);
        indexMapping.push(originalIndex);
      }
    });

    const cleanedText = cleanedChars.join('');
    const textChosung = getChosung(cleanedText);
    const chosungIndex = textChosung.indexOf(cleanedQuery);

    if (chosungIndex === -1) return text;

    const matchStart = chosungIndex;
    const matchEnd = chosungIndex + cleanedQuery.length;
    const originalStart = indexMapping[matchStart];
    const originalEnd = indexMapping[matchEnd - 1] + 1;

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

  // 태그 추가
  const addTag = (tag: string) => {
    const trimmedTag = tag.trim();
    if (!trimmedTag) return;
    if (selectedTags.includes(trimmedTag)) return;

    const updatedTags = [...selectedTags, trimmedTag];
    setSelectedTags(updatedTags);
    onTagsChange(updatedTags);
    setInputText('');
    setIsOpen(false);
  };

  // 태그 제거
  const removeTag = (index: number) => {
    const updatedTags = selectedTags.filter((_, i) => i !== index);
    setSelectedTags(updatedTags);
    onTagsChange(updatedTags);
  };

  // 키보드 이벤트 핸들러
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // 중복 키 이벤트 방지
    const now = Date.now();
    if (now - lastKeyTimeRef.current < 10) {
      return;
    }
    lastKeyTimeRef.current = now;

    // Enter: 태그 추가
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();

      if (highlightedIndex >= 0 && suggestions.length > 0) {
        // 드롭다운에서 선택된 항목 추가
        addTag(suggestions[highlightedIndex]);
      } else if (inputText.trim()) {
        // 직접 입력한 내용 추가
        addTag(inputText);
      }
      return;
    }

    // Backspace로 태그 제거
    if (e.key === 'Backspace' && inputText === '' && selectedTags.length > 0) {
      e.preventDefault();
      e.stopPropagation();
      removeTag(selectedTags.length - 1);
      return;
    }

    // 드롭다운이 열려있을 때만 방향키 처리
    if (!isOpen || suggestions.length === 0) return;

    // ArrowDown: 다음 항목으로 이동
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      e.stopPropagation();
      setHighlightedIndex((prev) => {
        if (prev === -1) return 0;
        return prev < suggestions.length - 1 ? prev + 1 : prev;
      });
    }

    // ArrowUp: 이전 항목으로 이동
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      e.stopPropagation();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : -1));
    }

    // Tab: 드롭다운에서 선택
    if (e.key === 'Tab' && highlightedIndex >= 0) {
      e.preventDefault();
      e.stopPropagation();
      addTag(suggestions[highlightedIndex]);
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
      <div className="flex flex-wrap gap-2 p-2 border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-blue-500">
        {/* 선택된 태그들을 chip 형태로 표시 */}
        {selectedTags.map((tag, index) => (
          <div
            key={`${tag}-${index}`}
            className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm"
          >
            <span>{tag}</span>
            <button
              onClick={() => removeTag(index)}
              className="hover:bg-green-200 rounded-full p-0.5 transition-colors"
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

        {/* 입력 필드 */}
        <input
          ref={inputRef}
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => inputText && suggestions.length > 0 && setIsOpen(true)}
          placeholder={selectedTags.length === 0 ? '태그 입력 (초성 검색 가능)' : ''}
          className="flex-1 min-w-[120px] outline-none"
        />
      </div>

      {isOpen && suggestions.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto"
        >
          {suggestions.map((suggestion, index) => {
            const isHighlighted = index === highlightedIndex;
            return (
              <div
                key={`${suggestion}-${index}`}
                onClick={() => addTag(suggestion)}
                className={`px-4 py-2 cursor-pointer border-b border-gray-100 last:border-b-0 ${
                  isHighlighted ? 'bg-blue-100' : 'hover:bg-blue-50'
                }`}
              >
                <div className="text-sm text-gray-700">
                  {highlightText(suggestion, inputText)}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default CustomTagInput;
