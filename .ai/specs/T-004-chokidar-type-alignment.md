# T-004: chokidar 5 타입 정합 (namespace 오용 제거)

## 배경 (구현자는 이전 대화를 모른다 — 여기에 다 적는다)

이 저장소는 타입체크를 게이트로 승격시키는 중이다. 현재 게이트는 `bun run test`이며,
`tsc -b --force` 기준 고유 오류가 **33건** 남아 있다. 이 태스크는 그중 chokidar 관련 **10건**을 없앤다.

### 원인은 "타입 선언이 없어서"가 아니다

이 태스크를 계획할 때의 최초 가설은 "chokidar 5.0.0이 타입 선언을 제공하지 않는다"였다.
**이 가설은 틀렸다.** 설계 단계에서 다음을 실측으로 확인했다.

1. `node_modules/chokidar/` 에 `index.d.ts`, `handler.d.ts` 가 실제로 들어 있다.
2. `tsc --traceResolution` 결과, TypeScript가 그 `index.d.ts` 를 정상적으로 해석한다:
   ```
   Module name 'chokidar' was successfully resolved to
   '.../node_modules/chokidar/index.d.ts' with Package ID 'chokidar/index.d.ts@5.0.0'
   ```

즉 타입은 이미 있고 이미 읽히고 있다. 따라서 **`@types/chokidar` 설치, `paths` 매핑,
`declare module` 앰비언트 선언, `skipLibCheck`·`moduleResolution` 변경은 전부 불필요하며 금지한다.**

### 진짜 원인

chokidar 5의 `index.d.ts` 는 타입을 **named export** 로 내보낸다:

```ts
export declare class FSWatcher extends EventEmitter<FSWatcherEventMap> { ... }
export declare function watch(paths: string | string[], options?: ChokidarOptions): FSWatcher;
declare const _default: { watch: typeof watch; FSWatcher: typeof FSWatcher; };
export default _default;
```

`FSWatcher` 는 최상위 named export 타입이고, default export 는 **값 객체**다.
그런데 문제의 두 파일은 `chokidar` 를 **네임스페이스**처럼 쓰고 있다:

```ts
import chokidar from 'chokidar';
private watcher?: chokidar.FSWatcher;   // ← 값에서 타입을 꺼내려 함
```

값 바인딩에서 타입을 꺼낼 수 없으므로 `TS2503: Cannot find namespace 'chokidar'` 가 난다.
그 결과 `this.watcher` 의 타입이 무너져, 이어지는 `.on('add', (file) => ...)` 콜백 인자가
전부 암묵적 `any` 가 되어 `TS7006` 이 연쇄로 발생한다.

**따라서 `TS7006` 7건은 독립 오류가 아니라 `TS2503` 3건의 파생이다.
namespace 오용만 고치면 10건이 함께 사라진다.** (설계 단계에서 실측 확인)

### 이 저장소에 이미 올바른 형태가 있다

같은 패키지의 `gemini.collector.ts`, `codex.collector.ts` 는 이미 올바르게 쓰고 있고
이 두 파일에서는 chokidar 오류가 하나도 나지 않는다. **이 형태를 그대로 따른다.**

```ts
import * as chokidar from 'chokidar';
import type { FSWatcher } from 'chokidar';
// ...
private watcher?: FSWatcher;
```

## 범위 밖 (건드리지 말 것)

- `package.json`, `bun.lock`, `tsconfig*.json` — **일체 수정 금지.** 의존성 추가/변경 금지,
  컴파일러 옵션 변경 금지. 이 태스크는 소스 두 파일의 import/타입 표기만 고친다.
- **런타임 동작 변경 일체.** `chokidar.watch(...)` 호출 인자, watch 대상 glob, 옵션 객체,
  이벤트 이름, 디바운스 로직, 큐 로직을 바꾸지 않는다. 바꾸는 것은 타입 표기뿐이다.
- **아래에 "예상된 신규 오류"로 명시한 `claude.collector.ts` 의 error 핸들러 오류는 고치지 않는다.**
  (T-005 담당)
- 다른 타입 오류(`TS2339` 13건, `TS2345`, `TS2322`, `TS4114`, `TS2769`, `TS2353`) — 모두 별도 태스크
- 아래 "변경 대상 파일" 목록 밖의 파일은 생성/수정 금지

## 변경 대상 파일

- `packages/collector/src/collectors/claude.collector.ts` — 수정
- `packages/backend/src/services/ingester.ts` — 수정

**이 목록 밖의 파일은 생성/수정 금지.**

## 동작 명세

### (1) `packages/collector/src/collectors/claude.collector.ts`

현재 3행과 10행:

```ts
import chokidar from 'chokidar';
// ...
private watcher?: chokidar.FSWatcher;
```

