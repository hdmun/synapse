# T-005: collector 프로덕션 타입 정합

## 배경 (구현자는 이전 대화를 모른다 — 여기에 다 적는다)

이 저장소는 타입체크를 게이트로 승격시키는 중이다(`.ai/specs/DAG-typecheck-gate.md`).
현재 게이트는 `bun run test`이며, T-004 머지 후 `tsc -b --force` 기준 고유 오류가 **24건** 남아 있다.
이 태스크는 그중 `packages/collector/src/collectors/` 의 **프로덕션 파일** 오류 **7건**을 없앤다.

| 위치 | 코드 | 원인 |
|---|---|---|
| `base.collector.ts:19`, `:23` | TS4114 | `on`/`off` 가 `EventEmitter` 를 오버라이드하는데 `override` 가 없다 |
| `claude.collector.ts:38` | TS2345 | chokidar `error` 이벤트 인자가 `unknown` 인데 `emitError(error: Error)` 에 넘긴다 |
| `copilot.collector.ts:52` | TS2345 | 위와 같은 원인 |
| `claude.collector.ts:106` | TS2345 | `lines[i]` 가 `string \| undefined` (`noUncheckedIndexedAccess`) |
| `codex.collector.ts:178` | TS2322 | `thoughtTraces` 의 `timestamp` 에 `Date` 를 넣는다. 계약은 `string` |
| `codex.collector.ts:181` | TS2345 | **`:178` 의 파생.** 아래 참고 |

### `codex.collector.ts:181` 은 독립 오류가 아니다

172행의 `currentMessage = { ... }` 대입이 `:178` 때문에 타입 검사에 실패하면, TypeScript는
그 대입으로 `currentMessage` 를 좁히지 못하고 선언 타입 `UnifiedMessage | null` 로 되돌린다.
그래서 181행 `messages.push(currentMessage)` 가 `null` 가능성으로 걸린다.
**`:178` 만 고치면 `:181` 은 함께 사라진다.** (설계 단계에서 실측 확인)
**181행에 `!` 나 가드를 추가하지 말 것.**

### 설계 단계에서 이미 검증한 것

아래 "동작 명세"대로 고친 상태를 설계자가 실측했다:
`tsc -b --force` 고유 오류 **24 → 17**, `bun run test` **exit=0**.
따라서 명세대로 했는데 수치가 다르게 나오면 명세를 벗어난 곳이 있다는 뜻이다.

## 범위 밖 (건드리지 말 것)

- `package.json`, `bun.lock`, `tsconfig*.json` — **일체 수정 금지.** 컴파일러 옵션 변경 금지
- `packages/shared/**` — `CollectorEvents`, `ThoughtTrace`, `UnifiedMessage` 계약을 바꾸지 않는다
- 테스트 파일 오류(`__tests__/claude.collector.test.ts`, `session.controller.test.ts`) — T-006 담당
- frontend 오류(`App.tsx`, `CommandPalette.tsx`, `Dashboard.tsx`, `SessionList.test.tsx`) — T-007 담당
- **이상해 보이지만 이번에 고치지 않는 것** — 오류가 아니므로 손대지 않는다:
  - `base.collector.ts:20`, `:24` 의 `listener as any`
  - `codex.collector.ts:49`, `gemini.collector.ts:34` 의 `(error: any)` 주석
  - `codex.collector.ts:217` 의 `'pending' as any`
  - `codex.collector.ts` 의 `entry: any` 계열 파싱 코드 전반
- 아래 "변경 대상 파일" 목록 밖의 파일은 생성/수정 금지

## 변경 대상 파일

- `packages/collector/src/collectors/base.collector.ts` — 수정
- `packages/collector/src/collectors/claude.collector.ts` — 수정
- `packages/collector/src/collectors/codex.collector.ts` — 수정

**이 목록 밖의 파일은 생성/수정 금지.** `copilot.collector.ts` 가 목록에 없는 것은 의도다 — (1)의 결과로
그 파일의 오류는 파일을 고치지 않고 사라진다.

## 시그니처

**그대로 쓸 것, 임의 변경 금지.**

```ts
// base.collector.ts
protected emitError(error: unknown): void;
public override on<K extends keyof CollectorEvents>(event: K, listener: CollectorEvents[K]): this;
public override off<K extends keyof CollectorEvents>(event: K, listener: CollectorEvents[K]): this;
```

