# 반짝 기억 카드

동물, 식물, 사물 그림 카드가 나오는 10단계 기억력 카드 뒤집기 게임입니다. 단계가 올라갈수록 카드 수가 늘어나고, 제한 시간이 끝나면 실패 모달이 표시됩니다. 10단계를 모두 성공하면 칭찬 모달이 표시됩니다.

## 실행

정적 파일만으로 동작합니다.

```bash
python -m http.server 4173
```

브라우저에서 `http://localhost:4173`을 열면 됩니다.

## Vercel 배포

이 저장소를 GitHub에 올린 뒤 Vercel에서 새 프로젝트로 연결하면 됩니다. 빌드 명령과 출력 폴더는 비워두어도 정적 사이트로 배포됩니다.

## Firebase 연결

점수 저장을 사용하려면 `firebase-config.example.js`를 `firebase-config.js`로 복사하고 Firebase 프로젝트 설정값을 채워주세요.

Firebase 용량을 최소화하기 위해 SDK를 다운로드하지 않고 Realtime Database REST 요청만 사용합니다. 10단계를 모두 성공했을 때 하루에 한 번만 `c` 경로에 작은 기록이 저장됩니다.

저장 필드는 `m`(시도 횟수), `s`(완료 초), `t`(저장 시각)뿐입니다.

Firebase 콘솔의 Realtime Database 규칙 화면에는 `database.rules.json` 내용을 그대로 붙여 넣으면 됩니다.
