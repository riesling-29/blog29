# Blog29 · Seminars 통합 개편

2026-10-17. 기존 글 10편과 세미나 3편을 연결하는 구현입니다. 글의 제목·발행일·본문과 기존 `/blog/<slug>` 주소는 유지합니다.

## 화면 팔레트

라이트 모드는 기존 토스카나 색상을 유지합니다. 다크 모드는 사용자 피드백에 따라 검정에 가까운 녹색 배경 `#050907`, 카드 `#0D1510`, 밝기를 낮춘 아이보리 본문 `#D7D9CE`, 금빛 강조 `#B5A16F`로 조정했습니다. 보조 글자는 `#8E9C91`, 보조 강조는 차분한 브론즈·세이지로 맞춥니다. 읽기 순서 카드의 하단과 버튼·테마 선택도 밝은 면 대신 어두운 녹색 면으로 표현합니다. 색상은 `src/app/globals.css`의 테마 변수에서 관리합니다.

## 정보구조

- `/`: 질문과 주제에서 출발하는 홈, 입문 읽기 순서, 최근 글과 세미나.
- `/topics`, `/topics/<id>`: AI 에이전트 / 프로세스 인텔리전스 / AI 활용. 질문별 자료 묶음으로 같은 글에 여러 경로로 접근합니다.
- `/topics/operations`: 소개와 전체 목록에서 접근하는 운영 기록.
- `/blog`: 글 중심 목록. `/archive`는 글·세미나의 제목·요약·태그 통합 검색입니다. `q`, `topic`, `format` 쿼리로 조건을 보존합니다.
- `/seminars`, `/seminars/<id>`: 정적 세미나 안내와 해설·발표자료 연결. 기존 GitHub Pages 발표 주소를 유지합니다.

소속 경로는 대표 주제로 고정합니다. 왼쪽은 같은 주제의 자료, 오른쪽은 현재 글의 목차입니다. 좁은 화면에서는 별도 주제·목차 펼침으로 바뀝니다. 모바일에서도 본문 관련 링크는 본문 가까이에 남습니다.

## 읽기와 관계

`src/lib/catalog.ts`에서 주제·자료·관계 14개를 관리합니다. 관계는 배경 이해 / 더 깊게 / 비교하기 / 함께 보기로 구분하고 이유를 표시합니다. 관련 블록은 해당 절 끝에 삽입되며 원문 MDX는 수정하지 않습니다.

`headings.ts`는 렌더러와 목차에 같은 AST 기반 ID를 부여합니다. 제목을 바꾸면 기존 앵커에 영향이 있으므로 카탈로그 검증과 공유 링크를 함께 확인해야 합니다.

`ReadingHistoryProvider`는 현재 탭에서 실제로 클릭한 사이트 내부 이동만 메모리에 기록합니다. 일반 뒤로 가기와 명시적 복귀는 원래 절·스크롤 위치를 복원하도록 구현했습니다. 목차 이동은 방문 이력을 추가하지 않습니다. 직접 접속·새 탭·새로고침에는 출발지를 만들어 표시하지 않습니다. 방문 정보를 서버에 전송하지 않습니다.

외부 발표 화면으로 이동한 후에는 대응 해설·세미나 안내 링크로 돌아옵니다. 도메인 사이의 정확한 스크롤 복원은 보장하지 않습니다.

## 콘텐츠 추가

1. 기존 MDX frontmatter 규칙으로 글을 작성합니다.
2. `catalog.ts`의 `articleClassification`에 대표 주제와 필요한 보조 주제를 지정합니다.
3. 실제 도움이 되는 질문별 묶음과 관련 관계만 추가합니다. 연결 대상 절은 `slugHeading`과 실제 제목으로 지정합니다.
4. `node scripts/validate-catalog.mjs` 및 빌드를 실행합니다.

공개되지 않은 글은 목록·검색·관계·사이트맵에서 제외합니다. 새 공개 글의 분류 누락, 잘못된 관계·절은 검증 오류로 처리합니다. 관련 자료가 없는 글에 임의 추천을 채우지 않습니다.

## 검증과 남은 확인

```sh
npm ci
npm run lint
node scripts/validate-catalog.mjs
npm run build
```

2026-10-17 실행 결과: 린트, 카탈로그 검증과 운영용 빌드가 통과했습니다. 생성된 공개 HTML 23개에서 내부 링크 905개, 절 링크 317개, 로컬 그림 9개의 목적지를 확인했고 오류가 없었습니다. 원문 MDX의 변경도 없습니다.

