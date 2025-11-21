import { useState, useRef, useEffect, useMemo } from 'react';
import type { Chapter } from '../../ssot/types';

interface ChapterTreeProps {
  data: Chapter[];
  onSelectionChange?: (selectedIds: string[]) => void;
  accentColor?: string;
}

interface CheckboxProps {
  checkState: 'checked' | 'unchecked' | 'indeterminate';
  accentColor?: string;
}

function IndeterminateCheckbox({ checkState, accentColor = '#ff4081' }: CheckboxProps) {
  const checkboxRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (checkboxRef.current) {
      checkboxRef.current.indeterminate = checkState === 'indeterminate';
    }
  }, [checkState]);

  return (
    <input
      ref={checkboxRef}
      type="checkbox"
      className="w-4 h-4 mr-2 cursor-pointer"
      style={{
        accentColor: checkState === 'indeterminate' ? '#9ca3af' : accentColor,
      }}
      checked={checkState === 'checked'}
      onChange={() => {}}
    />
  );
}

function ChapterTree({ data, onSelectionChange, accentColor = '#ff4081' }: ChapterTreeProps) {

  // 모든 Chapter ID를 재귀적으로 수집하는 헬퍼 함수
  const collectAllIds = (chapters: Chapter[]): string[] => {
    const result: string[] = [];

    const traverse = (chapter: Chapter) => {
      result.push(chapter.id);
      if (chapter.chapters && chapter.chapters.length > 0) {
        chapter.chapters.forEach(traverse);
      }
    };

    chapters.forEach(traverse);
    return result;
  };

  // 리프 노드(자식이 없는 노드) ID만 수집
  const collectLeafIds = (chapters: Chapter[]): string[] => {
    const result: string[] = [];

    const traverse = (chapter: Chapter) => {
      if (!chapter.chapters || chapter.chapters.length === 0) {
        result.push(chapter.id);
      } else {
        chapter.chapters.forEach(traverse);
      }
    };

    chapters.forEach(traverse);
    return result;
  };

  // 모든 ID 수집 (초기 펼침 상태용)
  const allIds = useMemo(() => collectAllIds(data), [data]);

  // 리프 노드 ID 수집 (선택 상태 전달용)
  const leafNodeIds = useMemo(() => new Set(collectLeafIds(data)), [data]);

  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set(allIds));
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());

  const onSelectionChangeRef = useRef(onSelectionChange);

  useEffect(() => {
    onSelectionChangeRef.current = onSelectionChange;
  }, [onSelectionChange]);

  // data가 변경되면 expandedItems 업데이트
  useEffect(() => {
    setExpandedItems(new Set(allIds));
  }, [allIds]);

  // 선택된 리프 노드만 부모에게 전달
  useEffect(() => {
    if (onSelectionChangeRef.current) {
      const checkedLeafIds = Array.from(checkedItems).filter((id) => leafNodeIds.has(id));
      onSelectionChangeRef.current(checkedLeafIds);
    }
  }, [checkedItems, leafNodeIds]);

  const toggleExpanded = (id: string) => {
    setExpandedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // 하위 모든 자식 ID를 재귀적으로 수집
  const getAllChildIds = (chapter: Chapter): string[] => {
    const result: string[] = [];

    const traverse = (ch: Chapter) => {
      result.push(ch.id);
      if (ch.chapters && ch.chapters.length > 0) {
        ch.chapters.forEach(traverse);
      }
    };

    if (chapter.chapters && chapter.chapters.length > 0) {
      chapter.chapters.forEach(traverse);
    }

    return result;
  };

  // Check 상태 계산
  const getCheckState = (chapter: Chapter): 'checked' | 'unchecked' | 'indeterminate' => {
    const childIds = getAllChildIds(chapter);

    if (childIds.length === 0) {
      return checkedItems.has(chapter.id) ? 'checked' : 'unchecked';
    }

    const checkedChildren = childIds.filter((id) => checkedItems.has(id));

    if (checkedChildren.length === 0) {
      return 'unchecked';
    } else if (checkedChildren.length === childIds.length) {
      return 'checked';
    } else {
      return 'indeterminate';
    }
  };

  // Checkbox 변경 핸들러
  const handleCheckboxChange = (chapter: Chapter) => {
    const childIds = getAllChildIds(chapter);
    const allIds = [chapter.id, ...childIds];

    setCheckedItems((prev) => {
      const newSet = new Set(prev);

      // 현재 체크 상태 확인
      const isChecked = newSet.has(chapter.id);

      if (isChecked) {
        // Uncheck: 자신과 모든 하위 노드 체크 해제
        allIds.forEach((id) => newSet.delete(id));
      } else {
        // Check: 자신과 모든 하위 노드 체크
        allIds.forEach((id) => newSet.add(id));
      }

      return newSet;
    });
  };

  // 재귀적 렌더링 함수
  const renderChapter = (chapter: Chapter, level: number): JSX.Element => {
    const isExpanded = expandedItems.has(chapter.id);
    const hasChildren = chapter.chapters && chapter.chapters.length > 0;
    const indent = level * 24;
    const checkState = hasChildren ? getCheckState(chapter) : checkedItems.has(chapter.id) ? 'checked' : 'unchecked';

    return (
      <div key={chapter.id}>
        <div className="flex items-center py-1 hover:bg-gray-50" style={{ paddingLeft: `${indent}px` }}>
          {/* 펼침/접기 화살표 */}
          <div className="cursor-pointer" onClick={() => hasChildren && toggleExpanded(chapter.id)}>
            {hasChildren ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                fill="none"
                viewBox="0 0 24 24"
                className={`transition-transform ${isExpanded ? 'rotate-180' : 'rotate-90'}`}
                style={{ width: '24px', color: isExpanded ? 'rgb(112, 112, 112)' : 'rgb(192, 192, 192)' }}
              >
                <path
                  fill="currentColor"
                  d="M16.586 15.5c.89 0 1.337-1.077.707-1.707l-4.586-4.586c-.39-.39-1.024-.39-1.414 0l-4.586 4.586c-.63.63-.184 1.707.707 1.707h9.172z"
                />
              </svg>
            ) : (
              <div className="w-6 h-6" />
            )}
          </div>

          {/* 체크박스 */}
          <div
            className="flex items-center cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              handleCheckboxChange(chapter);
            }}
          >
            {hasChildren ? (
              <IndeterminateCheckbox checkState={checkState as 'checked' | 'unchecked' | 'indeterminate'} accentColor={accentColor} />
            ) : (
              <input
                type="checkbox"
                className="w-4 h-4 mr-2 cursor-pointer"
                style={{ accentColor }}
                checked={checkState === 'checked'}
                onChange={() => {}}
              />
            )}
          </div>

          {/* 제목 */}
          <span className={`text-sm cursor-pointer ${level === 0 ? 'font-semibold' : level === 1 ? 'font-medium' : ''}`}>
            {chapter.title}
          </span>
        </div>

        {/* 하위 chapters 재귀 렌더링 */}
        {hasChildren && isExpanded && (
          <div>{chapter.chapters!.map((child) => renderChapter(child, level + 1))}</div>
        )}
      </div>
    );
  };

  return (
    <div className="border border-gray-300 rounded-lg p-4 bg-white">
      <div className="space-y-1">{data.map((chapter) => renderChapter(chapter, 0))}</div>
    </div>
  );
}

export default ChapterTree;
