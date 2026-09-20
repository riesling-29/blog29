# Hermes + TabbyAPI + Qwen3.8-27B 연결 점검

문서 확인 기준: 2026-09-12. 아래 설정은 공식 문서에서 확인한 인터페이스와 점검 후보다. 사용자의 설치 버전·양자화본·템플릿은 이 패키지 작성 환경에서 실행하지 않았다. 기존에 정상 동작하는 설정은 먼저 보존한다.

## 1. Hermes가 지침을 읽는지 확인
공식 Context Files 문서상 `.hermes.md`/`HERMES.md`와 `AGENTS.override.md`는 AGENTS.md보다 먼저 선택될 수 있다. 상위 우선순위 파일이 존재하면 AGENTS.md를 바꿔도 자동 로딩되지 않을 수 있다. 기존 파일을 삭제하지 말고 어떤 지침이 실제 로딩되는지 확인한다. 필요한 경우 기존 프로젝트 지침 안에서 루트 AGENTS.md를 읽도록 연결하거나, 새 세션 첫 요청에서 명시적으로 읽게 한다.

전역 SOUL.md를 블로그 지침으로 덮어쓰지 않는다. 이 패키지의 `.blog29/*.md`는 Hermes 자동 등록 스킬이 아니다. 루트 지침이 필요한 문서를 읽도록 안내하는 일반 Markdown이다.

CLI는 저장소 디렉터리에서 시작한다. 현재 설치된 Hermes의 도움말과 로딩 표시도 확인한다. 아래는 기존 Windows 경로를 사용한 예다.

```powershell
Set-Location 'D:\ChantaResearchGroup\blog29'
hermes
```

## 2. Tabby endpoint를 그대로 연결
Hermes 공식 설정 경로는 터미널에서 `hermes model` → Custom endpoint → API base URL, API key, Model name 입력이다. 기본 예시 주소는 `http://127.0.0.1:5000/v1`이다. WSL/컨테이너 안에서 Hermes를 실행하면 그 환경에서 실제로 도달 가능한 주소인지 별도로 확인한다.

모델 이름은 마케팅 명칭이 아니라 해당 서버의 `/v1/models` 응답의 정확한 ID를 쓴다. 모델 경로/양자화 파일명은 임의로 정하지 않는다. 키는 프로젝트 파일이나 Git에 넣지 않는다. 이 진단 스크립트는 인증이 필요한 경우 프로세스 환경변수 `TABBY_API_KEY`를 읽는다. 이것은 스크립트용 변수이며 Hermes 설정을 자동 변경하지 않는다.

```powershell
python .\scripts\blog29\tabby_smoke.py --list-models
# 서버에 모델 ID가 하나면 진단 시 자동 선택한다.
python .\scripts\blog29\tabby_smoke.py
# 여러 개면 실제 출력된 ID를 명시한다.
python .\scripts\blog29\tabby_smoke.py --model '실제-서버-모델-ID'
```

`--list-models`는 모델 목록만 읽고 생성 요청을 하지 않는다. 실제 진단은 1회당 작은 생성 요청 5개를 순차 전송한다. 실제 shell/file 도구를 실행하지 않고 모의 함수 결과만 돌려준다. 프롬프트와 반환 데이터는 합성 테스트 값이다. 서버의 자체 로깅 정책은 별개다.

## 3. tool_format / reasoning / thinking은 다른 설정
TabbyAPI 공식 문서는 `tool_format`을 비워 두면 서버가 모델의 tool call을 파싱하지 않는다고 설명한다. 모델이 XML처럼 보이는 텍스트를 썼다는 것과 API가 구조화된 `tool_calls`를 전달했다는 것은 다르다.

아래는 **기존 Tabby config.yml의 model 블록에 병합해 점검할 후보**다. 별도의 model 블록을 중복 추가하거나 기존 model_name·메모리·캐시 설정을 지우지 않는다.

```yaml
model:
  reasoning: true
  reasoning_start_token: "<think>"
  reasoning_end_token: "</think>"
  tool_format: qwen3_coder
```

공식 표에서 `qwen3_5`는 `qwen3_coder`의 별칭이다. Qwen3.8-27B 공식 chat_template.jinja가 `<tool_call>` 안에 `<function=...>` / `<parameter=...>`를 쓰는 것도 확인했다. 이를 근거로 위 파서를 점검 후보로 선택했다. 다만 Tabby 지원 표가 Qwen3.8을 별도 명시하지 않으므로 특정 양자화본에서의 완전 호환성을 보장하지 않는다. 실제 로드한 템플릿과 아래 왕복 테스트로 판단한다.

