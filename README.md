# Gemini Monitor App (Synapse)

AI 코딩 에이전트(Gemini, GitHub Copilot 등)의 활동 내역을 수집, 동기화 및 사후 디버깅하기 위해 개발된 로컬 대시보드 애플리케이션입니다. 여러 로컬 프로젝트에 걸친 에이전트 상호작용 데이터를 단일 뷰에서 통합 관리하고 정적으로 분석할 수 있습니다.

---

## 🌟 주요 특징 (Key Features)

*   **백그라운드 자동 수집 & 사후 분석:** Chokidar를 기반으로 로컬 에이전트 활동 데이터를 백그라운드에서 안전하게 DB에 수집하고, 회고적 디버깅 및 분석을 위한 정적 UI를 제공합니다.
*   **다중 에이전트 통합 로깅:** Gemini CLI, GitHub Copilot 등 서로 다른 AI 어시스턴트의 세션 데이터를 정규화하여 하나의 통일된 타임라인으로 제공합니다.
*   **스마트 프로젝트 병합 (Project Consolidation):** 운영체제(Windows, macOS)에 따른 파일 시스템 경로의 대소문자 차이 및 구분자 불일치를 자동으로 정규화하여 중복 프로젝트 생성을 방지합니다.
*   **직관적인 UI/UX 대시보드:** React, TailwindCSS, Recharts 기반의 모던 웹 인터페이스를 통해 프로젝트별 활성화 상태, 세션 빈도, 메시지 분석 차트를 제공합니다.
*   **로컬 퍼스트 (Local First):** 모든 데이터는 로컬 SQLite 데이터베이스에 안전하게 저장되며, 외부로 전송되지 않아 프라이버시가 보장됩니다.

---

## 🛠 기술 스택 (Tech Stack)

이 프로젝트는 모노레포(Monorepo) 구조로 프론트엔드, 백엔드, 컬렉터, 공통 라이브러리를 나누어 관리하며, 전 영역에 걸쳐 **TypeScript**를 사용합니다.

### Frontend
*   **프레임워크:** React 19, Vite
*   **상태 관리:** Zustand (전역 상태), React Router (라우팅)
*   **스타일링:** TailwindCSS, clsx, tailwind-merge
*   **UI/차트:** Recharts, Lucide React (아이콘)

### Backend & Collector
*   **런타임 환경:** Bun (빠른 실행 및 기본 TypeScript 지원)
*   **서버 프레임워크:** Fastify
*   **데이터베이스 & ORM:** SQLite (로컬 저장소), Drizzle ORM
*   **파일 시스템 감시:** Chokidar
*   **스키마 검증:** Zod

---

## 📁 디렉토리 구조 (Directory Structure)

```text
synapse/
├── packages/
│   ├── backend/         # Fastify 기반의 백엔드 API 서버 및 Ingester
│   ├── collector/       # 다양한 AI 에이전트 로그 수집기 (Gemini, Claude, Copilot 등)
│   ├── frontend/        # React 기반의 정적 모니터링 및 분석 웹 애플리케이션
│   └── shared/          # 패키지 간 공유 타입 및 Zod 스키마
├── docs/                # 프로젝트 설정, 계획 및 ADR 문서
├── scripts/             # 유지보수 및 DB 관리 스크립트
├── package.json         # 모노레포 워크스페이스 정의 및 통합 스크립트
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

4. **개발 환경 동시 실행:**
   ```bash
   bun run dev
   ```
   *위 명령어는 `concurrently`를 사용하여 수집기(Collector), 백엔드(Backend), 프론트엔드(Frontend)를 동시에 실행합니다.*
   *   **Collector:** 로컬 에이전트 활동 로그를 감시하여 정규화된 세션 파일로 변환합니다.
   *   **Backend:** Fastify 서버가 Ingester를 구동하여 DB에 적재하고 REST API를 제공합니다.
   *   **Frontend:** Vite 정적 분석 대시보드가 실행되며, 브라우저(`http://localhost:5173`)에서 활동 내역을 회고할 수 있습니다.

---

## 📜 사용 가능한 명령어 (Scripts)

`package.json`에 정의된 주요 명령어 목록입니다. 모든 명령어는 `bun run <script>` 형태로 실행합니다.

*   `dev`: 컬렉터, 백엔드, 프론트엔드를 모두 동시 실행합니다. (개발 시 권장)
*   `dev:collector`: 수집기(Collector) 프로세스만 실행합니다.
*   `dev:backend`: Fastify 백엔드 API 서버만 실행합니다.
*   `dev:frontend`: Vite 프론트엔드 UI만 실행합니다.
*   `build`: 프론트엔드를 프로덕션 환경에 맞게 빌드합니다. (`dist` 폴더 생성)
*   `test`: 전체 워크스페이스 패키지의 단위 테스트를 실행합니다.
*   `db:generate`: Drizzle ORM 마이그레이션 파일을 생성합니다.
*   `db:migrate`: 데이터베이스에 마이그레이션을 적용합니다.

---

## 🤝 기여 및 개발 규칙 (Contributing & Rules)

이 프로젝트의 구조와 개발 규칙은 `.agents/rules/` 폴더 내의 마크다운 문서들에 정의되어 있습니다. 기여하시기 전에 해당 가이드라인을 참조해 주시기 바랍니다.
(예: `architecture.md`, `typescript.md`, `backend-drizzle-schema.md` 등)

---

## 📄 라이선스 (License)

이 프로젝트는 오픈 소스 라이선스를 따릅니다. 자세한 권한 및 제한 사항은 [LICENSE](LICENSE) 파일을 확인하십시오.
