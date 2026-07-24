# Deoppler Blog Deployment Log

## 프로젝트 개요
- **저장소**: blog29
- **프레임워크**: Next.js 16.2.11 (App Router)
- **언어**: TypeScript
- **스타일**: Tailwind CSS 4
- **패키지 매니저**: npm
- **생성일**: 2026-07-24

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

---

## 다음 단계 계획
1. [ ] 블로그 콘텐츠 작성 (마크다운 포스트, 컴포넌트 등)
2. [ ] GitHub 원격 저장소 생성 및 연동 (`git remote add origin ...`)
3. [ ] Vercel 프로젝트 생성 및 Git 연동
4. [ ] 프리뷰 배포 및 프로덕션 배포 확인
5. [ ] 커스텀 도메인 설정 (선택 사항)
6. [ ] SEO 메타태그 및 OG 이미지 설정

---

## 참고
- Next.js 배포 가이드: https://nextjs.org/docs/deployment
- Vercel 배포 가이드: https://vercel.com/docs/deployments
- 이 로그 파일은 `blog29` 루트 디렉토리에 위치하며, Vercel 정적 빌드 대상에서 제외되지 않는 한 배포 시 포함됩니다. 블로그 콘텐츠로 노출되지 않도록 별도 라우팅을 생성하지 않았습니다.
