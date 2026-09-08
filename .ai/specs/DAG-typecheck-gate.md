# DAG: 타입체크 게이트 승격 (T-004 ~ T-008)

목표: `tsc -b --force` 고유 오류 0건 달성 후, 타입체크를 게이트에 추가한다.
현재 게이트는 `bun run test`. 시작 시점 고유 오류 **33건**.

## 오류 분류 (T-003 머지 직후 실측, `tsc -b --force`)

| 코드 | 건수 | 위치 | 태스크 |
|---|---|---|---|
| TS2503 | 3 | `ingester.ts`, `claude.collector.ts` | T-004 |
| TS7006 | 7 | 같은 두 파일 (TS2503의 파생) | T-004 |
| TS4114 | 2 | `base.collector.ts` (`override` 누락) | T-005 |
| TS2345 | 3 | `claude`/`codex`/`copilot` collector | T-005 |
| TS2322 | 1 | `codex.collector.ts:178` | T-005 |
| TS2339 | 11 | `claude.collector.test.ts` (`never` 좁혀짐) | T-006 |
| TS2769 | 1 | `session.controller.test.ts:44` | T-006 |
| TS2339 | 2 | `App.tsx`, `CommandPalette.tsx` (`AppState` 계약 불일치) | T-007 |
| TS2353 | 1 | `SessionList.test.tsx:16` | T-007 |
| TS2322 | 2 | `Dashboard.tsx` (recharts 타입) | T-007 |

## 의존 관계

```
T-004 (chokidar 타입 정합, 10건)
   └─> T-005 (collector 프로덕션 타입 정합, 6+1건)
                                                  \
T-006 (테스트 파일 타입 정합, 12건)  ──────────────> T-008 (게이트 승격)
                                                  /
T-007 (frontend 타입 정합, 5건)     ──────────────
```

- **T-005 는 T-004 에 의존한다.** T-004 가 `claude.collector.ts` 의 error 핸들러에서
  신규 `TS2345` 1건을 드러내며, 같은 파일을 두 태스크가 만지므로 순서가 고정된다.
- **T-006, T-007 은 T-004 와 독립이다.** 실행 정책이 순차라 순서대로 돌지만,
  병렬로 전환할 때 이 세 갈래는 동시에 돌 수 있다.
- **T-008 은 나머지 전부에 의존한다.**

## 잔여 오류 추이 (예상)

| 완료 시점 | 고유 오류 |
|---|---|
| 시작 | 33 |
| T-004 후 | 24 |
| T-005 후 | 17 |
| T-006 후 | 5 |
| T-007 후 | 0 |

## T-008 (게이트 승격) 메모

설정·문서 authoring 이라 위임 가치가 음수다. **설계 세션이 직접 쓴다.**
내용: 루트 `package.json` 에 타입체크 스크립트 추가, `AGENTS.md` 의 게이트 정의 갱신,
`tsc -b --force` 로 캐시 무효화를 강제할 것(증분 캐시가 있으면 조용히 통과한다).
