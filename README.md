# blog29 Agent Upgrade

**대상:** Hermes Agent + TabbyAPI + Qwen3.8-27B 양자화 모델로 한국어 블로그 집필, Git → Vercel 발행.
**작성/공식 문서 확인 기준:** 2026-09-12.

이것은 새로운 에이전트 프레임워크가 아니라 기존 Hermes가 읽을 지침과 선택적 진단 도구다. 새 CMS, 벡터 DB, 멀티에이전트, 클라우드 LLM으로 교체하지 않는다.

## 실제로 확인한 범위
사용자가 첨부한 AGENTS.md에는 Next.js 문서를 먼저 읽으라는 기본 안내만 있었다. 그 블록을 새 AGENTS.md 맨 아래에 그대로 보존했다. 집필·근거·검토·발행 구분은 새로 설계한 부분이다.

연결된 저장소 검색에서 현재 blog29 저장소를 특정하지 못했고 package.json, 실제 콘텐츠 스키마, 대표 글, Vercel 설정은 이 환경에서 읽지 못했다. 따라서 경로·front matter·빌드 명령·운영 브랜치를 하드코딩하지 않았다. 최초 실행 때 실제 파일을 읽어 결정하도록 만들었다. 이전에 알려진 로컬 경로 `D:\ChantaResearchGroup\blog29`는 시작 위치 예시에만 사용했다.

도구 스크립트는 Python 3.10 이상 표준 라이브러리만 사용한다. Linux 제작 환경에서 24개 테스트를 실행해 통과했다. 테스트에는 로컬 모의 HTTP/SSE 서버를 이용한 왕복 검사가 포함된다. **실제 Qwen/Tabby/Hermes 통합, Windows 실행, blog29 빌드, Git 푸시, Vercel 배포는 여기서 실행하지 않았다.**

## 구성
```text
AGENTS.md                         # 핵심 규칙. 약 4,100자. 원본 Next.js 블록 보존.
.blog29/
  editorial.md                    # 문체/자료/논증 편집 기준
  workflow.md                     # 조사 → 초안 → 검토 → 재개
  release.md                      # 로컬 반영, Preview, Production 구분
  runtime.md                      # Hermes/Tabby/Qwen 연결 점검과 공식 근거
  evaluation.md                   # 기존 방식과 비교할 과제/철회 기준
  templates/                      # brief / repository / sources / state / review
scripts/blog29/
  tabby_smoke.py                   # 모의 도구로 API 왕복 진단
  check_draft.py                   # 눈에 띄는 원고 오류 보조 검사
tests/blog29/test_helpers.py      # 오프라인 테스트
```

AGENTS.md만 설치해도 핵심 절차를 사용할 수 있다. 나머지 파일은 상세 지침/템플릿/진단용이다. 일반 `.blog29` 문서는 자동 로딩 스킬이 아니며 필요한 단계에서 읽도록 안내한다. `/blog` 같은 새 슬래시 명령을 설치하지 않는다. 전체 지침을 전역 SOUL.md에 넣지 않는다.

## 설치
먼저 기존 AGENTS.md와 동일 이름 파일을 저장소 밖에 백업한다. ZIP 안의 파일들을 blog29 루트에 **폴더 구조를 유지해** 복사/병합한다. 기존 다른 파일은 삭제하지 않는다. 다른 사용자 지침이 있는 저장소라면 통째로 덮어쓰지 말고 충돌하는 규칙을 검토한다.

`.gitignore`에는 다음 내용을 추가한다. 기존 파일 전체를 덮어쓰지 않는다.

```gitignore
# Local blog29 working notes; not intended for publication
/.blog29-work/
```

이미 추적되는 작업 메모가 있다면 위 규칙만으로 추적이 해제되지 않는다. 아래 명령으로 제외/추적 상태를 확인한다. 이 패키지는 추적 해제나 파일 삭제를 자동으로 하지 않는다.

```powershell
Set-Location 'D:\ChantaResearchGroup\blog29'
git check-ignore .blog29-work/probe.txt
git ls-files .blog29-work
hermes
```

Git에서 제외되더라도 사이트의 콘텐츠 로더가 해당 폴더를 읽는다면 안전한 초안 폴더가 아니다. 첫 요청으로 실제 로더도 확인시킨다. 둘 중 하나라도 확인 못 하면 저장소 밖 로컬 작업 폴더를 사용한다.

Hermes 공식 문서상 `.hermes.md`/`HERMES.md`, `AGENTS.override.md` 등이 AGENTS.md보다 우선할 수 있다. 해당 파일이 있으면 지우지 말고 기존 지침에서 AGENTS.md를 읽도록 연결하거나 첫 요청에 명시한다. 자세한 내용은 `.blog29/runtime.md`에 있다.

## 처음 Hermes에 입력할 요청
```text
루트 AGENTS.md를 실제로 읽고 이번 세션에 적용해줘.
현재 blog29 저장소의 글쓰기 구조를 확인해줘.

package.json/lockfile, 콘텐츠 로더와 front matter 스키마,
대표 글 2개, 현재 Git 변경 상태를 필요한 범위만 읽어줘.
.blog29-work가 Git과 콘텐츠 로더 양쪽에서 제외되는지도 확인해줘.

사이트 콘텐츠는 수정하지 말고, 확인된 안전한 로컬 작업 공간에
repository.json과 짧은 문체 요약을 남겨줘.
모르는 항목은 미확인으로 표시하고, 커밋·푸시·배포는 하지 마.
```

