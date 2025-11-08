# ID 명세서 (ID Specification)

EBS PDF 문제 세그멘테이션 시스템의 고유 ID 생성 규칙

## ID 계층 구조 (3-Level Hierarchy)

본 시스템은 **3-Level 계층 구조**의 ID 체계를 사용합니다:

```
Level 1: exam_id (시험 ID)
  └─ Level 2: problem_id (문제 ID)
      └─ Level 3: image_id (이미지 ID)
```

### 계층별 관계

- **1개 시험 (exam)** → **20개 문제 (problems)**: 1번~20번
- **1개 문제 (problem)** → **2개 이미지 (images)**: 문제, 해설
- **1개 시험** → **최대 40개 이미지** (20문제 × 2종류)

---

## Level 1: exam_id (시험 ID)

### 형식
```
{subject}_{target}_{year}_{month}_{exam_type}(region)?
```

### 구성 요소

| 요소 | 설명 | 형식 | 예시 |
|------|------|------|------|
| `subject` | 과목명 | 한글 + 로마자 숫자 | `사회문화`, `물리학Ⅰ`, `화학Ⅱ` |
| `target` | 대상 학년 | 고1/고2/고3 | `고1`, `고2`, `고3` |
| `year` | 연도 | 4자리 숫자 | `2017`, `2021`, `2025` |
| `month` | 월 | 2자리 숫자 (zero-padded) | `03`, `07`, `09`, `11` |
| `exam_type` | 시험 유형 | 정규화된 이름 | `모평`, `학평`, `수능` |
| `region` | 지역 (선택) | 한글 | `서울`, `인천`, `평가원` |

### 예시
```
사회문화_고3_2024_06_모평
경제_고3_2025_03_학평(서울)
정치와법_고3_2023_11_수능
물리학Ⅰ_고3_2024_09_모평
```

### 의미
- 하나의 시험지 전체를 식별합니다
- 동일한 exam_id를 가진 문제들은 같은 시험에 속합니다
- 시험별 통계 집계, 문제 조회 등에 사용됩니다

---

## Level 2: problem_id (문제 ID)

### 형식
```
{exam_id}_{problem_number}
```

### 구성 요소

| 요소 | 설명 | 형식 | 예시 |
|------|------|------|------|
| `exam_id` | 시험 ID (Level 1) | exam_id 형식 | `사회문화_고3_2024_06_모평` |
| `problem_number` | 문제 번호 | 1-20 | `1`, `2`, ..., `20` |

### 예시
```
사회문화_고3_2024_06_모평_5
경제_고3_2025_03_학평(서울)_12
정치와법_고3_2023_11_수능_20
물리학Ⅰ_고3_2024_09_모평_1
```

### 의미
- 시험지 내의 특정 문제를 식별합니다
- 문제별 난이도, 정답률 등 메타데이터 연결에 사용됩니다
- 문제와 관련된 모든 자료(문제지 + 해설지) 조회에 사용됩니다

---

## Level 3: image_id (이미지 ID)

### 형식
```
{problem_id}_{doc_type}
```

### 구성 요소

| 요소 | 설명 | 형식 | 예시 |
|------|------|------|------|
| `problem_id` | 문제 ID (Level 2) | problem_id 형식 | `사회문화_고3_2024_06_모평_5` |
| `doc_type` | 문서 타입 | 문제 또는 해설 | `문제`, `해설` |

### 예시
```
사회문화_고3_2024_06_모평_5_문제
사회문화_고3_2024_06_모평_5_해설
경제_고3_2025_03_학평(서울)_12_문제
경제_고3_2025_03_학평(서울)_12_해설
```

### 의미
- 문제의 문제지 또는 해설지 이미지를 식별합니다
- 실제 이미지 파일명으로 사용됩니다 (`.png` 확장자)
- 파일 시스템에서 이미지 파일을 직접 찾는 데 사용됩니다

---

## 구성 요소 상세 규칙