빌드·타입·린트와 실제 생성 HTML의 링크·앵커를 검사합니다. CI도 같은 명령을 실행합니다. 카탈로그 검증은 사이트맵 생성 시 빌드에서도 실행됩니다.

실제 브라우저 검증은 이번 환경의 브라우저 접근 승인 차단으로 실행하지 못했습니다. 배포 전 다음 항목을 확인해야 합니다.

- 320/390px 및 데스크톱에서 홈·긴 글·세미나·검색의 가로 넘침과 대비.
- 하네스 재사용 글 → 배경 글의 지정 절 → 읽던 곳 복귀, 중첩 이동 C → B → A.
- 검색어·주제·형식 설정 후 글에 들어갔다가 뒤로 가면 조건과 위치 복원.
- 직접 깊은 절 URL / 새 탭에서 가짜 복귀 안내가 없는지.
- 모바일 펼침·목차 선택·키보드 초점·다크 모드.
- 기존 이미지, 긴 표·코드와 SAIF 긴 목차의 실제 읽기.

Search Console 계정 인증·사이트맵 제출·색인 상태 확인은 수행하지 않았습니다. 색인 완료 시점을 보장하지 않습니다.

## 반영 순서

Blog29의 새 세미나 상세 경로를 먼저 공개하고, Seminars의 연결 변경을 뒤이어 공개합니다. 운영 반영은 저장소의 발행 규칙에 따라 확인한 변경으로 진행합니다. 이전 경로 삭제나 데이터 이전은 없습니다. 문제가 있으면 각 저장소의 개편 커밋을 되돌려 기존 배포 경로로 재배포할 수 있습니다.

## 2026-10-18 — Corridor and surrounding map

The accepted direction is a shared topic/question corridor and an expanded reader,
with a local map for other resources and a separate in-document table of contents.
The homepage now presents topics and a mixed article/seminar list. Global navigation
no longer separates articles and seminars; existing URLs and format filters remain.

Reading breadcrumbs include the resource's first question in its primary topic.
This is a stable editorial address, not a claim about the visitor's entry route.
The existing reading-history mechanism still restores actual prior reading positions.
Map nodes use public catalog relationships; fallback peers are explicitly labelled
same-topic rather than prerequisite or recommended next reading. Unregistered
relationships are not invented. Full titles and relation explanations are available
in the expandable list. Mobile map and TOC use native disclosures.

Light: limestone ivory, olive, terracotta. Dark: near-black green, softened ivory,
restrained brass. Brand direction: precision in information, elegance in presentation;
no literal architectural or military ornaments. Original article bodies and slides
remain unchanged. Production release is separate from the existing draft preview.

## 2026-10-18 — One fixed map beside the article

The contextual rail now contains a single stable domain → question → resource map.
Every public resource appears once at its primary-topic address, including operating
notes. Secondary topic membership does not duplicate its position. Selecting another
article changes highlights, not domain or resource ordering. Registered outgoing and
incoming relationships are highlighted; incoming explanations are attributed to their
source rather than presented as the selected article's own recommendation.

Hover or keyboard focus reveals the full title, address and relationship explanation
in a small inspector within the same panel. One connection line appears only for the
inspected related resource. Real anchors preserve keyboard activation, browser back
and opening a new tab. On touch, the first tap previews and the second tap or the full
title opens the article. Preview-only taps are excluded from reading-history capture.
The map has collapse/expand controls. Expanded mode traps Tab, closes on Escape or the
backdrop and restores focus. On narrow screens the map opens from a native disclosure.
The document TOC is also a disclosure, separate from resource navigation.

The homepage starts with the archive title and resources rather than a slogan.
Paragraphs, figures, tables and code now share the left reading edge. Wide Markdown
tables are wrapped in a focusable, locally scrollable region. This corrects the old
centered narrow prose / full-width table mismatch without hiding oversized content.

The representative ai-agent-harness article was edited for repetition: 16,744 → 14,020
source characters (16.3% reduction). Section titles, code examples and figures remain;
its edit date is 2026-10-18. Other article bodies have not yet been tightened. This is
an editorial pass on existing material, not a fresh verification of external claims.

Validation includes one map address per public resource, stable placement under every
selection, incoming cross-topic relations, reciprocal-link deduplication and fallback
placement of new notes. Browser visual, touch and scroll testing remains blocked by
the previously declined browser access; build and generated HTML checks do not replace
those checks. The original production deployment remains separate from this preview.
