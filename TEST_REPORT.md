# 검증 범위

실행일: 2026-09-12. 제작 환경: Linux, Python 3.13.

실행 명령:
```text
python -m unittest discover -s tests/blog29 -v
python -m py_compile scripts/blog29/*.py
```

결과: 오프라인 테스트 24개 통과, 파이썬 구문 검사 통과. 일반/스트리밍 모의 HTTP 서버 왕복, SSE 델타 재조립, 잘못된 함수 인자와 단순 XML 출력 거부, 원고 검사 로직을 테스트했다.

JSON 템플릿 파싱과 원본 Next.js 안내 블록의 보존도 확인했다.

미실행: 실제 Qwen3.8 양자화본, TabbyAPI, Hermes 통합, Windows, 사용자 blog29 스키마/빌드, 실제 Git 변경·푸시, Vercel 배포. 실제 집필 품질·속도·도구 성공률은 알 수 없음.

이 테스트 결과는 자체 보조 코드의 검사 결과이며 모델/플랫폼 호환성 인증이 아니다.
