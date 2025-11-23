/**
 * ChapterStore Context
 *
 * SSOT 테이블에서 조회한 Chapter 데이터를 전역으로 관리
 */

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Supabase } from '../api/Supabase';
import type { Chapter } from '../ssot/types';

// Context 타입 정의
interface ChapterStore {
  [key: string]: Chapter | undefined;
}

interface ChapterStoreContextType {
  chapters: ChapterStore;
  loading: boolean;
  error: Error | null;
  getChapter: (key: string) => Chapter | undefined;
  loadChapters: (keys: string[]) => Promise<void>;
}

// Context 생성
const ChapterStoreContext = createContext<ChapterStoreContextType | undefined>(undefined);

// Provider Props
interface ChapterStoreProviderProps {
  children: ReactNode;
  preloadKeys?: string[]; // 미리 로드할 키 목록
}

/**
 * ChapterStore Provider
 * 애플리케이션 최상위에서 Chapter 데이터를 미리 로드하고 관리
 */
export function ChapterStoreProvider({ children, preloadKeys = [] }: ChapterStoreProviderProps) {
  const [chapters, setChapters] = useState<ChapterStore>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Chapter 조회 함수
  const getChapter = (key: string): Chapter | undefined => {
    return chapters[key];
  };

  // 여러 Chapter를 한 번에 로드
  const loadChapters = async (keys: string[]) => {
    if (keys.length === 0) return;

    // 이미 로드된 키 필터링
    const keysToLoad = keys.filter(key => !chapters[key]);
    if (keysToLoad.length === 0) return;

    setLoading(true);
    setError(null);

    try {
      const records = await Supabase.SSOT.fetchByKeys(keysToLoad);

      // 레코드를 ChapterStore 형식으로 변환
      const newChapters: ChapterStore = {};
      records.forEach(record => {
        newChapters[record.key] = record.value as Chapter;
      });

      setChapters(prev => ({
        ...prev,
        ...newChapters,
      }));
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to load chapters');
      setError(error);
      console.error('Error loading chapters:', error);
    } finally {
      setLoading(false);
    }
  };

  // 초기 로드 (preloadKeys가 제공된 경우)
  useEffect(() => {
    if (preloadKeys.length > 0) {
      loadChapters(preloadKeys);
    }
  }, []); // preloadKeys는 초기에만 사용

  const value: ChapterStoreContextType = {
    chapters,
    loading,
    error,
    getChapter,
    loadChapters,
  };

  return (
    <ChapterStoreContext.Provider value={value}>
      {children}
    </ChapterStoreContext.Provider>
  );
}

/**
 * ChapterStore Hook
 * 컴포넌트에서 ChapterStore를 사용하기 위한 훅
 */
export function useChapterStore() {
  const context = useContext(ChapterStoreContext);
  if (context === undefined) {
    throw new Error('useChapterStore must be used within ChapterStoreProvider');
  }
  return context;
}
