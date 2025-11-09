/**
 * CSV 파싱 유틸리티
 */

/**
 * CSV 라인을 파싱하여 배열로 변환 (quoted fields 처리)
 * @param line - CSV 라인 문자열
 * @returns 파싱된 값 배열
 */
function parseCSVLine(line: string): string[] {
  const values: string[] = [];
  let currentValue = '';
  let insideQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      // Handle escaped quotes ("")
      if (insideQuotes && nextChar === '"') {
        currentValue += '"';
        i++; // Skip the next quote
      } else {
        // Toggle quote state
        insideQuotes = !insideQuotes;
      }
    } else if (char === ',' && !insideQuotes) {
      // Field separator (only when not inside quotes)
      values.push(currentValue.trim());
      currentValue = '';
    } else {
      currentValue += char;
    }
  }

  // Push the last value
  values.push(currentValue.trim());

  return values;
}

/**
 * CSV 텍스트를 파싱하여 객체 배열로 변환
 * @param csvText - CSV 텍스트 문자열
 * @returns 파싱된 객체 배열
 */
export function parseCSV(csvText: string): Record<string, string>[] {
  const lines = csvText.trim().split('\n');

  if (lines.length === 0) {
    return [];
  }

  // 첫 번째 줄을 헤더로 사용
  const headers = parseCSVLine(lines[0]);

  // 나머지 줄을 데이터로 파싱
  const data: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);

    if (values.length === headers.length) {
      const row: Record<string, string> = {};
      headers.forEach((header, index) => {
        row[header] = values[index];
      });
      data.push(row);
    }
  }

  return data;
}

/**
 * CSV에서 특정 컬럼의 True 값 개수를 계산
 * @param csvText - CSV 텍스트 문자열
 * @param columnName - 카운트할 컬럼명
 * @returns True 값의 개수
 */
export function countTrueValues(csvText: string, columnName: string): number {
  const data = parseCSV(csvText);

  const trueCount = data.filter(row => {
    const value = row[columnName];
    return value === 'True' || value === 'true' || value === 'TRUE';
  }).length;

  return trueCount;
}
