import CurriculumTagInput from '../../tag-input/CurriculumTagInput/CurriculumTagInput';
import { 자세한통합사회_단원_태그 } from '../../../ssot/curriculumStructure';

export interface SelectedTag {
  tagIds: string[];
  tagLabels: string[];
}

export interface DetailTongsaTagInputProps {
  onSelect: (tag: SelectedTag | null) => void;
  placeholder?: string;
  value?: SelectedTag | null;
}

function DetailTongsaTagInput({
  onSelect,
  placeholder = '자세한통사 단원 태그',
  value,
}: DetailTongsaTagInputProps) {
  return (
    <CurriculumTagInput
      data={자세한통합사회_단원_태그}
      onSelect={onSelect}
      placeholder={placeholder}
      value={value}
      color="#10b981"
    />
  );
}

export default DetailTongsaTagInput;
