# 프로젝트 통합 및 에이전트 분리 표시 문제 해결 리팩토링 계획

## 1. 문제 원인 분석 (Root Cause)
코드베이스 조사 및 DB 분석 결과, 동일한 프로젝트가 두 개로 나뉘어 표시되는 근본 원인은 **프로젝트 ID 생성 방식의 불일치 및 경로 정규화 부재**에 있습니다.

1. **식별자(ID) 불일치:** 이전에는 프로젝트 경로의 SHA-256 해시를 ID로 사용했으나, 최근 `SyncManager`(`src/backend/services/sync.manager.ts`)가 도입되면서 `path.basename(projectPath)`를 ID로 사용하기 시작했습니다 (예: `cmux-win` vs `7d3dc76e...`).
2. **경로 대소문자 문제:** Windows 환경에서 에이전트(Gemini, Copilot)에 따라 전달되는 경로의 대소문자가 다를 수 있습니다 (예: `C:\Users\...` vs `c:\users\...`). 이로 인해 고유 식별이 실패하고 중복된 프로젝트 레코드가 `projects` 테이블에 생성되었습니다.
3. **프론트엔드 렌더링:** 프론트엔드(`ProjectList.tsx`)는 DB에서 넘어온 프로젝트 목록을 그대로 순회하므로, DB에 여러 개가 있으면 여러 개로 보여지게 됩니다.

## 2. 리팩토링 계획 (Step-by-Step)

### 단계 1: 프로젝트 식별자(ID) 정규화 적용 (Backend Service)
`SyncManager`에서 ID를 생성하는 로직을 일관되고 강력한 방식으로 통합합니다. 특히 **OS 파일 시스템 특성을 고려하여 안전하게 정규화**합니다.

*   **수정 대상:** `src/backend/services/sync.manager.ts`
*   **변경 내용:** `deriveProjectId` 메서드를 수정하여 절대 경로의 구분자를 통일하고, 대소문자를 구분하지 않는 OS(Windows, macOS)에서만 소문자 변환을 적용한 뒤 해시를 생성합니다.
    ```typescript
    import crypto from 'crypto';

    private deriveProjectId(projectPath: string): string {
      let normalized = path.resolve(projectPath);
      // Windows 경로 구분자(\)를 POSIX 스타일(/)로 통일
      normalized = normalized.replace(/\\/g, '/'); 
      
      // Windows(win32)와 macOS(darwin)는 파일 시스템이 대소문자를 구분하지 않음
      if (process.platform === 'win32' || process.platform === 'darwin') {
        normalized = normalized.toLowerCase();
      }
      
      return crypto.createHash('sha256').update(normalized).digest('hex');
    }
    ```
*   **부가 수정:** 기존의 불안정한 `parentProject` 병합 로직을 간소화하고, 정규화 기반 ID를 통해 Drizzle의 `onConflictDoUpdate`가 의도대로 작동하도록 수정합니다.

### 단계 2: 중복 데이터 병합 및 정리 스크립트 작성 (DB Migration)
이미 분리되어 저장된 기존 프로젝트 데이터를 하나로 병합해야 합니다. 데이터 무결성을 위해 **반드시 트랜잭션 내에서 실행**해야 합니다.

*   **수정 대상:** 마이그레이션 스크립트 작성 (`scripts/merge-duplicate-projects.ts`)
*   **변경 내용:**
    1.  DB의 모든 `projects` 레코드를 읽어옵니다.
    2.  각 레코드의 `path`를 위와 동일한 OS 기반 방식으로 정규화하여 그룹화합니다.
    3.  동일한 정규화 경로를 가진 프로젝트가 2개 이상일 경우:
        *   새로운 정규화된 해시 ID를 기준으로 마스터 프로젝트 레코드를 결정(가장 최근 업데이트된 것 등) 또는 갱신/생성합니다.
        *   나머지 중복 프로젝트에 연결된 `sessions`, `plans` 테이블의 `projectId` 외래키를 마스터 ID로 일괄 업데이트(Update)합니다.
        *   외래키 업데이트가 완료된 구형 중복 프로젝트 레코드를 안전하게 삭제(Delete)합니다.
    4.  **안전성:** 이 모든 UPDATE/DELETE 과정은 롤백을 대비해 `db.transaction(async (tx) => { ... })` 안에서 수행합니다.

### 단계 3: 프론트엔드 UI/UX 고도화 (Frontend UI)
단순한 텍스트 뱃지를 넘어, 한정된 사이드바 공간에서 직관적이고 세련된 사용자 경험(UX)을 제공하도록 UI를 개선합니다.

