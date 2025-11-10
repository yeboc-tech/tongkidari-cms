import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import CurriculumTagInput from '../components/tag-input/CurriculumTagInput/CurriculumTagInput';

interface SelectedTag {
  tagIds: string[];
  tagLabels: string[];
}

function TestPage() {
  useAuth(); // 인증 체크

  const [selectedTags, setSelectedTags] = useState<SelectedTag[]>([]);

  const handleSelect = (tags: SelectedTag[]) => {
    setSelectedTags(tags);
    console.log('Selected tags:', tags);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">테스트 페이지</h1>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold text-gray-900 mb-4">단원 태그 입력기</h2>
        <CurriculumTagInput onSelect={handleSelect} />

        {selectedTags.length > 0 && (
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">선택된 태그들</h3>
            <div className="space-y-4">
              {selectedTags.map((tag, index) => (
                <div key={index} className="space-y-2 pb-4 border-b border-blue-200 last:border-b-0 last:pb-0">
                  <div>
                    <span className="font-semibold">Tag {index + 1} IDs:</span>
                    <code className="ml-2 text-blue-600">
                      [{tag.tagIds.map((id) => `'${id}'`).join(', ')}]
                    </code>
                  </div>
                  <div>
                    <span className="font-semibold">Tag {index + 1} Labels:</span>
                    <code className="ml-2 text-blue-600 text-xs">
                      [{tag.tagLabels.map((label) => `'${label}'`).join(', ')}]
                    </code>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default TestPage;
