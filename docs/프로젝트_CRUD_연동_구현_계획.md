# 프로젝트 CRUD 연동 구현 계획서

**작성일**: 2026-01-30
**작성자**: Claude Code
**프로젝트**: TubeGAI MVP
**버전**: 1.0

---

## 📑 목차

1. [개요](#1-개요)
2. [현황 분석](#2-현황-분석)
3. [구현 목표](#3-구현-목표)
4. [기술 아키텍처](#4-기술-아키텍처)
5. [사전 작업](#5-사전-작업)
6. [화면별 구현 계획](#6-화면별-구현-계획)
7. [구현 순서](#7-구현-순서)
8. [예상 일정](#8-예상-일정)
9. [리스크 및 대응 방안](#9-리스크-및-대응-방안)
10. [참고 자료](#10-참고-자료)

---

## 1. 개요

### 1.1 배경

TubeGAI 프로젝트는 현재 모든 데이터를 Mock 데이터로 운영하고 있습니다. MVP 단계에서 실제 사용자 데이터를 처리하기 위해서는 데이터베이스 연동이 필수적입니다.

### 1.2 목적

본 문서는 **프로젝트 CRUD(Create, Read) 기능**을 실제 데이터베이스와 연동하는 구현 계획을 정의합니다.

### 1.3 범위

**구현 대상 화면**: 3개

- Dashboard Page (Projects 탭)
- Project List Page
- New Project Page

**구현 기능**:

- 프로젝트 목록 조회 (Recent, All)
- 프로젝트 생성
- 프로젝트 검색/필터링

**제외 사항** (Phase 2+):

- 프로젝트 수정 (Update)
- 프로젝트 삭제 (Delete)

---

## 2. 현황 분석

### 2.1 데이터베이스 스키마

데이터베이스 스키마는 이미 완성되어 있으며, Drizzle ORM을 사용하여 정의되어 있습니다.

**주요 테이블**:

- `tubegai.project` - 프로젝트 메인 테이블
- `tubegai.channel` - YouTube 채널 정보
- `tubegai.label` - 프로젝트 라벨/태그
- `tubegai.project_label` - 프로젝트-라벨 연결 (Many-to-Many)

### 2.2 현재 구현 상태

| 항목                | 상태      | 비고                      |
| ------------------- | --------- | ------------------------- |
| 데이터베이스 스키마 | ✅ 완료   | Drizzle ORM으로 정의 완료 |
| Migration 파일      | ✅ 완료   | `app/drizzle/migrations/` |
| 프론트엔드 UI       | ✅ 완료   | 3개 화면 모두 구현됨      |
| 데이터 레이어 구조  | ✅ 완료   | Mock 데이터로 작동 중     |
| 실제 DB 연동        | ❌ 미완료 | **본 작업의 목표**        |

### 2.3 기술 스택

| 분류        | 기술                     |
| ----------- | ------------------------ |
| Framework   | React Router v7 (SSR)    |
| ORM         | Drizzle ORM              |
| Database    | PostgreSQL (Supabase)    |
| 타입 시스템 | TypeScript (strict mode) |
| 패턴        | Data Layer Pattern       |

---

## 3. 구현 목표

### 3.1 핵심 목표

1. **Mock 데이터를 실제 데이터베이스 쿼리로 교체**
   - `app/common/data/project.data.ts` 함수들을 실제 DB 쿼리로 구현

2. **데이터 레이어 패턴 유지**
   - 코드 일관성 유지
   - 향후 API 전환 대비
   - 재사용성 및 테스트 용이성 확보

3. **타입 안정성 보장**
   - DB 스키마 ↔ TypeScript 타입 일치
   - 런타임 에러 최소화

### 3.2 성공 기준

- ✅ 사용자가 Dashboard에서 자신의 프로젝트 목록을 볼 수 있다
- ✅ 사용자가 Project List에서 모든 프로젝트를 검색/조회할 수 있다
- ✅ 사용자가 New Project 페이지에서 새 프로젝트를 생성할 수 있다
- ✅ 생성된 프로젝트가 데이터베이스에 저장된다
- ✅ 생성 후 자동으로 Script 편집 화면으로 이동한다

---

## 4. 기술 아키텍처

### 4.1 데이터 레이어 패턴

TubeGAI 프로젝트는 **데이터 레이어 패턴**을 채택하여 데이터 접근 로직을 별도 파일로 분리합니다.

```
┌─────────────────────────────────────────┐
│  Page Component (UI Layer)              │
│  dashboard-page.tsx                     │
│  - loader() 함수에서 데이터 요청        │
└──────────────┬──────────────────────────┘
               │ getRecentProjects(userId)
               ↓
┌─────────────────────────────────────────┐
│  Data Layer                             │
│  app/common/data/project.data.ts        │
│  - 데이터 접근 로직 캡슐화              │
│  - 타입 안정성 보장                     │
└──────────────┬──────────────────────────┘
               │ Drizzle ORM Query
               ↓
┌─────────────────────────────────────────┐
│  Database (PostgreSQL)                  │
│  Supabase                               │
└─────────────────────────────────────────┘
```

**패턴 선택 이유**:

1. ✅ 재사용성: 여러 페이지에서 같은 함수 사용 가능
2. ✅ 테스트 용이성: 데이터 로직만 독립적으로 테스트 가능
3. ✅ Migration 용이성: Mock → DB → API 쉽게 전환
4. ✅ 관심사 분리: UI 로직과 데이터 로직 명확히 구분
5. ✅ 타입 안정성: 함수 시그니처로 명확한 타입 정의

---

## 5. 사전 작업

### 5.1 데이터베이스 클라이언트 생성

**작업 내용**: `app/lib/db.server.ts` 파일 생성

**체크리스트**:

- [ ] `app/lib/` 디렉토리 생성
- [ ] `db.server.ts` 파일 생성
- [ ] 환경 변수 확인
- [ ] 타입 에러 없이 빌드 성공 확인

**예상 소요 시간**: 15분

---

## 6. 화면별 구현 계획

### 6.1 화면 1: Dashboard Page

**목표**: 최근 수정된 프로젝트 4개를 DB에서 조회

**수정 파일**:

1. `app/common/data/project.data.ts` - `getRecentProjects()` 수정
2. `app/common/types/project.types.ts` - 타입 수정
3. `app/features/project/pages/dashboard-page.tsx` - loader 수정
4. `app/lib/auth.server.ts` - 인증 헬퍼 생성

**예상 소요 시간**: 30분

---

### 6.2 화면 2: Project List Page

**목표**: 사용자의 모든 프로젝트 조회

**수정 파일**:

1. `app/common/data/project.data.ts` - `getProjects()` 수정
2. `app/features/project/pages/project-list-page.tsx` - loader 수정

**예상 소요 시간**: 40분

---

### 6.3 화면 3: New Project Page

**목표**: 새 프로젝트 생성 및 DB 저장

**수정 파일**:

1. `app/common/data/project.data.ts` - `createProject()` 추가
2. `app/features/project/pages/new-project-page.tsx` - action 추가

**예상 소요 시간**: 50분

---

## 7. 구현 순서

```
Step 0: 환경 준비 (5분)
  ↓
Step 1: 사전 작업 (15분)
  ↓
Step 2: Dashboard Page (30분)
  ↓
Step 3: Project List Page (40분)
  ↓
Step 4: New Project Page (50분)
  ↓
Step 5: 통합 테스트 (15분)
```

---

## 8. 예상 일정

| 단계 | 작업         | 소요 시간 | 누적 시간  |
| ---- | ------------ | --------- | ---------- |
| 0    | 환경 준비    | 5분       | 5분        |
| 1    | 사전 작업    | 15분      | 20분       |
| 2    | Dashboard    | 30분      | 50분       |
| 3    | Project List | 40분      | 1시간 30분 |
| 4    | New Project  | 50분      | 2시간 20분 |
| 5    | 통합 테스트  | 15분      | 2시간 35분 |

**총 예상 시간**: **2시간 35분**

---

## 9. 리스크 및 대응 방안

### 9.1 데이터베이스 연결 실패

**대응**: 환경 변수 검증 및 에러 핸들링 강화

### 9.2 타입 불일치

**대응**: 명시적 타입 지정 및 매핑 함수 사용

### 9.3 세션 관리

**대응**: requireAuth 헬퍼 함수 사용

---

## 10. 참고 자료

- [CLAUDE.md](../CLAUDE.md) - 프로젝트 설계 문서
- [ARCHITECTURE_COMPARISON.md](ARCHITECTURE_COMPARISON.md) - 아키텍처 비교
- React Router v7: https://reactrouter.com/
- Drizzle ORM: https://orm.drizzle.team/

---

**문서 끝**
