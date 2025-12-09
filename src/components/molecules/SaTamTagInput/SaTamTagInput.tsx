import { useEffect, useState } from 'react';
import CurriculumTagInput from '../../tag-input/CurriculumTagInput/CurriculumTagInput';
import { useChapterStore } from '../../../contexts/ChapterStoreContext';
import type { Chapter } from '../../../ssot/types';

export interface SelectedTag {
  tagIds: string[];
  tagLabels: string[];
}

export interface SaTamTagInputProps {
  subject: string; // e.g., '사회탐구_경제', '사회탐구_정치와법'
  onSelect: (tag: SelectedTag | null) => void;
  placeholder?: string;
  value?: SelectedTag | null;
}

function SaTamTagInput({ subject, onSelect, placeholder, value }: SaTamTagInputProps) {
  const { getChapter, loadChapters } = useChapterStore();
  const [chapterData, setChapterData] = useState<Chapter | null>(null);

  // SSOT key: 단원_사회탐구_{과목명}
  const ssotKey = `단원_${subject}`;

  useEffect(() => {
    // Chapter 데이터 로드
    const fetchChapter = async () => {
      await loadChapters([ssotKey]);
      const chapter = getChapter(ssotKey);
      if (chapter) {
        setChapterData(chapter);
      }
    };

    fetchChapter();
  }, [subject, ssotKey]);

  // 기본 placeholder
  const defaultPlaceholder = `${subject} 단원 태그`;

  // 데이터가 로딩 중이거나 없으면 빈 배열로 렌더링
  const data = chapterData ? [chapterData] : [];

  return (
    <CurriculumTagInput
      data={data}
      onSelect={onSelect}
      placeholder={placeholder || defaultPlaceholder}
      value={value}
      color="#4f46e5" // indigo color for 사탐
    />
  );
}

export default SaTamTagInput;
