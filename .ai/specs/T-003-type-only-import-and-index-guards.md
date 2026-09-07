# T-003: type-only import 전환과 배열 인덱싱 undefined 처리

## 배경 (구현자는 이전 대화를 모른다 — 여기에 다 적는다)

직전 커밋(`build(types)`)으로 이 저장소의 타입체크가 **처음으로 실행 가능**해졌다. 그전에는 `bun-types`/`@types/node`가 설치되지 않아 `TS2688`만 나오고 실제 타입 오류가 전부 가려져 있었다.

이제 `tsc -b`를 돌리면 **고유 오류 54건**이 나온다. 이것을 한 번에 고치면 diff가 거대해져 리뷰가 불가능하므로 성격별로 나눠 처리하며, **이 태스크는 그중 기계적으로 처리 가능한 두 종류만 담당한다.**

`tsc -b`는 **아직 게이트가 아니다.** 게이트는 여전히 `bun run test`이며, 모든 오류가 0이 된 뒤에야 `tsc -b`를 게이트에 추가한다.

> 주의: `tsc -b`는 프로젝트 레퍼런스 때문에 같은 오류를 여러 프로젝트에서 중복 보고한다. 보고 총계는 66이지만 **고유 오류는 54건**이다. 아래 수치는 모두 고유 기준이며, 중복 제거는 이렇게 한다:
> ```bash
> ./node_modules/.bin/tsc -b > tsc.log 2>&1
> grep -E "^packages/.*error TS" tsc.log | sort -u | wc -l
> ```

## 범위 밖 (건드리지 말 것)

- **chokidar 관련 오류(`TS2503` 3건, `TS7006` 7건)는 이 태스크가 아니다.** chokidar 5.0.0은 타입 선언을 아예 제공하지 않아 판단이 필요하며 별도 태스크로 분리했다.
- `TS2339`(13건), `TS2322`/`TS2345`/`TS4114`/`TS2769`/`TS2353` — 모두 별도 태스크
- `tsconfig*.json`, `package.json`, `bun.lock` — 직전 태스크에서 이미 정리했다
- 프로덕션 코드의 동작 변경 일체
- 아래 "변경 대상 파일" 목록 밖의 파일은 생성/수정 금지

## 변경 대상 파일

- `packages/shared/src/types.ts` — 수정 (1행)
- `packages/backend/src/controllers/session.controller.test.ts` — 수정 (9곳)
- `packages/backend/src/controllers/project.controller.test.ts` — 수정 (5곳)
- `packages/collector/src/collectors/__tests__/collectors.test.ts` — 수정 (3곳)

## 동작 명세

### (1) `TS1484` 4건 — type-only import

`packages/shared/src/types.ts` 1행이 타입 4개를 값처럼 import하고 있다. `verbatimModuleSyntax: true`이므로 타입은 `import type`으로 가져와야 한다.

```
현재:  import { TokenTaxonomy, Enrichers, ToolCall, ThoughtTrace } from './schema';
```

네 심볼(`TokenTaxonomy`, `Enrichers`, `ToolCall`, `ThoughtTrace`)은 모두 `schema.ts`에서 `z.infer<...>`로 선언된 **타입**이다. 값이 아니다.

**이 파일에서 값 import가 함께 필요한지 확인하고, 필요 없다면 import 문 전체를 type-only로 바꾼다.**

### (2) `TS2532` 16건 + `TS18048` 1건 — 배열 인덱싱 undefined

`tsconfig.base.json`에 `noUncheckedIndexedAccess: true`가 켜져 있어 `result[0]`의 타입이 `T | undefined`가 된다. 세 테스트 파일에서 `result[0].id` 형태로 곧바로 속성에 접근해 오류가 난다.

**처리 방침: 테스트 파일에서는 non-null 단언(`!`)을 쓴다.**

```
현재:  expect(result[0].id).toBe("m1");
수정:  expect(result[0]!.id).toBe("m1");
```

근거를 명확히 해둔다 — `AGENTS.md`의 Core Mandate 4는 "strict 모드를 우회하지 말라(`any`, `@ts-ignore` 회피)"고 하지만, 여기서 `!`를 허용하는 이유는:

- 이 코드들은 **테스트가 직전에 자기가 삽입한 데이터**를 검증하는 자리다. 요소가 없으면 그 자체로 테스트 실패여야 하고, `!`는 그 실패를 그 줄에서 즉시 드러낸다.
- 옵셔널 체이닝(`result[0]?.id`)을 쓰면 요소가 없을 때 `undefined`가 되어 **단언이 조용히 통과하거나 엉뚱한 메시지로 실패**한다. 테스트를 약하게 만든다.
- 가드(`if (!result[0]) throw ...`)를 매 줄에 넣으면 테스트 본문이 검증이 아니라 방어 코드로 채워진다.

**프로덕션 코드였다면 `!`가 아니라 가드를 썼을 것이다. 이 예외는 테스트 파일에 한정된다.**

`TS18048`("값이 undefined일 수 있음") 1건도 같은 원인이면 같은 방식으로 처리한다. 원인이 다르면 판단하지 말고 물어본다.

### 하지 말아야 할 것

- `noUncheckedIndexedAccess`를 끄는 것 — 설정을 약화시켜 오류를 없애는 것은 수정이 아니다
- `any` 캐스팅이나 `@ts-ignore`/`@ts-expect-error` 추가
- 테스트의 단언 내용 변경. 타입만 통과시키고 **무엇을 검증하는지는 그대로 둔다**

## 기존 코드 참조

- `packages/collector/src/collectors/claude.collector.ts:2` — `import type { UnifiedMessage, UnifiedSession } from '@synapse/shared';` 가 이 저장소의 type-only import 형식이다. 같은 형식을 따른다.

## 인수 조건 (통과해야 완료)

- [ ] 워크트리에 `node_modules`가 없으면 먼저 `bun install`
- [ ] **게이트 통과**: `bun run test > gate.log 2>&1 ; echo "exit=$?"` 의 결과가 `exit=0`
- [ ] `TS1484` 고유 0건:
      `./node_modules/.bin/tsc -b > tsc.log 2>&1; grep -E "^packages/.*error TS1484:" tsc.log | sort -u | wc -l` → `0`
- [ ] `TS2532`와 `TS18048` 고유 0건 (같은 방식으로 확인)
- [ ] **고유 오류 총계가 33건 이하**:
      `grep -E "^packages/.*error TS" tsc.log | sort -u | wc -l` → 33 이하
      (54건에서 21건을 없애면 33건이다. 연쇄로 더 줄어들 수는 있으나 늘어나면 안 된다)
- [ ] 변경이 위 4개 파일에만 있다: `git diff --stat`
- [ ] `tsc.log`, `gate.log` 등 임시 파일을 저장소에 남기지 않는다

## 판단이 필요하면

스스로 판단하지 말고 `orca orchestration ask --question "<질문>" --timeout-ms 600000` 으로
코디네이터에게 물어보고 답을 받은 뒤 진행하세요. 파일에 메모를 남기고 중단하지 마세요.
`AskUserQuestion`류의 로컬 프롬프트는 코디네이터가 볼 수 없으므로 절대 쓰지 마세요.