`reasoning: true`는 추론 텍스트와 최종 응답을 나누는 파서 설정이다. 모델의 thinking 생성을 켜고 끄는 `enable_thinking`과 같은 의미가 아니다. 원고 본문에 추론/도구 마커가 섞이지 않는지도 확인한다.

## 4. 추론 강도와 문맥
확인한 Qwen3.8-27B 공식 템플릿은 thinking 상태에서 reasoning_effort가 없으면 xhigh를 선택한다. 허용값은 xhigh, medium, low다. 일반 집필에서 항상 xhigh가 유리한지는 별도 측정해야 한다. 기존 설정을 기록한 뒤 medium 또는 non-thinking으로 같은 짧은 과제를 비교할 수 있다.

현재 Tabby 공식 문서에는 model.template_vars_default와 요청별 chat_template_kwargs가 설명되어 있다. 다음은 **선택적 비교 실험용 부분 설정**이며, 사용자 설치 버전에서 지원되는지 확인해야 한다.

```yaml
model:
  template_vars_default:
    enable_thinking: true
    reasoning_effort: medium
```

공식 모델 카드의 샘플링 출발값은 thinking에서 temperature 1.0/top_p 0.95, non-thinking에서 temperature 0.7/top_p 0.80이다. 그 설정이 해당 양자화본의 블로그 집필 최적값이라는 뜻은 아니다. 이 진단 스크립트도 해당 temperature/top_p를 출발값으로 사용하지만 모델 카드의 모든 샘플러를 강제로 적용하지는 않는다.

스크립트는 기본적으로 요청별 enable_thinking:false를 보낸다. 실제 집필이 thinking이면 `--thinking --max-tokens 4096` 등으로 별도 진단한다. max_tokens 수치는 작은 테스트의 출력 예산이지 전체 글의 권장 길이가 아니다. server-side 강제 템플릿 설정이 요청 값을 덮어쓰는 경우도 점검한다. 길이 제한 종료는 추론 실패와 구분한다.

Hermes의 context_length는 **Tabby가 실제로 로드한 최대 문맥**에 맞춘다. 모델 카드의 최대 수치나 GPU 용량만으로 값을 추정하지 않는다. 필요한 도구만 노출하고 한 단계에 필요한 자료만 읽도록 하는 것이 이 패키지의 설계다. 문맥이나 성능 개선 정도는 측정 전에는 알 수 없다.

## 5. 통과/실패 해석
진단은 일반 응답, 비스트리밍 도구 호출/인자, 비스트리밍 tool-result 왕복, 스트리밍 도구 호출/인자, 스트리밍 tool-result 왕복을 확인한다.

- 일반 채팅만 통과: 도구 템플릿, 파서, tool schema 전달을 우선 점검한다.
- 비스트리밍만 통과: 스트리밍 파싱/호환성 문제 후보를 좁힌다. 원인 확정은 아니다.
- 둘 다 통과하지만 Hermes 실패: Hermes의 실제 전송 payload, 도구 수, 지침 로딩, 컨텍스트와 실행 승인 등을 별도로 확인한다.

통과는 이 합성 프로토콜 샘플의 통과다. 한국어 글쓰기, 긴 문맥, 실제 파일 편집, Hermes 내부 동작과 Git/Vercel 배포가 검증되었다는 뜻은 아니다.

## 공식 근거
확인한 문서/코드. 설치 버전이나 템플릿이 바뀌면 재확인한다.

- Hermes Context Files: `https://hermes-agent.nousresearch.com/docs/user-guide/features/context-files`
- Hermes Providers: `https://hermes-agent.nousresearch.com/docs/integrations/providers`
- Hermes Configuration: `https://hermes-agent.nousresearch.com/docs/user-guide/configuration`
- Tabby Tool Calling: `https://github.com/theroyallab/tabbyAPI/wiki/10.-Tool-Calling`
- Tabby Server Options: `https://github.com/theroyallab/tabbyAPI/wiki/02.-Server-options`
- Qwen model card: `https://huggingface.co/Qwen/Qwen3.8-27B`
- Qwen chat template: `https://huggingface.co/Qwen/Qwen3.8-27B/blob/main/chat_template.jinja`
