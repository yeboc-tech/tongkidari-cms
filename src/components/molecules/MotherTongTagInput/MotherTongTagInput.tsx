import CurriculumTagInput from '../../tag-input/CurriculumTagInput/CurriculumTagInput';
import { 마더텅_단원_태그 } from '../../../ssot/마더텅_단원_태그';

export interface SelectedTag {
  tagIds: string[];
  tagLabels: string[];
}

export interface MotherTongTagInputProps {
  subject?: string;
  onSelect: (tag: SelectedTag | null) => void;
  placeholder?: string;
  value?: SelectedTag | null;
}

function MotherTongTagInput({ subject, onSelect, placeholder, value }: MotherTongTagInputProps) {
  // subject가 주어지면 해당 과목의 데이터만 필터링, 없으면 전체 데이터 사용
  const filteredData = subject ? 마더텅_단원_태그.filter((book) => book.id === subject) : 마더텅_단원_태그;

  // subject에 따른 기본 placeholder
  const defaultPlaceholder = subject ? `MT ${subject} 단원 태그` : 'MT 단원 태그';

  return (
    <CurriculumTagInput
      data={filteredData}
      onSelect={onSelect}
      placeholder={placeholder || defaultPlaceholder}
      value={value}
      color="#e34f6e"
    />
  );
}

export default MotherTongTagInput;
