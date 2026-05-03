# 백엔드 초기 스캔 최적화 계획서

## 1. 개요
현재 백엔드는 구동 시 `GEMINI_TMP_DIR` 내의 모든 파일을 전수 조사하며, 이미 DB에 존재하는 데이터일지라도 무조건 읽기 및 DB 업데이트(`ON CONFLICT DO UPDATE`)를 수행합니다. 파일 수가 많아질수록 서버 시작 시간이 지연되고 불필요한 I/O가 발생하는 문제를 해결하기 위해 파일 메타데이터(수정 시간, 크기) 기반의 증분 스캔 방식을 도입합니다.

## 2. 변경 사항

### 2.1 데이터베이스 스키마 (`src/backend/db/schema.ts`)
- `file_sync_metadata` 테이블 추가
    - `path` (PK): 파일의 절대 경로
    - `last_modified_at`: 파일의 마지막 수정 시간 (mtimeMs)
    - `file_size`: 파일 크기 (bytes)

### 2.2 Watcher 서비스 (`src/backend/services/watcher.ts`)
- `scanInitialFiles` 메서드 수정:
    - 각 파일에 대해 `fs.stat`을 수행하여 현재 메타데이터 획득
    - DB의 `file_sync_metadata`와 비교
    - 변경이 있는 경우에만 `handleFileChange` 호출

### 2.3 Syncer 서비스 (`src/backend/services/syncer.ts`)
- `syncSessionFile`, `syncPlanFile`, `syncToolOutputFile` 메서드 수정:
    - 성공적인 동기화 완료 후 `file_sync_metadata` 테이블에 해당 파일의 최신 메타데이터 기록/업데이트

## 3. 테스트 계획

### 3.1 단위 및 통합 테스트 (`src/backend/services/syncer.test.ts` 등)
- **Case 1: 초기 수집**: 새 파일이 발견되면 DB에 정상적으로 기록되고 메타데이터가 저장되는지 확인.
- **Case 2: 중복 스캔 건너뛰기**: 파일 변경 없이 재시작 시, 동기화 로직이 트리거되지 않는지 확인.
- **Case 3: 변경 감지**: 파일의 수정 시간이나 크기가 변했을 때만 다시 동기화가 일어나는지 확인.

## 4. 에이전트 팀 구성 및 역할
- **Investigator Agent**: 스키마 영향도 분석 및 최적의 인덱스 확인.
- **Implementation Agent**: 실제 코드 수정 (Schema, Watcher, Syncer).
- **Testing Agent**: 테스트 코드 작성 및 검증.