*   **수정 대상:** `src/frontend/components/ProjectList.tsx`
*   **세부 개선 방안:**
    1.  **미니멀 아이콘 및 툴팁 (Iconography & Tooltips):** 
        *   텍스트 뱃지 대신 에이전트를 상징하는 미니멀한 SVG 아이콘(또는 Lucide 아이콘)을 사용합니다.
        *   아이콘에 마우스를 올렸을 때(Hover) "Active with Gemini" 와 같은 네이티브 툴팁(`title` 속성 또는 Radix UI Tooltip)을 제공하여 공간을 절약하면서도 정보를 명확히 전달합니다.
    2.  **시각적 계층 및 배치 (Visual Hierarchy):**
        *   아이콘을 프로젝트 이름의 우측 끝에 우측 정렬(Right-aligned)로 배치하여, 긴 프로젝트 경로나 이름의 가독성을 해치지 않도록 분리합니다.
    3.  **색상 코딩 (Color Coding):**
        *   에이전트별로 고유한 테마 색상(예: Gemini는 Blue, Copilot은 Purple)을 아이콘에 적용하여, 사용자가 시각적으로 빠르게 인지할 수 있도록 돕습니다.
    4.  **상호작용 연동 (Interactive Filtering - Optional):**
        *   프로젝트 카드 내의 에이전트 아이콘을 클릭하면 상단의 에이전트 필터 토글 동작(`toggleFilterAgent`)과 연동되어 필터링이 되도록 상호작용성을 부여할 수 있습니다.

    ```tsx
    {/* 예시: 고도화된 UI 렌더링 로직 */}
    <div className="flex items-center gap-1.5 ml-auto">
      {p.agents?.includes('gemini') && (
        <div title="Active with Gemini" className="text-blue-400/70 hover:text-blue-400 transition-colors">
          {/* Gemini SVG Icon */}
          <Sparkles size={12} /> 
        </div>
      )}
      {p.agents?.includes('copilot') && (
        <div title="Active with Copilot" className="text-purple-400/70 hover:text-purple-400 transition-colors">
          {/* Copilot SVG Icon */}
          <Bot size={12} />
        </div>
      )}
    </div>
    ```

### 단계 4: 미래 확장성(Scalability) 확보 (Architecture & Config)
향후 Claude, ChatGPT 등 새로운 AI 에이전트가 추가될 경우를 대비하여 하드코딩된 로직을 걷어내고 설정 기반(Config-driven)의 동적 구조로 전환합니다.

1.  **DB 스키마 Enum 유연화 (Backend):**
    *   `src/backend/db/schema.ts`의 `sessions` 테이블에서 `source: text('source', { enum: ['gemini', 'copilot'] })` 제약을 제거하고 단순 `text` 필드로 변경하여 마이그레이션 없이 새 에이전트를 수용할 수 있게 합니다.
2.  **설정 기반 테마 관리 (Frontend):**
    *   에이전트별 메타데이터(이름, 아이콘, 테마 색상)를 관리하는 중앙 설정 객체(`AGENT_CONFIG`)를 도입하여 `if-else` 분기문을 제거합니다.
    ```typescript
    // 예시: constants/agents.ts
    export const AGENT_CONFIG: Record<string, { name: string, icon: React.ElementType, color: string }> = {
      gemini: { name: 'Gemini', icon: Sparkles, color: 'blue' },
      copilot: { name: 'Copilot', icon: Bot, color: 'purple' },
      claude: { name: 'Claude', icon: BrainCircuit, color: 'orange' }, // 확장 대비
    };
    ```
3.  **필터 UI 동적 렌더링 (Frontend):**
    *   `ProjectList` 상단의 글로벌 필터 버튼을 하드코딩하지 않고, 백엔드에서 전달받은 유효한 에이전트 목록이나 `AGENT_CONFIG`의 키를 순회(`map`)하여 동적으로 렌더링하도록 개선합니다.
4.  **메시지 타입 통일 (Backend):**
    *   `SyncManager`에서 `type: 'gemini'`와 같이 특정 에이전트에 종속된 메시지 타입을 강제하는 로직을 제거하고, AI의 응답은 모두 범용적인 `type: 'agent'`로 통일합니다. 에이전트 구분은 세션(`Session`)의 `source` 값으로 충분히 식별 가능합니다.

## 3. 검증 전략 (Validation)
1. **단위 테스트:** `SyncManager`가 대소문자가 다른 경로 입력에도 항상 동일한 `projectId`를 반환하는지 검증하는 테스트 코드를 작성합니다.
2. **마이그레이션 안전성:** 개발 환경의 `gemini-monitor.db`를 백업한 뒤 정리 스크립트를 실행하여, DB의 `sessions` 무결성이 깨지지 않고 `projects`가 하나로 합쳐지는지 확인합니다.
3. **UI/UX 확인:** 브라우저에서 'Active Projects' 탭이 깔끔하게 병합되어 하나만 표시되는지, 그리고 필터 버튼(Gemini / Copilot)이 정상적으로 필터링 동작을 수행하는지 점검합니다.