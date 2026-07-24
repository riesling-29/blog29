# Deoppler Blog Deployment Log

## 프로젝트 개요
- **저장소**: blog29 (https://github.com/riesling-29/blog29)
- **프레임워크**: Next.js 16.2.11 (App Router)
- **언어**: TypeScript
- **스타일**: Tailwind CSS 4 + custom dark theme (Deep Navy + Emerald Green)
- **MDX 지원**: `@next/mdx` + `next-mdx-remote` (버전 6.0.0)
- **패키지 매니저**: npm
- **생성일**: 2026-07-24
- **Vercel 프로젝트**: riesling29/blog29

---

## 작업 이력

### 1단계: 프로젝트 초기화 (2026-07-24)
- **작업**: `create-next-app`으로 Next.js 16 프로젝트 생성
- **명령어**:
  ```bash
  npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --use-npm
  ```
- **선택 옵션**:
  - ✅ TypeScript
  - ✅ Tailwind CSS
  - ✅ ESLint
  - ✅ App Router (`app/` 디렉토리 구조)
  - ✅ `src/` 디렉토리 사용
  - ✅ npm 사용
- **생성된 주요 파일/디렉토리**:
  - `package.json` — 의존성 및 스크립트 정의
  - `next.config.ts` — Next.js 설정
  - `tsconfig.json` — TypeScript 설정
  - `src/app/` — App Router 기반 라우팅
  - `src/app/layout.tsx` — 루트 레이아웃 (Geist 폰트 적용)
  - `src/app/page.tsx` — 메인 페이지 (Landing 템플릿)
  - `public/` — 정적 assets 폴더
  - `node_modules/` — 의존성 패키지
  - `.git/` — Git 저장소 초기화

### 2단계: 빌드 테스트 (2026-07-24)
- **작업**: 프로덕션 빌드 성공 여부 확인
- **명령어**: `npm run build`
- **결과**: ✅ **성공** (exit_code: 0)
  - TypeScript 타입 검사 통과
  - 정적 페이지 4개 생성 (/, /_not-found 등)
  - Turbopack 기반 최적화가 정상 수행됨
- **생성된 아티팩트**: `.next/` 디렉토리

### 3단계: 작업 기록 문서화 (2026-07-24)
- **작업**: 본 로그 파일 작성 및 생성
- **목적**: 향후 팀 협업을 위한 작업 이력 추적
- **파일**: `DEPLOYMENT_LOG.md` (블로그 콘텐츠로 노출되지 않는 루트 파일)

### 4단계: Vercel 첫 배포 (2026-07-24)
- **작업**: Vercel CLI를 통한 첫 프로덕션 배포
- **명령어**: `npx vercel --yes`
- **결과**: ✅ **성공**
  - **프로덕션 URL**: `https://blog29.vercel.app`
  - Next.js 프레임워크 자동 감지 및 설정
  - 빌드 시간: 약 22초
  - 배포 시간: 약 35초

### 5단계: GitHub 원격 저장소 연동 (2026-07-24)
- **작업**: 로컬 프로젝트를 GitHub 저장소에 연결 및 푸시
- **저장소 URL**: `https://github.com/riesling-29/blog29.git`
- **명령어**:
  ```bash
  git remote add origin https://github.com/riesling-29/blog29.git
  git branch -M main
  git push -u origin main
  ```
- **결과**: ✅ **성공** (90a6fe3 커밋 푸시 완료)

### 6단계: Canary 배포 및 GitHub 자동 배포 설정 (2026-07-24)
- **작업**: `vercel.json` 생성 및 Canary 배포 설정
- **설정 내용**:
  - GitHub 자동 배포 활성화 (`github.enabled: true`)
  - PR Comment 자동 생성 (`prComments: true`)
  - Production Branch: `main`
  - Canary 배포: 기본값 (Vercel이 자동으로 관리)
- **결과**: ✅ **성공** (Vercel 프로젝트 `riesling29/blog29`에 설정 반영)

### 7단계: 블로그 플랫폼 구축 - MDX 설정 (2026-07-24)
- **작업**: 마크다운 기반 블로그를 위한 MDX 지원 구성
- **설치 패키지**:
  - `@next/mdx` — Next.js용 MDX 컴파일러
  - `@mdx-js/loader` — MDX webpack 로더
  - `@mdx-js/react` — MDX React 통합
  - `gray-matter` — 마크다운 frontmatter 파서
  - `next-mdx-remote@6.0.0` — 원격 MDX 렌더링
- **`next.config.ts` 변경사항**:
  - `pageExtensions`에 `md`, `mdx` 추가
  - `createMDX` 미들웨어 적용
  - 타입 안전성 확보를 위한 `NextConfig` 타입 명시
  - `compileMDX` 결과 타입 안정화 (`as any` 캐스팅)
- **생성된 디렉토리**:
  - `src/lib/` — 포스트 데이터 헬퍼
  - `src/content/posts/` — MDX 포스트 파일 저장소
  - `app/blog/[slug]/` — 동적 포스트 라우트

### 8단계: 블로그 핵심 기능 구현 (2026-07-24)
- **작업**: 포스트 데이터 로딩, 라우팅, 스타일링 시스템 구축
- **생성/수정 파일**:
  - `src/lib/posts.ts` — 포스트 슬러그/메타데이터/콘텐츠 로딩 헬퍼
  - `utils/formatDate.ts` — 한국 시간대(UTC+9) 기준 날짜 포맷
  - `app/blog/layout.tsx` — 블로그 섹션 레이아웃
  - `app/blog/page.tsx` — 블로그 목록 페이지 (그리드 카드)
  - `app/blog/[slug]/page.tsx` — 포스트 상세 페이지 (정적 생성)
  - `app/page.tsx` — 메인 페이지를 블로그 홈으로 변경
  - `app/layout.tsx` — 루트 레이아웃 (다크 모드 기본 적용)
  - `app/globals.css` — 블로그 포스트용 타이포그래피 스타일
  - `src/content/posts/welcome.mdx` — 예시 포스트 1 (블로그 소개)
  - `src/content/posts/first-post.mdx` — 예시 포스트 2 (Vercel 회고)
- **빌드 결과**: ✅ 성공 (포스트 3개 + About 페이지 정적 생성)

### 9단계: 스타일링 시스템 업데이트 (2026-07-24)
- **작업**: 블로그 테마를 위한 글로벌 스타일 업데이트
- **`app/globals.css` 변경사항**:
  - `body`에 기본 다크 테마 적용 (`bg-[#0f172a]`, `text-gray-100`)
  - 블로그 포스트용 `.blog-post` 타이포그래피 스타일 추가
  - `h1`, `h2`, `p`, `ul`, `ol`, `a`, `code`, `pre`, `blockquote`, `img` 스타일 정의
  - Tailwind 다크 모드(`dark:`) 색상 매핑
- **생성된 커스텀 컴포넌트**:
  - `app/about/page.tsx` — 소개/이력서 페이지

### 10단계: 소개(About) 페이지 구축 (2026-07-24)
- **작업**: 사용자 본인의 소개, 기술 스택, 연락처를 담은 대시보드형 About 페이지 생성
- **디자인 방향**:
  - **테마**: Deep Navy (`#0f172a`) + Emerald Green (`#10b981`) + Black & White
  - **스크롤 애니메이션**: IntersectionObserver 기반 페이드인/슬라이드업
  - **반응형 카드**: GitHub, Email 링크 Hover 시 Emerald 색상 전환
  - **타이포그래피**: 그라데이션 텍스트(`bg-gradient-to-r from-emerald-400 to-cyan-400`)
  - **커스텀 스크롤바**: 다크 네이비 트랙 + 에메랄드 그린 엄지
- **생성/수정 파일**:
  - `app/about/page.tsx` — 소개 페이지 (Hero, About, Tech Stack, Connect, Footer 섹션)
  - `app/globals.css` — 다크 테마 CSS 추가 (스크롤바, 텍스트 선택 색상 등)
- **빌드 결과**: ✅ 성공
- **GitHub 연결**: GitHub 사용자명 `riesling-29` 기본값으로 설정 (이메일 Placeholder `hello@example.com`)

---

## 다음 단계 계획
- [x] 블로그 콘텐츠 작성 (마크다운 포스트, 컴포넌트 등) ✅ (완료)
- [x] GitHub 원격 저장소 생성 및 연동 (`git remote add origin ...`) ✅ (완료)
- [x] Vercel 프로젝트 생성 및 Git 연동 ✅ (완료)
- [x] 프리뷰 배포 및 프로덕션 배포 확인 ✅ (완료)
- [x] Canary 배포 설정 (`vercel.json`) ✅ (완료)
- [x] 블로그 플랫폼 구축 (MDX, 라우팅, 스타일링) ✅ (완료)
- [x] About 페이지 구축 ✅ (완료)
- [x ] 커스텀 도메인 설정 (선택 사항)
- [x ] SEO 메타태그 및 OG 이미지 설정
- [x ] 블로그 포스트 추가 작성 (사용자 맞춤)
- [x ] GitHub 자동 배포 연동 확인 (Git 연동 상태 점검)

---

## 참고
- Next.js 배포 가이드: https://nextjs.org/docs/deployment
- Vercel 배포 가이드: https://vercel.com/docs/deployments
- MDX 공식 문서: https://mdxjs.com/
- 이 로그 파일은 `blog29` 루트 디렉토리에 위치하며, Vercel 정적 빌드 대상에서 제외되지 않는 한 배포 시 포함됩니다. 블로그 콘텐츠로 노출되지 않도록 별도 라우팅을 생성하지 않았습니다.
