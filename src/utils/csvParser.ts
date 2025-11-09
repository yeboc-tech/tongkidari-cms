/**
 * CSV 파싱 유틸리티
 */

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
  const headers = lines[0].split(',').map(header => header.trim());

  // 나머지 줄을 데이터로 파싱
  const data: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(value => value.trim());

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

  return data.filter(row => {
    const value = row[columnName];
    return value === 'True' || value === 'true' || value === 'TRUE';
  }).length;
}
