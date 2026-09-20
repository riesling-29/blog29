# sources.json 형식

sources.json의 sources 배열에 실제로 참고한 자료만 추가한다. 아래 레코드는 구조 예시이지 검증된 자료가 아니다.


```json
{
  "id": "S1",
  "title": "실제 문서 제목",
  "url": null,
  "file": null,
  "access": "unavailable",
  "retrieved_at": null,
  "published_at": null,
  "version": null,
  "locator": "절/페이지/파일 줄 등 실제 근거 위치",
  "supports": [
    "이 자료가 지지하는 구체적 주장"
  ],
  "evidence_summary": "직접 확인한 부분의 짧은 요약",
  "limitations": [
    "확인하지 못한 점"
  ]
}
```

access는 `read`, `snippet_only`, `unavailable`, `user_provided` 중 하나다. URL과 로컬 파일 경로 중 최소 하나를 기록한다. 실제로 읽었을 때만 read로 둔다. user_provided는 사용자 자료라는 출처 구분이며 사실 검증 완료라는 뜻이 아니다.

본문에는 S1 같은 내부 ID 대신 실제 출처 링크나 출처명을 넣는다. 연구 메모와 sources.json은 기본적으로 발행하지 않는다. `check_draft.py`는 이 레코드가 진실인지 알 수 없으며 형식과 일부 경고만 검사한다.