### 1. 과목명 (subject)
- 한글 1개 이상 필수
- 로마자 숫자(Ⅰ, Ⅱ, Ⅲ, ..., Ⅹ) 0개 이상 선택
- **띄어쓰기 제거** 필수
- 예시:
  - 사회 탐구
    - `생활과윤리`, `윤리와사상`, `한국지리`, `세계지리`
    - `동아시아사`, `세계사`, `경제`, `정치와법`, `사회문화`
  - 과학 탐구
    - `물리학Ⅰ`, `화학Ⅱ`, `생명과학Ⅰ`, `지구과학Ⅱ`

### 2. 연도 (year)
- 원본: 4자리 또는 2자리
- 정규화: 4자리로 변환
- 검증 범위: 2010-2035
- 예시:
  - `2017` → `2017`
  - `21` → `2021`

### 3. 월 (month)
- 원본: 1-2자리 숫자
- 정규화: **2자리로 zero-padding**
- 검증 범위: 1-12
- 수능의 경우 자동으로 `11`로 설정
- 예시:
  - `3` → `03`
  - `7` → `07`
  - `09` → `09`

### 4. 대상 학년 (target)
- 고정 형식: `고1`, `고2`, `고3`
- 검증: 3가지 값 중 하나
- Phase 4에서는 기본값 `고3` 사용

### 5. 시험 유형 (exam_type)
- 원본: 약칭 또는 전체 이름
- 정규화 매핑:
  - `모평`, `모의평가`, `평가원` → `모평`
  - `학평`, `학력평가` → `학평`
  - `수능`, `대수능` → `수능`
- **Phase 2와 Phase 4의 차이:**
  - Phase 2 (EBS): `모의평가`, `학력평가`, `수능` (전체 이름)
  - Phase 4 (라벨링): `모평`, `학평`, `수능` (약칭)

### 6. 지역 (region) - 선택 사항
- 시험 유형 뒤에 괄호로 표시: `시험유형(지역)`
- 지역이 있는 경우: ID에 포함
- 지역이 없는 경우: 생략
- 예시:
  - `학평(서울)` → exam_id에 `학평(서울)` 포함
  - `학평(인천)` → exam_id에 `학평(인천)` 포함
  - `모평` → 지역 없음 (괄호 없음)

### 7. 문제 번호 (problem_number)
- 고정 범위: **1-20**
- 형식: 정수
- 모든 시험은 1번~20번 문제로 구성

### 8. 문서 타입 (doc_type)
- 고정 값: `문제` 또는 `해설`
- `문제`: 문제지 이미지
- `해설`: 해설지 이미지

---

## ID 계층 예시

### 예시 1: 2024년 6월 모평 사회문화

```
Level 1 (exam_id):
  사회문화_고3_2024_06_모평

Level 2 (problem_id):
  사회문화_고3_2024_06_모평_1
  사회문화_고3_2024_06_모평_2
  ...
  사회문화_고3_2024_06_모평_20

Level 3 (image_id):
  사회문화_고3_2024_06_모평_1_문제
  사회문화_고3_2024_06_모평_1_해설
  사회문화_고3_2024_06_모평_2_문제
  사회문화_고3_2024_06_모평_2_해설
  ...
  사회문화_고3_2024_06_모평_20_문제
  사회문화_고3_2024_06_모평_20_해설
```

### 예시 2: 2025년 3월 학평(서울) 경제

```
Level 1 (exam_id):
  경제_고3_2025_03_학평(서울)

Level 2 (problem_id):
  경제_고3_2025_03_학평(서울)_1
  경제_고3_2025_03_학평(서울)_2
  ...
  경제_고3_2025_03_학평(서울)_20

Level 3 (image_id):
  경제_고3_2025_03_학평(서울)_1_문제
  경제_고3_2025_03_학평(서울)_1_해설
  경제_고3_2025_03_학평(서울)_2_문제
  경제_고3_2025_03_학평(서울)_2_해설
  ...
  경제_고3_2025_03_학평(서울)_20_문제
  경제_고3_2025_03_학평(서울)_20_해설
```

### 예시 3: 2023년 수능 물리학Ⅰ

```
Level 1 (exam_id):
  물리학Ⅰ_고3_2023_11_수능

Level 2 (problem_id):
  물리학Ⅰ_고3_2023_11_수능_1
  물리학Ⅰ_고3_2023_11_수능_2
  ...
  물리학Ⅰ_고3_2023_11_수능_20

Level 3 (image_id):
  물리학Ⅰ_고3_2023_11_수능_1_문제
  물리학Ⅰ_고3_2023_11_수능_1_해설
  ...
```