## 동작 명세

### (1) `base.collector.ts` — `emitError` 가 `unknown` 을 받아 `Error` 로 정규화한다

현재:

```ts
protected emitError(error: Error): void {
  this.emit('error', error);
}
```

매개변수를 `unknown` 으로 넓히고, **내부에서 `Error` 로 정규화한 뒤** emit 한다.

- 값이 `Error` 인스턴스면(`instanceof Error`) 그 객체를 그대로 emit 한다 — 새로 감싸지 않는다
- 아니면 `new Error(String(error))` 로 감싸 emit 한다

근거: `packages/shared/src/types.ts:48` 의 계약은 `'error': (error: Error) => void` 다.
chokidar의 `error` 이벤트와 `catch` 절은 `unknown` 을 준다. 정규화를 호출부마다 흩지 않고
**계약을 지키는 쪽(emit 직전) 한 곳**에 두면, 모든 호출부가 고치지 않아도 계약을 만족한다.
이 변경으로 `claude.collector.ts:38`, `copilot.collector.ts:52` 의 TS2345 2건이 **호출부 수정 없이** 사라진다.

- **호출부에 `as Error` 캐스팅이나 `instanceof` 분기를 추가하지 않는다.** 정규화는 `emitError` 안에만 있다
- `claude.collector.ts:38`, `copilot.collector.ts:52` 는 그대로 둔다

### (2) `base.collector.ts` — `on`/`off` 에 `override`

19행 `on`, 23행 `off` 에 `override` 수식어를 붙인다(시그니처 절 참고). 본문은 바꾸지 않는다.
TS4114 2건 해소.

### (3) `claude.collector.ts:104` — 인덱스 접근 가드

```ts
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  // ...
  const data = JSON.parse(line);   // ← 106행, line: string | undefined
```

`const line = lines[i];` 바로 다음에 **`undefined` 가드(`continue`)** 를 넣는다.

- **`!` 단언 금지.** 이 저장소는 T-003에서 "`!` 는 테스트 파일에 한정, 프로덕션은 가드"로 정했다
- 루프 구조(`for (let i ...)`)를 바꾸지 않는다. `i` 는 메시지 id(`${sessionId}-${i}`)에 쓰이므로
  값의 의미가 그대로여야 한다
- 런타임 동작은 같다: 실제로 `undefined` 가 올 일은 없고, 왔다면 지금은 `JSON.parse` 가 던져서
  바로 아래 `catch` 가 그 줄을 건너뛴다. 가드도 그 줄을 건너뛴다

### (4) `codex.collector.ts` — `ThoughtTrace.timestamp` 를 ISO 문자열로

`ThoughtTrace` 계약(`packages/shared/src/schema.ts`)의 `timestamp` 는 `string` 이다.
같은 패키지의 `claude.collector.ts:165` 는 이미 `ts.toISOString()` 으로 넣는다. 이 형태를 따른다.

1. 109행 `thoughtsAccMap` 의 타입을 `Map<string, any[]>` 에서 `Map<string, ThoughtTrace[]>` 로 좁힌다.
   `ThoughtTrace` 는 8행의 `import type { ... } from '@synapse/shared'` 에 추가한다(type-only 유지)
2. 두 곳의 `timestamp: timestamp` 를 `timestamp: timestamp.toISOString()` 으로 바꾼다:
   - 157~161행 `thoughtsList.push({ ... })`
   - 166~170행 `const thoughtsList = [{ ... }]`

1번은 선택이 아니다. 맵이 `any[]` 로 남으면 157행 쪽은 `Date` 를 넣어도 컴파일러가 잡지 못해,
**같은 배열에 `Date` 와 문자열이 섞인다.** 타입을 좁혀야 두 자리가 함께 검사된다.

런타임 영향: 저장 결과는 바뀌지 않는다. `thoughts` 필드는 원래 `JSON.stringify(thoughtsList)` 라서
`Date` 가 이미 ISO 문자열로 직렬화되고 있었고, `thoughtTraces` 는 `packages/backend/src/services/ingester.ts:179`
에서 `JSON.stringify` 되어 DB에 들어간다. 메모리상 값의 타입만 계약에 맞춰진다.

