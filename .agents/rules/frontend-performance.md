---
trigger: model_decision
description: 가상 리스트, 메모이제이션, 콜백 함수를 활용한 프론트엔드 성능 최적화 규칙
---

# 프론트엔드 React 성능 최적화 규칙 (Frontend React Performance)

## 성능 및 렌더링 최적화 (Performance & Optimization)
- **대규모 리스트 (Large Lists)**: DOM 과부하를 방지하기 위해 50개 항목을 초과할 것으로 예상되는 모든 목록(예: 로그 출력, 긴 대화 기록 등)에는 `@tanstack/react-virtual` 가상화 라이브러리를 의무적으로 사용하세요.
- **메모이제이션 (Memoization)**: 차트 데이터 그룹화 등 비용이 큰 동기식 연산에는 `useMemo`를 사용하세요.
- **콜백 메모이제이션 (Callbacks)**: 불필요한 리렌더링을 방지하기 위해 가상화 리스트나 차트 컴포넌트처럼 고도로 최적화된 자식 컴포넌트에 함수를 prop으로 전달할 때는 `useCallback`을 사용하세요.
