# 릴리스 노트

GitHub Release 본문의 원본이다. 태그 `vX.Y.Z`를 푸시하면 [release.yml](../../.github/workflows/release.yml)의
`notes` 잡이 세 OS 패키지가 다 붙은 뒤 `vX.Y.Z.md`의 내용 + 파일 4개의 SHA-256을 Release 본문으로 올린다.

- 파일 이름 = 태그 이름(`v0.3.0.md`). 영어(공개 리포), 사용자에게 의미 있는 변화만
- 릴리스 커밋(`chore(release): vX.Y.Z`)에 같이 넣는다 — 태그가 가리키는 커밋에 있어야 잡이 읽는다
- SHA-256은 쓰지 않는다(잡이 붙인다). 모양은 v0.2.1 노트를 따른다: 요약 한 줄 → 바뀐 것 → 다운로드 표 → CHANGELOG 링크 → 고지
- 0.3.0 이전(v0.1.0 – v0.2.1)의 노트는 GitHub Release에만 있다
