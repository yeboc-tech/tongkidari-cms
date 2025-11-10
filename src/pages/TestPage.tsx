import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import CurriculumTagInput from '../components/tag-input/CurriculumTagInput/CurriculumTagInput';
import CustomTagInput from '../components/tag-input/CustomTagInput/CustomTagInput';
import { 자세한통합사회_단원_태그 } from '../ssot/curriculumStructure';
import { 마더텅_단원_태그 } from '../ssot/마더텅_단원_태그';

interface SelectedTag {
  tagIds: string[];
  tagLabels: string[];
}

function TestPage() {
  useAuth(); // 인증 체크

  const [selectedMadertongTag, setSelectedMadertongTag] = useState<SelectedTag | null>(null);
  const [selectedIntegratedTag, setSelectedIntegratedTag] = useState<SelectedTag | null>(null);
  const [customTags, setCustomTags] = useState<string[]>([]);

  const handleSelectMadertong = (tag: SelectedTag | null) => {
    setSelectedMadertongTag(tag);
    console.log('Selected 마더텅 tag:', tag);
  };

  const handleSelectIntegrated = (tag: SelectedTag | null) => {
    setSelectedIntegratedTag(tag);
    console.log('Selected 자세한통사 tag:', tag);
  };

  const handleCustomTagsChange = (tags: string[]) => {
    setCustomTags(tags);
    console.log('Custom tags:', tags);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">테스트 페이지</h1>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold text-gray-900 mb-4">마더텅 경제 단원 태그 입력기</h2>
        <CurriculumTagInput data={마더텅_단원_태그} onSelect={handleSelectMadertong} />

        {selectedMadertongTag && (
          <div className="mt-6 p-4 bg-purple-50 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">선택된 태그</h3>
            <div className="space-y-2">
              <div>
                <span className="font-semibold">Tag IDs:</span>
                <code className="ml-2 text-purple-600">[{selectedMadertongTag.tagIds.map((id) => `'${id}'`).join(', ')}]</code>
              </div>
              <div>
                <span className="font-semibold">Tag Labels:</span>
                <code className="ml-2 text-purple-600 text-xs">
                  [{selectedMadertongTag.tagLabels.map((label) => `'${label}'`).join(', ')}]
                </code>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold text-gray-900 mb-4">자세한통사 단원 태그 입력기</h2>
        <CurriculumTagInput data={자세한통합사회_단원_태그} onSelect={handleSelectIntegrated} />

        {selectedIntegratedTag && (
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">선택된 태그</h3>
            <div className="space-y-2">
              <div>
                <span className="font-semibold">Tag IDs:</span>
                <code className="ml-2 text-blue-600">[{selectedIntegratedTag.tagIds.map((id) => `'${id}'`).join(', ')}]</code>
              </div>
              <div>
                <span className="font-semibold">Tag Labels:</span>
                <code className="ml-2 text-blue-600 text-xs">
                  [{selectedIntegratedTag.tagLabels.map((label) => `'${label}'`).join(', ')}]
                </code>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold text-gray-900 mb-4">커스텀 태그 입력기</h2>
        <CustomTagInput onTagsChange={handleCustomTagsChange} />

        {customTags.length > 0 && (
          <div className="mt-6 p-4 bg-green-50 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">선택된 태그들</h3>
            <div className="flex flex-wrap gap-2">
              {customTags.map((tag, index) => (
                <code key={index} className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                  {tag}
                </code>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default TestPage;
