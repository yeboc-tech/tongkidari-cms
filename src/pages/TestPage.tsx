import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import CurriculumTagInput from '../components/tag-input/CurriculumTagInput/CurriculumTagInput';

interface SelectedTag {
  tagIds: string[];
  tagLabels: string[];
}

function TestPage() {
  useAuth(); // 인증 체크

  const [selectedTags1, setSelectedTags1] = useState<SelectedTag[]>([]);
  const [selectedTags2, setSelectedTags2] = useState<SelectedTag[]>([]);

  const handleSelect1 = (tags: SelectedTag[]) => {
    setSelectedTags1(tags);
    console.log('Selected tags 1:', tags);
  };

  const handleSelect2 = (tags: SelectedTag[]) => {
    setSelectedTags2(tags);
    console.log('Selected tags 2:', tags);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">테스트 페이지</h1>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold text-gray-900 mb-4">단원 태그 입력기 #1</h2>
        <CurriculumTagInput onSelect={handleSelect1} />

        {selectedTags1.length > 0 && (
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">선택된 태그들</h3>
            <div className="space-y-4">
              {selectedTags1.map((tag, index) => (
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

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold text-gray-900 mb-4">단원 태그 입력기 #2</h2>
        <CurriculumTagInput onSelect={handleSelect2} />

        {selectedTags2.length > 0 && (
          <div className="mt-6 p-4 bg-green-50 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">선택된 태그들</h3>
            <div className="space-y-4">
              {selectedTags2.map((tag, index) => (
                <div key={index} className="space-y-2 pb-4 border-b border-green-200 last:border-b-0 last:pb-0">
                  <div>
                    <span className="font-semibold">Tag {index + 1} IDs:</span>
                    <code className="ml-2 text-green-600">
                      [{tag.tagIds.map((id) => `'${id}'`).join(', ')}]
                    </code>
                  </div>
                  <div>
                    <span className="font-semibold">Tag {index + 1} Labels:</span>
                    <code className="ml-2 text-green-600 text-xs">
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
