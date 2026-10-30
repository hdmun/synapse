---
trigger: model_decision
description: 엄격한 타입 옵션, Zod 스키마 기반 타입 추론, null 및 옵셔널 타입 정의 규칙
---

# TypeScript 및 타입 안전성 규칙 (TypeScript & Type Safety)

## 엄격 모드 (Strict Mode)
- TypeScript는 반드시 `strict: true` 옵션으로 컴파일되어야 합니다.
- 암시적(implicit) `any`는 금지됩니다.
- 명시적(explicit) `any` 역시 엄격히 금지됩니다. 개발 시점에 타입을 알 수 없는 경우 `unknown` 타입을 사용하고, 사용하기 전에 타입 가드(Type Guards)나 Zod를 활용해 타입을 좁혀(narrowing) 사용하세요.

## 단일 진실 공급원으로서의 Zod (Zod as the Source of Truth)
- 경계를 넘나드는 모든 데이터(API 요청/응답, WebSocket 이벤트, 데이터베이스 읽기/쓰기)는 **Zod 스키마를 가장 먼저 정의**하세요.
- 공유 Zod 스키마는 `packages/shared/src/schema.ts`에 위치시킵니다.
- TypeScript 타입은 `z.infer<typeof SchemaName>`를 사용하여 추출하세요. Zod 스키마 정의와 중복되는 수동 인터페이스를 따로 작성하지 마세요.

## Null 가능성 및 선택적 속성 (Nullability & Optionals)
- 객체나 값의 의도적인 부재를 나타낼 때는 `undefined`보다 명시적인 `null`을 선호하세요(특히 데이터베이스 스키마에서).
- 요청 객체나 설정값 등에서 진정으로 선택적인 필드에만 TypeScript의 `?` 연산자를 사용하세요.
