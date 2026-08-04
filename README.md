# Blog29

Next.js와 MDX로 운영하는 파일 기반 블로그입니다. 별도의 데이터베이스나 관리자 화면 없이,
`src/content/posts`에 글 파일을 추가하고 GitHub에 반영하면 Vercel이 새 버전을 빌드합니다.

## Vercel에서 동작하는 방식

이 디렉터리는 로컬에서 Vercel의 `blog29` 프로젝트에 연결되어 있습니다. `.vercel/project.json`은 연결 정보이므로
Git에 포함하지 않습니다.

Vercel의 기본 Git 배포 흐름은 다음과 같습니다.

- Production Branch가 아닌 브랜치 또는 Pull Request: 고유한 Preview 배포 생성
- Production Branch에 push 또는 merge: Production 배포 생성
- 빌드 성공: 해당 환경의 주소가 새 배포를 가리킴
- 빌드 실패: 기존 Production 배포는 그대로 유지됨

이 저장소는 `main`을 Production Branch로 사용한다는 전제로 운영합니다. 실제 대시보드 값은
**Vercel → blog29 → Settings → Environments → Production → Branch Tracking**에서 확인해야 합니다.

참고 문서:

- [Vercel Git 배포](https://vercel.com/docs/git)
- [Vercel 빌드 설정](https://vercel.com/docs/builds/configure-a-build)
- [Vercel 프로젝트 설정](https://vercel.com/docs/project-configuration)

## 새 글 작성

1. `src/content/posts/_template.mdx`를 복사합니다.
2. 복사본의 파일명을 영문 소문자와 하이픈으로 정합니다. 파일명이 URL slug가 됩니다.
3. frontmatter와 본문을 작성합니다.
4. 작성 중에는 `draft: true`, 공개할 때는 `draft: false`를 사용합니다.
5. `npm run lint`와 `npm run build`로 형식을 확인합니다.

예를 들어 파일명이 `why-i-use-mdx.mdx`라면 공개 주소는 `/blog/why-i-use-mdx`입니다.

### Frontmatter 규격

```yaml
---
title: "글 제목"
date: "2026-08-04"
updated: "2026-08-05" # 선택 사항
excerpt: "목록에 표시할 짧은 설명"
category: "기술"
tags: ["Next.js", "MDX"]
featured: false
draft: true
---
```

| 필드 | 필수 | 규칙 |
| --- | --- | --- |
| `title` | 예 | 비어 있지 않은 문자열 |
| `date` | 예 | `YYYY-MM-DD` |
| `updated` | 아니오 | 수정일, `YYYY-MM-DD` |
| `excerpt` | 예 | 목록과 메타데이터에 사용할 요약 |
| `category` | 예 | 대표 분류 하나 |
| `tags` | 예 | 하나 이상의 문자열 배열 |
| `featured` | 아니오 | 홈페이지 대표 글 여부 |
| `draft` | 아니오 | `true`이면 Production 빌드에서 제외 |

파일명이 `_`로 시작하면 템플릿이나 메모로 취급해 항상 글 목록에서 제외합니다.

## 로컬 확인

```bash
npm install
npm run dev
```

브라우저에서 `http://localhost:3000`을 엽니다. 배포 전에 다음 검사를 실행합니다.

```bash
npm run lint
npm run build
```

## 권장 배포 순서

```text
글 작성
  → 별도 브랜치에 커밋
  → GitHub에 push
  → Vercel Preview 확인
  → main에 merge
  → Vercel Production 배포 확인
```

`vercel.json`은 Next.js 프레임워크만 명시합니다. 빌드 명령과 출력 디렉터리는 Vercel의 Next.js 기본값을 사용합니다.
Git 자동 배포와 PR 댓글 설정은 최신 Vercel 기준으로 프로젝트 대시보드에서 관리합니다.
