---
trigger: model_decision
description: Zustand를 사용한 도메인별 상태 관리 및 아토믹 셀렉터 활용 규칙
---

# 프론트엔드 상태 관리 규칙 - Zustand (Frontend State Management)

## 모듈식 스토어 분리 (Modular Stores)
- 하나의 거대한 단일 Zustand 스토어를 만들지 마세요.
- 도메인이나 기능별로 스토어를 분리하세요(예: `useAuthStore`, `useProjectStore`, `useLogStore`). 스토어 파일은 `packages/frontend/src/store/`에 배치합니다.

## 액션 정의 (Defining Actions)
- 상태 변경 로직(actions)은 반드시 Zustand 스토어 내부에서 상태와 함께 정의해야 합니다.
- 컴포넌트는 정의된 액션만 호출해야 하며, 컴포넌트 본문에서 직접 전역 `set()` 호출 등으로 스토어 상태를 임의 변형해서는 안 됩니다.

## 셀렉터 활용 - 핵심 (Selectors - Critical)
- 컴포넌트에서 전체 상태 객체를 한 번에 추출하지 **절대 마세요** (`const state = useStore()`). 이는 스토어의 *어떤* 상태가 변경되어도 해당 컴포넌트가 불필요하게 리렌더링되게 만듭니다.
- 컴포넌트가 필요로 하는 상태만 정확히 구독하기 위해 **항상 원자적 셀렉터(Atomic Selector)**를 사용하세요:
  ```ts
  // 권장 패턴
  const messages = useStore((state) => state.messages);
  const addMessage = useStore((state) => state.addMessage);
  ```
- 여러 속성을 객체 형태로 한 번에 선택해야 하는 경우 `zustand/react/shallow`의 `useShallow`를 활용하세요.
