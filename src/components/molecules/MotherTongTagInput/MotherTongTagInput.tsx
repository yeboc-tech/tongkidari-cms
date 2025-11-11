import CurriculumTagInput from '../../tag-input/CurriculumTagInput/CurriculumTagInput';
import { 마더텅_단원_태그 } from '../../../ssot/마더텅_단원_태그';

export interface SelectedTag {
  tagIds: string[];
  tagLabels: string[];
}

export interface MotherTongTagInputProps {
  onSelect: (tag: SelectedTag | null) => void;
  placeholder?: string;
  value?: SelectedTag | null;
}

function MotherTongTagInput({ onSelect, placeholder = '마더텅 경제 단원 태그', value }: MotherTongTagInputProps) {
  return <CurriculumTagInput data={마더텅_단원_태그} onSelect={onSelect} placeholder={placeholder} value={value} />;
}

export default MotherTongTagInput;
