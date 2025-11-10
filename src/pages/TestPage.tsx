import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import CurriculumTagInput from '../components/tag-input/CurriculumTagInput/CurriculumTagInput';

interface SelectedTag {
  tagIds: string[];
  tagLabels: string[];
}

function TestPage() {
  useAuth(); // 인증 체크

  const [selectedTag1, setSelectedTag1] = useState<SelectedTag | null>(null);
  const [selectedTag2, setSelectedTag2] = useState<SelectedTag | null>(null);

  const handleSelect1 = (tag: SelectedTag | null) => {
    setSelectedTag1(tag);
    console.log('Selected tag 1:', tag);
  };

  const handleSelect2 = (tag: SelectedTag | null) => {
    setSelectedTag2(tag);
    console.log('Selected tag 2:', tag);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">테스트 페이지</h1>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold text-gray-900 mb-4">자세한통사 단원 태그 입력기 #1</h2>
        <CurriculumTagInput onSelect={handleSelect1} />

        {selectedTag1 && (
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">선택된 태그</h3>
            <div className="space-y-2">
              <div>
                <span className="font-semibold">Tag IDs:</span>
                <code className="ml-2 text-blue-600">[{selectedTag1.tagIds.map((id) => `'${id}'`).join(', ')}]</code>
              </div>
              <div>
                <span className="font-semibold">Tag Labels:</span>
                <code className="ml-2 text-blue-600 text-xs">
                  [{selectedTag1.tagLabels.map((label) => `'${label}'`).join(', ')}]
                </code>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold text-gray-900 mb-4">자세한통사 단원 태그 입력기 #2</h2>
        <CurriculumTagInput onSelect={handleSelect2} />

        {selectedTag2 && (
          <div className="mt-6 p-4 bg-green-50 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">선택된 태그</h3>
            <div className="space-y-2">
              <div>
                <span className="font-semibold">Tag IDs:</span>
                <code className="ml-2 text-green-600">[{selectedTag2.tagIds.map((id) => `'${id}'`).join(', ')}]</code>
              </div>
              <div>
                <span className="font-semibold">Tag Labels:</span>
                <code className="ml-2 text-green-600 text-xs">
                  [{selectedTag2.tagLabels.map((label) => `'${label}'`).join(', ')}]
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