이 수정으로 `:178` TS2322 와 그 파생인 `:181` TS2345 가 함께 사라진다.

## 기존 코드 참조

- `packages/collector/src/collectors/claude.collector.ts:162-166` — `ThoughtTrace` 를 ISO 문자열 timestamp로 만드는 형태
- `packages/shared/src/types.ts:46-49` — `CollectorEvents` 계약 (`error` 리스너는 `Error` 를 받는다)
- `.ai/specs/T-003-type-only-import-and-index-guards.md` — "`!` 는 테스트 한정, 프로덕션은 가드" 결정의 근거

## 인수 조건 (통과해야 완료)

측정 전에 워크트리에 `node_modules` 가 없으면 먼저 `bun install`.

```bash
# 타입체크 — 반드시 --force (증분 캐시가 있으면 tsc -b 는 아무 일도 안 하고 통과한다)
./node_modules/.bin/tsc -b --force > tsc.log 2>&1 ; echo "tsc exit=$?"

# 게이트
bun run test > gate.log 2>&1 ; echo "gate exit=$?"
```

tsc 는 아직 남은 오류(T-006·T-007 몫) 때문에 `exit=2` 로 끝나는 것이 정상이다. 종료코드가 아니라 아래 수치로 판정한다.

- [ ] **게이트 통과**: `bun run test` 가 `exit=0`
- [ ] 프로덕션 collector 오류 **0건**:
      `grep -E "error TS[0-9]+" tsc.log | grep -E "collectors/[a-z]+\.collector\.ts" | wc -l` → `0`
      (`__tests__/` 아래 파일은 경로에 `collectors/__tests__/` 가 끼므로 이 패턴에 걸리지 않는다. 의도한 것이다)
- [ ] `TS4114` **0건**: `grep -cE "error TS4114" tsc.log` → `0`
- [ ] **고유 오류 총계 17건 이하**:
      `grep -E "error TS[0-9]+" tsc.log | sort -u | wc -l` → 17 이하
      **주의: 이 패턴은 파일 경로 없이 출력되는 설정 수준 오류(`error TS2688` 등)도 함께 센다.
      의도한 것이다. `^packages/` 로 접두사를 거는 패턴을 쓰지 말 것.**
- [ ] 변경이 위 3개 파일에만 있다: `git diff --stat`
- [ ] `package.json`, `bun.lock`, `tsconfig*.json`, `packages/shared/**` 가 변경되지 않았다
- [ ] 변경된 줄에 `as any`, `as Error`, `@ts-ignore`, `@ts-expect-error`, `!` 단언이 새로 생기지 않았다:
      `git diff -U0 | grep -E "^\+" | grep -E "as any|as Error|@ts-(ignore|expect-error)|[]A-Za-z0-9_)]!(\.|;|\)|,)"` → 출력 없음
      (브래킷 식의 `]` 는 맨 앞에 둔다. `\]` 로 쓰면 POSIX ERE에서 이스케이프가 아니라서 `foo!.bar` 를 놓친다 — 실측)
- [ ] `tsc.log`, `gate.log` 등 임시 파일을 저장소에 남기지 않는다

## 하지 말아야 할 것

- 호출부(`claude.collector.ts:38`, `copilot.collector.ts:52`)에서 `err as Error` 로 덮는 것
- `emitError` 를 `any` 로 넓히는 것 — `unknown` 이어야 정규화가 강제된다
- `CollectorEvents['error']` 를 `(error: unknown) => void` 로 바꾸는 것 — 계약 변경이며 범위 밖
- `ThoughtTrace` 스키마의 `timestamp` 를 `Date` 허용으로 바꾸는 것 — 계약 변경이며 범위 밖
- `noUncheckedIndexedAccess`, `noImplicitOverride` 를 끄는 것
- 위 "범위 밖"에 적은 기존 `any` 들을 정리하는 것 — 좋은 의도라도 이번 diff를 키우고 리뷰를 흐린다

## 판단이 필요하면

스스로 판단하지 말고 `orca orchestration ask --question "<질문>" --timeout-ms 600000` 으로
코디네이터에게 물어보고 답을 받은 뒤 진행하세요. 파일에 메모를 남기고 중단하지 마세요.
`AskUserQuestion` 류의 로컬 프롬프트는 코디네이터가 볼 수 없으므로 절대 쓰지 마세요.