`gemini.collector.ts` / `codex.collector.ts` 와 같은 형태로 바꾼다. `chokidar.watch(...)` 호출은
그대로 유지되어야 하므로 값 import 도 함께 남긴다.

- `TS2503` 1건 해소
- 그 파생인 35·36·37행 `TS7006` 3건이 함께 해소된다

### (2) `packages/backend/src/services/ingester.ts`

현재 1행과 24·25행:

```ts
import chokidar from 'chokidar';
// ...
private sessionWatcher?: chokidar.FSWatcher;
private toolOutputWatcher?: chokidar.FSWatcher;
```

같은 방식으로 바꾼다.

- `TS2503` 2건 해소
- 그 파생인 53·54·56·57행 `TS7006` 4건이 함께 해소된다

### 예상된 신규 오류 — 고치지 말 것

`claude.collector.ts` 의 다음 줄은 지금까지 `err` 가 암묵적 `any` 였기 때문에 통과하고 있었다.

```ts
this.watcher.on('error', (err) => this.emitError(err));
```

타입이 제대로 붙으면 `err` 는 `unknown` 이 되고, `emitError(error: Error)` 와 맞지 않아
**새 오류 1건**이 나타난다:

```
packages/collector/src/collectors/claude.collector.ts(37,54): error TS2345:
Argument of type 'unknown' is not assignable to parameter of type 'Error'.
```

**이것은 예상된 결과이며 이 태스크의 범위가 아니다.** `as Error` 캐스팅이나 `any` 로 덮지 말고
**그대로 남긴다.** 같은 성격의 오류(`copilot.collector.ts:52`)와 함께 T-005에서 처리한다.
아래 인수 조건의 "24건 이하"는 이 1건이 남아 있는 것을 전제로 한 숫자다.

### 하지 말아야 할 것

- `@types/chokidar` 등 의존성 추가 — chokidar 5는 자체 타입을 제공한다. `@types/chokidar` 는
  chokidar 3 시절의 낡은 선언이라 설치하면 오히려 틀린 타입이 덮인다
- `declare module 'chokidar'` 앰비언트 선언 추가
- `tsconfig` 의 `paths` / `moduleResolution` / `types` 변경
- `any` 캐스팅, `@ts-ignore`, `@ts-expect-error`
- 콜백 인자에 수동 타입 주석(`(file: string) => ...`)을 다는 것 — import 를 고치면 추론된다.
  추론이 안 되는 자리가 남으면 판단하지 말고 물어본다

## 기존 코드 참조

- `packages/collector/src/collectors/gemini.collector.ts:1-2` — 따라야 할 import 형태
- `packages/collector/src/collectors/codex.collector.ts:1-2` — 같은 형태

## 인수 조건 (통과해야 완료)

측정 전에 워크트리에 `node_modules` 가 없으면 먼저 `bun install`.

```bash
# 타입체크 — 반드시 --force (증분 캐시가 있으면 tsc -b 는 아무 일도 안 하고 통과한다)
./node_modules/.bin/tsc -b --force > tsc.log 2>&1 ; echo "tsc exit=$?"

# 게이트
bun run test > gate.log 2>&1 ; echo "gate exit=$?"
```

- [ ] **게이트 통과**: `bun run test` 가 `exit=0`
- [ ] `TS2503` **0건**:
      `grep -cE "error TS2503" tsc.log` → `0`
- [ ] `TS7006` **0건**:
      `grep -cE "error TS7006" tsc.log` → `0`
- [ ] **고유 오류 총계 24건 이하**:
      `grep -E "error TS[0-9]+" tsc.log | sort -u | wc -l` → 24 이하
      (33건에서 10건이 사라지고 위 "예상된 신규 오류" 1건이 더해져 24건이다.
      연쇄로 더 줄어들 수는 있으나 24를 넘으면 안 된다)
      **주의: 이 패턴은 파일 경로 없이 출력되는 설정 수준 오류(`error TS2688` 등)도 함께 센다.
      의도한 것이다. `^packages/` 로 접두사를 거는 패턴을 쓰지 말 것.**
- [ ] 변경이 위 2개 파일에만 있다: `git diff --stat`
- [ ] `package.json`, `bun.lock`, `tsconfig*.json` 이 변경되지 않았다
- [ ] `tsc.log`, `gate.log` 등 임시 파일을 저장소에 남기지 않는다

## 판단이 필요하면

스스로 판단하지 말고 `orca orchestration ask --question "<질문>" --timeout-ms 600000` 으로
코디네이터에게 물어보고 답을 받은 뒤 진행하세요. 파일에 메모를 남기고 중단하지 마세요.
`AskUserQuestion` 류의 로컬 프롬프트는 코디네이터가 볼 수 없으므로 절대 쓰지 마세요.
