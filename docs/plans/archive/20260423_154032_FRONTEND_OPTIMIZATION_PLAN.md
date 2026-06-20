# Frontend Optimization Plan

이 문서는 `gemini-monitor-app` 프론트엔드의 메모리 및 렌더링 속도 최적화를 위한 작업 계획입니다.

## 1. 컴포넌트 분리 및 메모이제이션 (Component Architecture Refactoring)
현재 `App.tsx`에 통합되어 있는 UI를 개별 컴포넌트로 분리하여 리렌더링 범위를 최소화합니다.
- **Task 1-1:** `ProjectList` 컴포넌트 분리 (`src/frontend/components/ProjectList.tsx`)
- **Task 1-2:** `SessionList` 컴포넌트 분리 (`src/frontend/components/SessionList.tsx`)
- **Task 1-3:** `MessageViewer` 컴포넌트 분리 (`src/frontend/components/MessageViewer.tsx`)
- **Task 1-4:** 각 컴포넌트에 `React.memo`를 적용하고, `App.tsx`에서 이들을 조합하도록 수정.

## 2. Zustand 상태 선택(Selector) 최적화
전체 상태 구독으로 인한 불필요한 렌더링을 방지하기 위해 개별 컴포넌트에서 필요한 상태만 구독하도록 수정합니다.
- **Task 2-1:** 분리된 각 컴포넌트(`ProjectList`, `SessionList`, `MessageViewer`) 내부에서 `useStore(state => state.specificData)` 형태로 상태 구독 변경.
- **Task 2-2:** `useShallow`가 필요한 경우(배열/객체 반환 시) 적용.

## 3. 웹소켓(Socket.io) 업데이트 방식 개선 (Delta Update)
서버에서 이벤트 발생 시 전체 데이터를 다시 Fetch하지 않고, 스토어 내부에서 상태를 직접 업데이트하여 네트워크 및 메모리 부하를 줄입니다.
- **Task 3-1:** `useStore.ts`에 단일 요소 업데이트를 위한 액션 추가 (예: `updateProjectProgress`, `addMessage`, `updateSessionStatus`).
- **Task 3-2:** `App.tsx` (또는 Socket 통신 전용 Hook)의 웹소켓 이벤트 리스너에서 Fetch 대신 새로 추가한 상태 업데이트 액션을 호출하도록 수정.

## 4. 리스트 가상화 (Virtualization) 도입
이미 설치된 `@tanstack/react-virtual`을 활용하여 수많은 DOM 노드 렌더링으로 인한 브라우저 메모리 누수를 방지합니다.
- **Task 4-1:** `MessageViewer.tsx`에 `useVirtualizer` 적용 (메시지 목록 가상화).
- **Task 4-2:** 가상화된 리스트의 동적 높이(Dynamic Height) 처리 및 스크롤 동작 최적화.
- **Task 4-3:** (선택 사항) 프로젝트 및 세션 리스트가 길어질 경우를 대비해 `ProjectList`, `SessionList`에도 가상화 적용 검토.

## 작업 순서 및 진행
가장 기초가 되는 컴포넌트 분리(1단계)와 Zustand 최적화(2단계)를 먼저 진행한 후, 웹소켓 로직 개선(3단계)을 적용하고 마지막으로 가장 복잡한 리스트 가상화(4단계)를 진행하는 것을 권장합니다.
