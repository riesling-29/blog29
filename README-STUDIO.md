# blog29 Studio addon 0.1.0

기준일: 2026-09-13

기존 blog29-agent-upgrade-v1에 **사용자와의 공동 조사·토론 → 편집 기준본 → 블로그/발표 원고** 흐름을 추가한다. 모델/서버/하네스 설정은 그대로 둔다. 문서와 Hermes 스킬 1개이며 자동 수집 서버, watcher, 데이터베이스, 렌더러, 권한 강제 코드가 아니다.

## 제공 파일

```text
AGENTS.studio.append.md
.agents/skills/blog29-studio/SKILL.md
docs/blog29/STUDIO.md
docs/blog29/STUDIO-TEMPLATES.md
README-STUDIO.md
```

이번에 패키지 파일 구성, UTF-8 읽기, 스킬 frontmatter와 내부 파일 참조를 확인했다. 사용자 PC 적용, Hermes 스킬 로드, 실제 웹 조사, Qwen 도구 호출, PDF/PPTX 생성, Git/Vercel 발행은 테스트하지 않았다.

## 적용

1. `.agents/skills/blog29-studio/`와 `docs/blog29/STUDIO*.md`를 기존 blog29의 같은 상대 경로에 추가한다. 같은 이름의 기존 파일이 있으면 비교·병합한다. 기존 write/review 스킬을 대체하지 않는다.
2. `AGENTS.studio.append.md`의 블록을 기존 `AGENTS.md`에 병합한다. 기존 Next.js 안내와 발행 규칙은 보존한다. 같은 BEGIN/END 블록이 이미 있으면 중복 추가하지 않는다.
3. Hermes가 `.hermes.md`/`AGENTS.override.md` 등 다른 지침을 실제로 선택한다면 활성 지침에서 이 규칙을 읽도록 연결한다. 전체 지침을 모두 지우는 방식은 피한다.
4. 기존 `.agents/skills` 외부 디렉터리 등록이 살아 있으면 새 세션에서 `blog29-studio`의 실제 로드를 확인한다. 새 등록이 필요할 때만 아래 설정을 현재 사용 중인 프로필에 병합한다. 설정 파일 전체를 덮어쓰지 않는다.

```yaml
skills:
  external_dirs:
    - D:/ChantaResearchGroup/blog29/.agents/skills
```

WSL이면 실제 Linux 경로로 바꾼다. 로컬 Hermes 기본 스킬 디렉터리에 같은 이름이 있으면 외부 버전을 가릴 수 있으므로 실제 로드 경로를 확인한다. 스킬 로딩과 slash command 동작은 현재 Hermes 공식 문서를 기준으로 하며 설치 버전에서 확인해야 한다.

스킬 등록 없이도 `AGENTS.md`와 `docs/blog29/STUDIO.md`를 직접 읽으라고 요청하여 같은 절차를 사용할 수 있다.

## 최초 점검 요청

```text
이 저장소의 실제 적용 지침과 docs/blog29/STUDIO.md를 읽어줘.
아직 모델/서버/설정/의존성을 바꾸거나 commit/push하지 마.

현재 환경에서 다음 항목을 확인해줘.
- blog29-studio 스킬과 문서를 실제로 읽을 수 있는지
- 웹 검색과 원문 추출 도구가 모두 있는지와 실제 백엔드
- 로컬 파일 읽기·쓰기와 PDF 페이지 확인 수단
- .blog29-work가 Git 추적과 콘텐츠 로더/업로드 대상에서 제외되는지
- 발표용 renderer 설치 여부: 설치하지 말고 확인만

공개 공식 문서 한 건으로 검색→원문 읽기만 시험해줘.
비공개 파일 내용을 외부로 보내지 마.
확인 못한 항목은 미확인으로 표시해줘.
```

웹 도구가 비활성/미설정이면 현재 Hermes 문서의 `hermes tools`에서 Web Search & Extract를 확인한다. 이미 작동하는 백엔드는 유지한다. 검색 전용 provider는 원문 읽기 경로가 별도로 필요할 수 있다. 이 패키지는 키나 provider를 자동 등록하지 않는다.

## 일상 사용

아래 slash 뒤의 '시작/추가/정리'는 자연어 요청이다. 별도 CLI 서브커맨드나 파서가 아니다. 등록하지 않았다면 `/blog29-studio` 대신 'docs/blog29/STUDIO.md를 읽고 공동 조사 모드로 진행해줘'라고 요청한다.

### 시작

```text
/blog29-studio
주제: [탐구하려는 질문]
작업 폴더: .blog29-work/[slug]
내가 모은 자료는 해당 폴더의 inbox에 있어.
내 초기 생각: [아직 미정이어도 됨]

내 자료를 먼저 읽고, 공식 자료로 빈틈과 반대 근거를 추가 조사해줘.
최종 글이나 슬라이드는 아직 만들지 마.
첫 라운드는 중요한 쟁점만 정리하고 판단 질문 1~2개를 남겨줘.
검색 결과로 나에게 동의를 유도하지 말고 자료가 허용하는 강도를 지켜줘.
```

### 새 자료 / 계속 토론

```text
inbox에 자료를 추가했어. 새 자료만 먼저 확인해줘.
기존 논지에서 바뀌는 점과 유지되는 점을 비교하고,
어느 주장과 출력물이 재검토 대상인지 기록해줘.
아직 원고를 전부 다시 쓰지는 마.
```

### 구성 채택과 산출

```text
지금 정리한 구성으로 진행하자.
C003은 유보하고, 나머지 논지·근거·한계를 기준본 v1로 남겨줘.
그 기준본에서 블로그 초안과 15분 발표용 slides.md를 각각 작성해줘.
자료에 없는 사실을 집필 중 추가하지 마.
이번에는 로컬 원고까지만. 사이트 반영/commit/push는 하지 마.
```

위의 C003과 15분은 요청 예시다. 실제 토론에서 존재하는 주장 ID와 목적에 맞게 쓴다.

### 중단 / 재개

```text
오늘은 여기서 멈추자. 확정·유보·다음 조사 대상을 기록해줘.
```

```text
.blog29-work/[slug] 작업을 이어가자.
brief와 최근 discussion, 선택 기준본을 읽고 다음 미해결 쟁점부터 진행해줘.
이전 대화를 기억한다고 가정하지 마.
```

## 발표자료의 완료 범위

기본은 발표 원고(slides.md)와 발표 메모다. HTML/PDF/PPTX 변환까지는 실제 renderer가 있어야 한다. Marp 등 설치가 없으면 원고만 완료하고 렌더링은 미실행으로 보고한다. 편집 가능한 PPTX 생성기는 포함하지 않는다.

블로그는 기존 write/review/PUBLISHING 규칙을 재사용한다. 발표는 내용 검수 외에 페이지를 실제로 렌더링한 후 겹침·넘침·도표·출처·메모 노출을 따로 검사한다.

운영 규칙의 근거, 출처 기록 템플릿, 상태 전환, 수정 전파, 중단 기준은 `docs/blog29/STUDIO.md`에 있다.