## 평소 집필 요청
```text
주제: [이번 글의 주제]
독자: [예: AI 에이전트를 처음 실무에 적용하는 분석가]
핵심 관점: [전달하고 싶은 생각. 아직 가설이면 가설이라고 적기]
자료: [공개 링크 또는 로컬 파일]

기존 blog29 문체를 참고하고, 제공 자료에 없는 경험과 성과는 만들지 마.
자료를 요약·재작성하는 범위로 초안과 검토까지 완료해줘.
외부 자료 보완이 필요하면 보완 필요 지점으로 구분해줘.
기본 DRAFT 모드로 진행하고 실제 사이트 반영·커밋·푸시는 하지 마.
```

새로운 공개 자료 조사까지 원할 때는 '외부 조사도 수행하고, 제공 자료와 추가 조사 내용을 구분해줘'라고 요청한다. 검색/읽기 도구가 없으면 최신 자료를 조사했다고 주장하지 않도록 지침에 포함했다.

검토한 초안을 사이트 파일로 옮길 때:
```text
검토된 [초안 경로]를 실제 콘텐츠 스키마에 맞춰 반영해줘.
이 글과 필요한 자산만 수정하고, 존재하는 프로젝트 검사/빌드를 실행해줘.
커밋·푸시·배포는 아직 하지 마.
```

Preview까지 요청할 때는 목적지와 작업 브랜치를 포함해 한 번에 승인할 수 있다. 매 단계마다 반복 질문하도록 설계하지 않았다. 운영 발행은 운영 브랜치와 대상 변경을 확인한 뒤 별도로 승인한다.

## API 연결 진단
인증이 설정된 Tabby는 현재 터미널의 `TABBY_API_KEY` 환경변수를 설정한 뒤 사용한다. 키를 스크립트·원고·로그에 붙여 넣지 않는다. 스크립트가 Hermes 인증 설정을 자동으로 읽거나 변경하지는 않는다.

```powershell
python .\scripts\blog29\tabby_smoke.py --list-models
python .\scripts\blog29\tabby_smoke.py
```

서버가 반환한 모델이 여럿이면 `--model '실제 ID'`를 지정한다. 기본 주소는 `http://127.0.0.1:5000/v1`이다. 비로컬 주소는 검토 후 `--allow-remote`를 붙여야 한다. 프록시 환경변수와 HTTP 리다이렉트는 진단 코드가 사용하지 않는다.

기본 진단은 non-thinking 요청이다. 실제 집필 모드가 thinking이면 같은 모드로도 확인한다.
```powershell
python .\scripts\blog29\tabby_smoke.py --thinking --max-tokens 4096
```

이 프로그램은 모의 tool의 결과만 반환하며 실제 shell이나 파일 도구를 실행하지 않는다. 통과 후 Hermes에서 무해한 파일 읽기 → 임시 파일 쓰기 → 다시 읽기까지 별도로 시험해야 실제 실행 경로를 확인할 수 있다. 임시 파일도 Git 제외/로더 제외가 확인된 작업 공간에만 만든다.

## 원고 보조 검사
```powershell
python .\scripts\blog29\check_draft.py .\.blog29-work\example\draft.md `
  --sources .\.blog29-work\example\sources.json

python .\scripts\blog29\check_draft.py .\.blog29-work\example\draft.md `
  --sources .\.blog29-work\example\sources.json --publication
```

위 경로는 예시다. 실제 작업 공간/slug를 사용한다. 검사기는 읽기만 한다. 빈 원고, 일부 토큰/키 모양, 코드 펜스, 채팅 인용 마커, 미해결 placeholder, sources.json의 일부 형식을 검사한다. 공개 모드에서는 일부 미해결 표시를 오류로 올린다.

**이 도구는 MDX/YAML 전체 문법, 문장과 출처의 의미적 일치, 모든 비밀정보, 링크 생존 여부를 검증하지 않는다.** 이 한계 때문에 content loader·빌드·사람의 내용 검토를 대체하지 않는다. 키 모양의 공개 예제나 도구 형식에 관한 글은 오탐이 날 수 있으므로 자동 발행의 단독 조건으로 쓰지 않는다.

## Git / Vercel
이 패키지는 Vercel 설정이나 GitHub Actions를 설치하지 않는다. 기존 Git 연동을 유지한다. Vercel 공식 문서가 설명하는 Git 기반 Preview/Production 분리는 실제 프로젝트 연결과 설정이 되어 있을 때 적용된다. Preview가 보호되었다고 확인하지 못했다면 공개 환경으로 취급한다.

AGENTS.md에 '푸시 금지'라고 쓰는 것은 모델 행동 지침이지 강제 보안 장치가 아니다. 실제 보호가 필요하면 Git/배포 자격증명과 실행 승인, 브랜치 보호 등으로 제한해야 한다. 이 설정은 여기서 변경하지 않았다.

공식 배포 근거:
- `https://vercel.com/docs/git`
- `https://vercel.com/docs/deployments/environments`
- `https://vercel.com/academy/svelte-on-vercel/preview-deployments`

## 테스트 재실행
```powershell
python -m unittest discover -s tests/blog29 -v
```

개선 효과·속도·도구 성공률은 사용자 환경에서 아직 알 수 없다. `.blog29/evaluation.md`의 동일 조건 비교를 기준으로 유지/축소/철회 여부를 판단한다. Hermes/Tabby, 모델 템플릿/양자화, 블로그 스키마가 바뀌면 재점검한다.