---

## 파일명 파싱 규칙 (Phase 2 - EBS)

### 정규식 패턴
```regex
(\d{4})년_(고[123])_(\d{1,2})월.*?(모평|학평|수능)(?:\(([가-힣]+)\))?[^_]*?_([가-힣]+[Ⅰ-Ⅹ]*)_(문제|해설)
```

### 그룹 매핑
1. 그룹 1: 연도 (year)
2. 그룹 2: 대상 학년 (target)
3. 그룹 3: 월 (month)
4. 그룹 4: 시험 유형 (exam_type)
5. 그룹 5: 지역 (region) - 선택 사항
6. 그룹 6: 과목명 (subject)
7. 그룹 7: 문서 타입 (doc_type)

---

## 라벨 파싱 규칙 (Phase 4 - 라벨링)

### 라벨 형식
```
[{year}년 {month}월 {exam_type} {problem_number}번]
```

### 예시
```
[2023년 10월 학평 1번]
[2024년 6월 모평 5번]
[2023년 수능 12번]
```

### 유효성 검증
- **필수**: 4자리 연도가 반드시 하나 있어야 함
- **월 추출**: "X월" 패턴에서 추출 (수능은 자동으로 11월)
- **시험 유형**: 학평, 모평, 수능 중 하나
- **문제 번호**: "X번" 패턴에서 추출

---

## 출력 파일 구조

### Phase 2 (EBS) - 디렉토리 구조
```
output/ebs/
├── {subject}/
│   ├── {image_id}.png
│   ├── 문제.csv
│   ├── 해설.csv
│   └── debug/
│       └── {subject}_{target}_{year}_{month}_{exam_type}(region)?_{doc_type}_page_{n}_debug.png
```

### Phase 4 (라벨링) - 디렉토리 구조
```
output/phase4/
├── {folder_name}_labeling/
│   ├── {folder_name}_labeling.csv
│   └── _debug/
│       └── debug_{original_image_name}
```

### 예시
```
output/ebs/
├── 사회문화/
│   ├── 사회문화_고3_2025_03_학평(서울)_1_문제.png
│   ├── 사회문화_고3_2025_03_학평(서울)_1_해설.png
│   ├── 사회문화_고3_2025_03_학평(서울)_2_문제.png
│   ├── ...
│   ├── 문제.csv
│   ├── 해설.csv
│   └── debug/
│       ├── 사회문화_고3_2025_03_학평(서울)_문제_page_1_debug.png
│       └── 사회문화_고3_2025_03_학평(서울)_문제_page_2_debug.png
```

---

## CSV 출력 형식

### Phase 2 (EBS) - 컬럼 구조
```csv
problem_number,id,has_image,image_path,page,subject,source_pdf
```

### Phase 4 (라벨링) - 컬럼 구조
```csv
id,subject,year,month,target,exam_type,region,problem_number,대단원,소단원,input_image_path,original_text
```

### 예시 (Phase 2)
```csv
problem_number,id,has_image,image_path,page,subject,source_pdf
1,사회문화_고3_2025_03_학평(서울)_1_문제,True,output/ebs/사회문화/사회문화_고3_2025_03_학평(서울)_1_문제.png,0,사회문화,2025년_고3_3월_학평(서울)_사회문화_문제.pdf
2,사회문화_고3_2025_03_학평(서울)_2_문제,True,output/ebs/사회문화/사회문화_고3_2025_03_학평(서울)_2_문제.png,0,사회문화,2025년_고3_3월_학평(서울)_사회문화_문제.pdf
```

### 예시 (Phase 4)
```csv
id,subject,year,month,target,exam_type,region,problem_number,대단원,소단원,input_image_path,original_text
사회문화_고3_2023_10_학평_1_문제,사회문화,2023,10,고3,학평,,1,사회문화의 이해,사회문화 현상의 이해,/path/to/71-72.jpeg,2023년 10월 학평 1번
```

---

## 코드 구현

