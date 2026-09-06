# T-001: `@synapse/shared`의 message-utils 유닛 테스트 추가

## 배경 (구현자는 이전 대화를 모른다 — 여기에 다 적는다)

`packages/shared`는 backend·collector·frontend 세 패키지가 모두 의존하는 공용 패키지인데 **테스트가 하나도 없고 `test` 스크립트조차 없다.** 여기서 회귀가 나면 세 패키지가 동시에 깨진다.

그중 `src/message-utils.ts`의 두 함수는 다양한 형태의 메시지 content(문자열, JSON 문자열, 중첩 객체, 배열)를 다루는 순수 함수라 엣지 케이스가 많은데, 현재 그 동작을 고정해둔 것이 아무것도 없다.

이 태스크는 **동작을 바꾸지 않고 현재 동작을 테스트로 고정**한다. 리팩터링이나 버그 수정이 아니다.

## 범위 밖 (건드리지 말 것)

- **`packages/shared/src/message-utils.ts` 자체를 수정하지 않는다.** 구현 변경은 다른 태스크다.
- `shared` 외의 패키지(`backend`, `collector`, `frontend`) 파일 일체
- `packages/shared/src/`의 다른 파일(`config.ts`, `schema.ts`, `types.ts`, `index.ts`)
- 루트 `package.json`, `tsconfig*.json`, lockfile
- 아래 "변경 대상 파일" 목록 밖의 파일은 생성/수정 금지

## 변경 대상 파일

- `packages/shared/package.json` — **수정**: `scripts.test`에 `"bun test"` 추가. 현재 `scripts` 키 자체가 없으므로 새로 만든다. 다른 필드는 건드리지 않는다.
- `packages/shared/src/message-utils.test.ts` — **신규**

## 시그니처 (대상 함수 — 그대로 두고 테스트만 작성한다)

```ts
export function extractMessageSummary(content: any, maxLength: number = 80): string | undefined
export function cleanMessageContent(content: any): string
```

## 동작 명세

**먼저 `packages/shared/src/message-utils.ts` 구현을 읽고, 그 코드가 실제로 하는 동작을 테스트로 고정한다.** 아래는 반드시 커버해야 하는 입력 범주다. 각 범주에 최소 1개 이상의 케이스를 둔다. 구현을 읽고 추가로 필요하다고 판단되는 케이스는 더 넣어도 된다.

### `extractMessageSummary`

- falsy content (`null`, `undefined`, 빈 문자열)
- 평범한 문자열
- `{`로 시작하는 JSON 문자열 — 파싱되어 내부 텍스트가 추출되는 경로
- `[`로 시작하는 JSON 문자열
- **파싱에 실패하는 JSON 유사 문자열** — 원문으로 폴백하는 경로
- 중첩된 `parts` 배열을 가진 객체 (재귀 탐색 경로)
- 배열 입력
- `text` 키를 가진 객체 / `content` 키를 가진 객체
- 여러 공백·개행이 섞인 문자열 (공백 정규화 결과)
- `maxLength`를 넘는 긴 입력 (잘림 동작)
- `maxLength`를 명시적으로 넘긴 경우
- 텍스트를 찾을 수 없는 객체 (`JSON.stringify` 폴백 경로)

### `cleanMessageContent`

- 문자열 입력
- `{ text: '' }` 만 들어 있는 배열 (전부 걸러져 빈 문자열이 되는 경로)
- 걸러낸 뒤 문자열 하나만 남는 배열
- 걸러낸 뒤 둘 이상 남는 배열 (`JSON.stringify` 경로)
- `{ text: '' }` 단독 입력
- 일반 객체 입력

### 중요: 현재 동작을 고정하는 것이지 "옳은 동작"을 정의하는 것이 아니다

구현을 읽다가 **이상해 보이는 동작**을 발견할 수 있다. 예를 들어 잘림 처리가 `maxLength`보다 긴 문자열을 만들 수 있다. 그런 것을 발견하면:

- **구현을 고치지 않는다.**
- 현재 동작 그대로 테스트를 쓴 뒤, `orca orchestration ask`로 코디네이터에게 "이 동작이 의도된 것인지" 물어본다.
- 답을 받기 전에 스스로 판단해서 테스트 기대값을 "옳다고 생각하는 값"으로 적지 않는다.

## 기존 코드 참조

- **테스트 스타일**: `packages/backend/src/controllers/project.controller.test.ts:1` — `import { test, expect, describe } from "bun:test"` 형식이고 소스 옆에 나란히 두는 colocated 배치다. 같은 방식을 따른다.
- **`test` 스크립트**: `packages/collector/package.json`의 `"test": "bun test"` 를 그대로 따른다. 새 의존성을 설치하지 않는다 — bun 내장 러너를 쓴다.

## 인수 조건 (통과해야 완료)

- [ ] `packages/shared/src/message-utils.test.ts` 가 존재한다
- [ ] `packages/shared/package.json` 에 `"test": "bun test"` 가 있다
- [ ] 저장소 루트에서 게이트가 통과한다:
      `bun run test > gate.log 2>&1 ; echo "exit=$?"` 의 결과가 **`exit=0`**
      (워크트리에 `node_modules`가 없으면 먼저 `bun install`)
- [ ] 게이트 출력에 `@synapse/shared test:` 라인이 나타나고, shared 테스트가 실제로 실행된 것이 확인된다
- [ ] 위 "동작 명세"의 모든 입력 범주가 최소 1케이스씩 커버된다
- [ ] `message-utils.ts` 가 수정되지 않았다 (`git diff --stat` 에 나타나지 않아야 한다)
- [ ] `gate.log` 같은 임시 파일을 저장소에 남기지 않는다

## 판단이 필요하면

스스로 판단하지 말고 `orca orchestration ask --question "<질문>" --timeout-ms 600000` 으로
코디네이터에게 물어보고 답을 받은 뒤 진행하세요. 파일에 메모를 남기고 중단하지 마세요.
`AskUserQuestion`류의 로컬 프롬프트는 코디네이터가 볼 수 없으므로 절대 쓰지 마세요.
