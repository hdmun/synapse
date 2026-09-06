# AI Agents Context & Rules

This project uses highly modularized rules to provide specialized context to AI agents. 
AI agents must read the appropriate markdown files below based on the exact context of the requested task to ensure consistent and high-quality outputs.

## Core Mandates for Consistent Work Quality
To maintain the integrity and consistency of the codebase, AI agents MUST adhere to the following principles:

1. **Verify Before Action:** Always read existing code, types, and configurations before making changes. Do not guess the structure. Use search (`grep_search`, `glob`) and read (`read_file`) tools to understand the surrounding context.
2. **Follow Existing Patterns:** Strictly adhere to the project's established architectural patterns, naming conventions, and file structures. Do not introduce new libraries or frameworks unless explicitly instructed.
3. **Atomic & Focused Changes:** Keep your modifications strictly related to the requested task. Do not perform unrelated refactoring.
4. **Type Safety & Linters:** Never bypass TypeScript strict mode (e.g., avoid `any`, `@ts-ignore`). Use explicit type guards and proper schema validation (Zod). Address potential linting or type errors.
5. **Test Driven:** Whenever adding features or fixing bugs, verify existing tests or add new tests to ensure the behavioral correctness of the change. Validate changes with `npm run test` or the appropriate testing commands.
6. **No Silent Failures:** If an intended change conflicts with existing rules or breaks the build, stop and inform the user or re-evaluate the strategy. Do not push through breaking changes.

## 검증 명령

- **테스트(게이트): `bun run test`** — 루트에서 실행하며 backend/collector/frontend 세 패키지를 모두 돈다. 이 저장소의 유일한 녹색 게이트다.
- 위 5번 항목의 `npm run test`는 이 저장소에서 맞지 않는다. bun 워크스페이스이므로 `bun run test`를 쓴다.
- **타입체크는 현재 게이트가 아니다.** `tsc -b`는 기준선에서 이미 `TS2688`(bun-types/@types/node 해석 실패)로 깨져 있고, `tsc --noEmit -p tsconfig.json`은 `files: []` 솔루션 설정이라 아무것도 검사하지 않고 통과한다. 타입 오류를 게이트로 잡을 수 없다는 뜻이니, 5번 항목은 사람이 눈으로 지켜야 한다.
- 새 워크트리에서는 `bun install`을 먼저 실행해야 한다. 하지 않으면 의존성이 없어 게이트가 실패한다.

## Orca relay 파이프라인 워커일 때

Orca dispatch preamble을 받았다면, 작업을 시작하기 전에 자신의 역할 파일을 읽고 그 규범을 따를 것.

| 역할 | 파일 |
|---|---|
| 구현자 | [.ai/roles/implementer.md](./.ai/roles/implementer.md) |
| 리뷰어 | [.ai/roles/reviewer.md](./.ai/roles/reviewer.md) |

역할은 preamble의 TASK 블록이 지정한다.

**그 preamble이 없다면 이 절을 무시할 것.** 파이프라인 밖에서 이 저장소를 평범하게 쓸 때는 아무 제약도 추가되지 않는다.

---