### exam_id 생성 (Phase 2 - EBS)
```python
# id_prefix가 곧 exam_id
id_prefix = f"{subject}_{target}_{year}_{month}_{exam_type}"
if region:
    id_prefix = f"{subject}_{target}_{year}_{month}_{exam_type}({region})"

# exam_id 예시: 사회문화_고3_2024_06_모평
```

### problem_id 생성
```python
# exam_id + 문제번호
problem_id = f"{exam_id}_{problem_number}"

# problem_id 예시: 사회문화_고3_2024_06_모평_5
```

### image_id 생성 (Phase 2 - EBS)
```python
# problem_id + 문서타입
image_id = f"{problem_id}_{doc_type}"

# image_id 예시: 사회문화_고3_2024_06_모평_5_문제
```

### image_id 생성 (Phase 4 - 라벨링)
```python
def generate_id(subject, year, month, target, exam_type, region, problem_number, doc_type='문제'):
    id_parts = [subject, target, year, month, exam_type]

    if region:
        id_parts[-1] = f"{exam_type}({region})"

    id_parts.extend([problem_number, doc_type])

    return '_'.join(id_parts)

# 사용 예시
image_id = generate_id('사회문화', '2023', '10', '고3', '학평', '', '1', '문제')
# 결과: 사회문화_고3_2023_10_학평_1_문제
```

---

## ID 사용 시나리오

### 1. 시험 단위 조회 (exam_id 사용)
```python
exam_id = "사회문화_고3_2024_06_모평"

# 해당 시험의 모든 문제 조회
problems = db.query(f"SELECT * FROM problems WHERE id LIKE '{exam_id}_%'")

# 시험별 통계
stats = calculate_exam_stats(exam_id)
```

### 2. 문제 단위 조회 (problem_id 사용)
```python
problem_id = "사회문화_고3_2024_06_모평_5"

# 문제와 관련된 모든 이미지 조회
images = db.query(f"SELECT * FROM images WHERE id LIKE '{problem_id}_%'")
# 결과: [문제 이미지, 해설 이미지]

# 문제 메타데이터
metadata = get_problem_metadata(problem_id)
```

### 3. 이미지 직접 조회 (image_id 사용)
```python
image_id = "사회문화_고3_2024_06_모평_5_문제"

# 파일 경로 생성
image_path = f"output/ebs/사회문화/{image_id}.png"

# 이미지 로드
image = load_image(image_path)
```

---

## 검증 규칙

### 필수 키
- `year`, `target`, `month`, `exam_type`, `subject`, `problem_number`, `doc_type`

### 연도 검증
- 범위: 2010 ≤ year ≤ 2035

### 월 검증
- 범위: 1 ≤ month ≤ 12

### 시험 유형 검증
- 허용 값: `모평`, `학평`, `수능` (Phase 4)
- 허용 값: `모의평가`, `학력평가`, `수능` (Phase 2)

### 대상 학년 검증
- 허용 값: `고1`, `고2`, `고3`

### 문제 번호 검증
- 범위: 1 ≤ problem_number ≤ 20

### 문서 타입 검증
- 허용 값: `문제`, `해설`

---

## 주의사항

1. **유니코드 정규화**: 모든 파일명은 NFC 정규화 적용
2. **로마자 숫자**: 유니코드 문자 U+2160 ~ U+2169 (Ⅰ-Ⅹ) 지원
3. **지역 선택성**: 지역이 없는 경우 괄호 없이 ID 생성
4. **월 zero-padding**: 1-9월은 01-09로 변환
5. **시험 유형 정규화**: Phase별로 다른 약칭 사용 (Phase 2: 전체 이름, Phase 4: 약칭)
6. **띄어쓰기 제거**: 과목명에서 띄어쓰기 및 특수문자(·) 제거 필수
7. **계층 구조 유지**: exam_id → problem_id → image_id 순서 준수

---

## 버전 정보

- 문서 버전: 2.0
- 최종 수정일: 2025-10-16
- 주요 변경사항: 3-Level ID 계층 구조 도입 (exam_id, problem_id, image_id)
- 시스템 버전: Phase 2 EBS PDF Segmentation + Phase 4 Labeling
