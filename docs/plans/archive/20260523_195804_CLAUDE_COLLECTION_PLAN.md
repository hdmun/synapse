# Claude 세션 데이터 수집 계획 (cc-lens 분석 기반)

## 1. cc-lens 프로젝트 분석 요약
`cc-lens`는 Claude Code CLI의 로컬 데이터를 분석하는 대시보드 프로젝트입니다.
Claude Code는 데이터를 로컬(`~/.claude/`)에 저장하며, 주요 데이터 소스는 다음과 같습니다.
*   **세션 데이터 (Primary):** `~/.claude/projects/<slug>/*.jsonl`
    *   각 `.jsonl` 파일은 하나의 세션(대화)을 나타냅니다. (파일명이 `session_id`와 대응)
    *   내부에는 `system`, `user`, `assistant`, `summary` 등 각 턴(turn) 단위의 이벤트가 JSON 형태로 기록됩니다.
    *   `assistant` 타입의 데이터에는 모델 사용량(`usage`), 생각(`thinking`), 도구 호출(`tool_calls`), 응답 텍스트 등의 정보가 포함됩니다.
    *   `system` 이벤트 중 `cwd` 속성 등을 통해 프로젝트 경로를 유추할 수 있습니다.
*   **메타데이터 (Fallback):** `~/.claude/usage-data/session-meta/*.json`
*   **전체 통계:** `~/.claude/stats-cache.json`

## 2. Synapse 프로젝트 적용 목표
Synapse 시스템에서 기존에 수집 중인 `gemini`, `copilot`, `codex` 와 동일하게 `claude` (Claude Code)의 세션 데이터를 `UnifiedSession` 형태로 수집하기 위해 `ClaudeCollector`를 구현합니다.

## 3. 구현 단계 및 서브 에이전트 활용 계획

### 단계 1: 타입 확장 (`src/backend/services/collectors/types.ts`)
*   `UnifiedSession`의 `source` 리터럴 타입에 `'claude'` 추가.
*   (실행) 범위가 작고 명확하므로 메인 에이전트가 직접 수행.

### 단계 2: `ClaudeCollector` 클래스 구현 (`src/backend/services/collectors/claude.collector.ts`)
*   `BaseCollector`를 상속받아 구현.
*   **Target Directory:** `~/.claude/projects/` 디렉토리를 감시.
*   **Initial Scan:** `chokidar` 시작 전 기존 `**/*.jsonl` 파일들을 스캔하여 파싱.
*   **Parsing Logic:**
    *   `.jsonl` 파일이 추가되거나 변경될 때 라인별로 JSON 파싱.
    *   `user` 타입 메시지의 `content`, `assistant` 타입 메시지의 `content`, `usage`, `tool_calls`, `thinking` 등을 파싱.
    *   이를 Synapse의 `UnifiedMessage` 포맷으로 변환.
    *   `session-update` 이벤트 발생 (Debounce 적용).
*   (실행) 로직이 복잡하므로 `generalist` 서브 에이전트를 호출하여 초안을 작성하고 파일 시스템과 통합 테스트를 진행하도록 위임.

### 단계 3: Collector 등록
*   생성한 `ClaudeCollector`를 기존 콜렉터 초기화 로직에 추가하고 `~/.claude/projects` 경로를 주입.
*   (실행) 메인 에이전트가 직접 수행.

### 단계 4: 단위 테스트 작성 및 검증
*   `claude.collector.test.ts` 작성.
*   가상의 `.jsonl` 파일을 생성하여 콜렉터가 정상적으로 `session-update` 이벤트를 발생시키고 `UnifiedSession` 객체가 올바른 구조를 가지는지 테스트.
*   (실행) `generalist` 서브 에이전트를 호출하여 테스트 파일 작성 및 실행을 위임.

## 4. 데이터 매핑 전략 (Claude Code JSONL -> UnifiedSession)
*   `id`: `.jsonl` 파일의 이름 (확장자 제외).
*   `source`: `'claude'`
*   `projectPath`: `.jsonl`의 `system` 라인에서 `cwd`를 추출.
*   `messages`:
    *   `type`: 'user' | 'agent' | 'info' | 'error'
    *   `content`: `text` 필드 추출.
    *   `inputTokens`, `outputTokens`, `thoughtTokens`: `assistant` 라인의 `usage` 데이터 추출.
    *   `thoughts`: `thinking` 노드 정보 추출.
    *   `toolCalls`: `tool_use` 노드 정보 추출.

## 5. 진행 방식
서브 에이전트(`generalist`)를 통해 복잡한 파서 작성 및 테스트 작성을 병렬 혹은 순차적으로 위임하여 효율성을 극대화합니다.
