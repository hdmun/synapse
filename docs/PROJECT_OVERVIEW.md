# Synapse 프로젝트 개요

Synapse는 다양한 AI 도구(Gemini, Copilot, Claude, Codex)의 활동을 추적하고 모니터링하기 위한 통합 플랫폼입니다. 로컬 파일 시스템을 감시하고 데이터를 수집하여 실시간으로 대시보드에 시각화합니다.

## 기술 스택
- **언어**: TypeScript
- **런타임**: Bun
- **백엔드**: Fastify (서버), Drizzle ORM (데이터베이스), SQLite (데이터 저장), Socket.io (실시간 통신)
- **프론트엔드**: React, Zustand (상태 관리), React Router, Tailwind CSS, Recharts (데이터 시각화), react-activity-calendar (활동 히트맵)
- **데이터 검증**: Zod

## 핵심 아키텍처 및 기능

### 1. 백엔드 (src/backend/)
- **데이터 수집 (Collectors)**: Gemini, Copilot, Claude, Codex 등 각 AI 도구의 활동 데이터를 수집하는 서비스입니다.
- **동기화 (SyncManager)**: 수집된 데이터를 통합하여 데이터베이스에 저장하고, Socket.io를 통해 프론트엔드로 실시간 업데이트를 보냅니다.
- **API 서버**: 프로젝트, 세션, 메시지, 통계 데이터를 제공하는 REST API를 구현합니다.
- **데이터베이스 (Drizzle & SQLite)**: 데이터를 체계적으로 관리하며, 특히 **FTS5(Full-Text Search)**를 통한 빠른 메시지 내용 검색 기능을 지원합니다.

### 2. 프론트엔드 (src/frontend/)
- **상태 관리**: `useStore`를 통해 프로젝트, 세션, 메시지 데이터를 관리합니다.
- **시각화**: 대시보드에서 `Recharts`를 활용한 토큰 사용량 통계와 `react-activity-calendar`를 통한 활동 히트맵을 제공합니다.
- **실시간 통신**: Socket.io 클라이언트를 사용하여 백엔드로부터 실시간 업데이트(`session-update`)를 수신하고 상태를 업데이트합니다.
- **UI/UX**: 대시보드, 프로젝트 목록, 세션 목록, 메시지 뷰어 등 체계적인 컴포넌트 구조를 가집니다.

### 3. 공유/데이터 모델 (src/shared/)
- **Schema**: Zod를 사용하여 프로젝트, 세션, 메시지 등 데이터 구조를 정의하며, 프론트엔드와 백엔드 간 타입 안전성을 보장합니다. 별도로 `src/backend/db/schema.ts`에서 Drizzle 전용 스키마를 관리합니다.

## 주요 워크플로우
1. **데이터 수집**: 각 Collector가 파일 시스템을 감시하여 활동 데이터를 획득합니다.
2. **동기화**: `SyncManager`가 수집된 데이터를 처리하여 DB에 저장합니다.
3. **실시간 푸시**: `SyncManager`가 `session-update` 이벤트를 발생시켜 Socket.io로 전송합니다.
4. **UI 업데이트**: 프론트엔드가 이벤트를 수신하여 Zustand 스토어를 업데이트하고 화면을 갱신합니다.

## 알려진 이슈 및 개선 사항
- **실시간 동기화 페이로드 불일치**: 현재 `SyncManager`가 전송하는 데이터 구조와 프론트엔드(`App.tsx`)가 기대하는 `SocketUpdatePayload` 구조 간에 불일치가 있어 실시간 UI 업데이트가 정상 작동하지 않을 수 있습니다. 수정이 필요합니다.

## 프로젝트 관리 및 유지보수
- 모든 설정 및 에이전트 상세 정보는 `AGENTS.md`를 참조하십시오.
- 코드 스타일, 구조, 테스트 등 기술적 제약 사항은 `.gemini/rules/` 하위의 마크다운 파일들에 정의되어 있습니다. 에이전트 작업 시 반드시 준수해야 합니다.
