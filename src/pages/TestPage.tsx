import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import CurriculumTagInput from '../components/tag-input/CurriculumTagInput/CurriculumTagInput';

function TestPage() {
  useAuth(); // 인증 체크

  const [selectedTags, setSelectedTags] = useState<{
    ids: string[];
    labels: string[];
  } | null>(null);

  const handleSelect = (tagIds: string[], tagLabels: string[]) => {
    setSelectedTags({ ids: tagIds, labels: tagLabels });
    console.log('Selected tagIds:', tagIds);
    console.log('Selected tagLabels:', tagLabels);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">테스트 페이지</h1>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold text-gray-900 mb-4">단원 태그 입력기</h2>
        <CurriculumTagInput onSelect={handleSelect} />

        {selectedTags && (
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">선택된 태그</h3>
            <div className="space-y-2">
              <div>
                <span className="font-semibold">Tag IDs:</span>
                <code className="ml-2 text-blue-600">
                  [{selectedTags.ids.map((id) => `'${id}'`).join(', ')}]
                </code>
              </div>
              <div>
                <span className="font-semibold">Tag Labels:</span>
                <code className="ml-2 text-blue-600">
                  [{selectedTags.labels.map((label) => `'${label}'`).join(', ')}]
                </code>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default TestPage;
