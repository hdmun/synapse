# Gemini Monitor App (Synapse)

AI 코딩 에이전트(Gemini, GitHub Copilot 등)의 활동 내역을 실시간으로 수집, 동기화 및 시각화하기 위해 개발된 로컬 대시보드 애플리케이션입니다. 여러 로컬 프로젝트에 걸친 에이전트 상호작용 데이터를 단일 뷰에서 통합 관리하고 분석할 수 있습니다.

---

## 🌟 주요 특징 (Key Features)

*   **실시간 양방향 모니터링:** WebSocket(Socket.io)을 활용하여 에이전트의 세션 생성 및 메시지 교환을 지연 없이 실시간으로 대시보드에 반영합니다.
*   **다중 에이전트 통합 로깅:** Gemini CLI, GitHub Copilot 등 서로 다른 AI 어시스턴트의 세션 데이터를 정규화하여 하나의 통일된 타임라인으로 제공합니다.
*   **스마트 프로젝트 병합 (Project Consolidation):** 운영체제(Windows, macOS)에 따른 파일 시스템 경로의 대소문자 차이 및 구분자 불일치를 자동으로 정규화하여 중복 프로젝트 생성을 방지합니다.
*   **직관적인 UI/UX 대시보드:** React, TailwindCSS, Recharts 기반의 모던 웹 인터페이스를 통해 프로젝트별 활성화 상태, 세션 빈도, 메시지 분석 차트를 제공합니다.
*   **로컬 퍼스트 (Local First):** 모든 데이터는 로컬 SQLite 데이터베이스에 안전하게 저장되며, 외부로 전송되지 않아 프라이버시가 보장됩니다.

---

## 🛠 기술 스택 (Tech Stack)

이 프로젝트는 단일 레포지토리(Monorepo) 스타일로 프론트엔드와 백엔드를 모두 포함하고 있으며, 전 영역에 걸쳐 **TypeScript**를 사용합니다.

### Frontend
*   **프레임워크:** React 19, Vite
*   **상태 관리:** Zustand (전역 상태), React Router (라우팅)
*   **스타일링:** TailwindCSS, clsx, tailwind-merge
*   **UI/차트:** Recharts, Lucide React (아이콘)

### Backend
*   **런타임 환경:** Bun (빠른 실행 및 기본 TypeScript 지원)
*   **서버 프레임워크:** Fastify
*   **데이터베이스 & ORM:** SQLite (로컬 저장소), Drizzle ORM
*   **실시간 통신:** Socket.io
*   **파일 시스템 감시:** Chokidar
*   **스키마 검증:** Zod

---

## 📁 디렉토리 구조 (Directory Structure)

```text
synapse/
├── src/
│   ├── backend/         # Fastify 기반의 백엔드 서버
│   │   ├── controllers/ # 라우트 핸들러 및 비즈니스 로직
│   │   ├── db/          # Drizzle ORM 스키마 및 DB 설정
│   │   ├── routes/      # REST API 및 WebSocket 라우트 정의
│   │   ├── services/    # 데이터 동기화(SyncManager), 감시(Watcher) 로직
│   │   └── index.ts     # 백엔드 진입점
│   ├── frontend/        # React 기반의 프론트엔드 애플리케이션
│   │   ├── components/  # 재사용 가능한 UI 컴포넌트 (ProjectList, MessageViewer 등)
│   │   ├── store/       # Zustand 상태 관리
│   │   ├── App.tsx      # 메인 라우터 및 레이아웃
│   │   └── main.tsx     # 프론트엔드 진입점
│   └── shared/          # 프론트/백엔드 공통 타입 및 스키마 (Zod)
├── drizzle/             # 데이터베이스 마이그레이션 파일 (.sql)
├── scripts/             # 유지보수 및 DB 병합 등 유틸리티 스크립트
├── .gemini/rules/       # AI 에이전트를 위한 컨텍스트 및 아키텍처 가이드라인
├── package.json         # 의존성 및 스크립트 정의
└── README.md            # 프로젝트 소개 문서
```

---

## 🚀 시작하기 (Getting Started)

### 사전 요구 사항 (Prerequisites)
*   [Bun](https://bun.sh/) (버전 1.x 이상) 설치 필수. 이 프로젝트는 Node.js 대신 Bun 런타임을 사용하도록 최적화되어 있습니다.

### 설치 및 실행

1. **저장소 클론 및 이동:**
   ```bash
   git clone <repository-url>
   cd synapse
   ```

2. **의존성 설치:**
   ```bash
   bun install
   ```

3. **환경 변수 설정 (필요시):**
   루트 디렉토리에 `.env` 파일을 생성하고 필요한 포트나 데이터베이스 경로를 덮어쓸 수 있습니다. (기본값으로 동작 가능)

4. **개발 서버 동시 실행:**
   ```bash
   bun run dev
   ```
   *위 명령어는 `concurrently`를 사용하여 백엔드와 프론트엔드를 동시에 감시(watch) 모드로 실행합니다.*
   *   **Backend:** Fastify 서버가 시작되고 로컬 `gemini-monitor.db`에 연결됩니다.
   *   **Frontend:** Vite가 실행되며, 브라우저에서 `http://localhost:5173` 으로 자동 접속할 수 있습니다.

---

## 📜 사용 가능한 명령어 (Scripts)

`package.json`에 정의된 주요 명령어 목록입니다. 모든 명령어는 `bun run <script>` 형태로 실행합니다.

*   `dev`: 프론트엔드와 백엔드를 모두 감시 모드로 동시 실행합니다. (개발 시 권장)
*   `dev:frontend`: Vite 프론트엔드만 실행합니다.
*   `dev:backend`: Fastify 백엔드만 실행합니다.
*   `build`: 프론트엔드를 프로덕션 환경에 맞게 빌드합니다. (`dist` 폴더 생성)
*   `analyze`: 프론트엔드 번들 크기 분석 도구(Rollup Visualizer)를 실행합니다.
*   `test`: 프론트엔드 및 백엔드의 모든 단위 테스트를 실행합니다.
*   `test:frontend`: Vitest를 사용하여 프론트엔드 컴포넌트 테스트를 실행합니다.
*   `test:backend`: Bun 내장 테스트 러너를 사용하여 백엔드 API 및 서비스 로직을 테스트합니다.

---

## 🤝 기여 (Contributing)

이 프로젝트의 구조와 개발 규칙은 `.gemini/rules/` 폴더 내의 마크다운 문서들에 자세히 정의되어 있습니다. 코드를 기여하시기 전에 해당 가이드라인을 참조해 주시기 바랍니다.
(예: `architecture.md`, `typescript.md`, `backend-services.md` 등)

---

## 📄 라이선스 (License)

이 프로젝트는 오픈 소스 라이선스를 따릅니다. 자세한 권한 및 제한 사항은 [LICENSE](LICENSE) 파일을 확인하십시오.
