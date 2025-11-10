import { useState, useRef, useEffect } from 'react';
import type { Book, Chapter, Topic } from '../../ssot/types';

interface ChapterTreeProps {
  data: Book[];
}

interface CheckboxProps {
  checkState: 'checked' | 'unchecked' | 'indeterminate';
}

function IndeterminateCheckbox({ checkState }: CheckboxProps) {
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
        accentColor: checkState === 'indeterminate' ? '#9ca3af' : undefined,
      }}
      checked={checkState === 'checked'}
      onChange={() => {}}
    />
  );
}

function ChapterTree({ data }: ChapterTreeProps) {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());

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

  // Get all child IDs for a given item
  const getAllChildIds = (item: Book | Chapter): string[] => {
    const ids: string[] = [];

    if ('chapters' in item) {
      // Book
      item.chapters.forEach((chapter) => {
        ids.push(chapter.id);
        if (chapter.topics) {
          chapter.topics.forEach((topic) => ids.push(topic.id));
        }
      });
    } else if ('topics' in item) {
      // Chapter
      if (item.topics) {
        item.topics.forEach((topic) => ids.push(topic.id));
      }
    }

    return ids;
  };

  // Get check state for an item (checked, unchecked, or indeterminate)
  const getCheckState = (item: Book | Chapter): 'checked' | 'unchecked' | 'indeterminate' => {
    const childIds = getAllChildIds(item);
    if (childIds.length === 0) {
      return checkedItems.has(item.id) ? 'checked' : 'unchecked';
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

  // Handle checkbox change with cascading
  const handleCheckboxChange = (id: string, item: Book | Chapter | Topic) => {
    setCheckedItems((prev) => {
      const newSet = new Set(prev);

      if (newSet.has(id)) {
        // Uncheck: remove this item and all children
        newSet.delete(id);

        if ('chapters' in item || 'topics' in item) {
          const childIds = getAllChildIds(item as Book | Chapter);
          childIds.forEach((childId) => newSet.delete(childId));
        }
      } else {
        // Check: add this item and all children
        newSet.add(id);

        if ('chapters' in item || 'topics' in item) {
          const childIds = getAllChildIds(item as Book | Chapter);
          childIds.forEach((childId) => newSet.add(childId));
        }
      }

      return newSet;
    });
  };

  const renderTopic = (topic: Topic, level: number) => {
    const indent = level * 24;
    const isChecked = checkedItems.has(topic.id);

    return (
      <div
        key={topic.id}
        className="flex items-center py-1 hover:bg-gray-50"
        style={{ paddingLeft: `${indent}px` }}
      >
        <div className="w-6 h-6" /> {/* Empty space for no arrow */}
        <div
          className="flex items-center cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            handleCheckboxChange(topic.id, topic);
          }}
        >
          <input
            type="checkbox"
            className="w-4 h-4 mr-2 cursor-pointer"
            checked={isChecked}
            onChange={() => {}}
          />
        </div>
        <span className="text-sm cursor-pointer">{topic.title}</span>
      </div>
    );
  };

  const renderChapter = (chapter: Chapter, level: number) => {
    const isExpanded = expandedItems.has(chapter.id);
    const hasChildren = chapter.topics && chapter.topics.length > 0;
    const indent = level * 24;
    const checkState = getCheckState(chapter);

    return (
      <div key={chapter.id}>
        <div
          className="flex items-center py-1 hover:bg-gray-50"
          style={{ paddingLeft: `${indent}px` }}
        >
          <div
            className="cursor-pointer"
            onClick={() => hasChildren && toggleExpanded(chapter.id)}
          >
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
          <div
            className="flex items-center cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              handleCheckboxChange(chapter.id, chapter);
            }}
          >
            <IndeterminateCheckbox checkState={checkState} />
          </div>
          <span className="text-sm font-medium cursor-pointer">{chapter.title}</span>
        </div>

        {hasChildren && isExpanded && (
          <div>
            {chapter.topics.map((topic) => renderTopic(topic, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const renderBook = (book: Book) => {
    const isExpanded = expandedItems.has(book.id);
    const hasChildren = book.chapters && book.chapters.length > 0;
    const checkState = getCheckState(book);

    return (
      <div key={book.id}>
        <div
          className="flex items-center py-2 hover:bg-gray-50"
        >
          <div
            className="cursor-pointer"
            onClick={() => hasChildren && toggleExpanded(book.id)}
          >
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
          <div
            className="flex items-center cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              handleCheckboxChange(book.id, book);
            }}
          >
            <IndeterminateCheckbox checkState={checkState} />
          </div>
          <span className="text-sm font-semibold cursor-pointer">{book.title}</span>
        </div>

        {hasChildren && isExpanded && (
          <div>
            {book.chapters.map((chapter) => renderChapter(chapter, 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="border border-gray-300 rounded-lg p-4 bg-white">
      <div className="space-y-1">
        {data.map((book) => renderBook(book))}
      </div>
    </div>
  );
}

export default ChapterTree;
