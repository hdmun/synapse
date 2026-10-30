---
trigger: model_decision
description: Chokidar 파일 감시, 데이터 동기화(Syncer) 및 백그라운드 서비스 동작 규칙
---

# 백엔드 서비스 및 백그라운드 프로세스 규칙 (Backend Services & Background Processes)

## 파일 감시 (File Watching - Chokidar)
- **라이브러리**: 견고한 크로스 플랫폼 파일 시스템 감시를 위해 `chokidar`를 사용합니다.
- **패턴**: `FSWatcher` 인스턴스를 캡슐화하는 `Watcher` 클래스를 구현합니다.
- **디바운싱 (Debouncing)**: 빠른 연속 파일 쓰기 작업 중 불필요한 중복 처리를 방지하기 위해 파일 시스템 이벤트에 항상 디바운싱(예: 300ms)을 적용하세요.

## 데이터 동기화 (Data Synchronization - Syncer)
- **관심사 분리 (Separation of Concerns)**:
  - `Watcher`는 파일 시스템 이벤트 감지 및 동기화 트리거 역할만 담당해야 합니다.
  - `Syncer`는 데이터 읽기, 파싱 및 데이터베이스 영속화 로직을 담당해야 합니다.
- **회복 탄력성 (Resilience)**: 잘못된 형식의 파일로 인해 서비스가 비정상 종료되지 않도록 모든 파일 읽기 및 데이터베이스 작업에 `try-catch` 블록을 사용하세요.
- **초기 스캔 (Initial Scan)**: 서비스 시작 시 기존 파일과 데이터베이스의 정합성을 맞추기 위해 대상 디렉터리의 초기 전체 스캔을 수행해야 합니다. Bun 환경에서의 효율적인 파일 스캔을 위해 `Bun.Glob`을 활용하세요.

## 동시성 및 성능 (Concurrency & Performance)
- **원자적 연산 (Atomic Operations)**: 멱등성(Idempotent) 있는 동기화를 보장하기 위해 Drizzle의 `onConflictDoUpdate` 또는 `onConflictDoNothing`을 사용하세요.
- **자원 관리 (Resource Management)**: 서비스가 중지되거나 프로세스가 종료될 때 감시자(Watcher)와 데이터베이스 연결을 안전하게 해제하세요.
