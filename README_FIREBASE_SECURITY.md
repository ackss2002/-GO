Firebase 보안 규칙 적용 안내

요약
- 프로젝트 루트에 `firebase-rules.json` 파일을 추가했습니다. 이 규칙은 기본적으로 로그인한 사용자만 읽기 허용하고, 쓰기는 `admins/{uid}: true`로 등록된 사용자만 허용합니다.
- `scripts/set-admins.js`는 로컬에서 Firebase 서비스 계정 키와 관리자 UID를 이용해 `/admins/{uid}=true`를 설정하는 도구입니다.

빠른 사용법
1. 전체 데이터 백업: Firebase Console → Realtime Database → Data → Export JSON
2. 규칙 적용: Firebase Console → Realtime Database → Rules → `firebase-rules.json` 내용 붙여넣기 → Publish
3. 관리자 UID 등록(방법 A: 콘솔 수동)
   - Firebase Console → Authentication → 계정 클릭 → UID 복사
   - Firebase Console → Realtime Database → Data → 루트에 `admins` 노드 추가 → `{ "<UID>": true }` 저장
4. 관리자 UID 등록(방법 B: 스크립트)
   - 로컬에서 서비스 계정 키(JSON)를 다운로드
   - `npm install firebase-admin`
   - 실행: `node scripts/set-admins.js /path/to/serviceAccountKey.json UID1 UID2`

검증
- Firebase Console의 Rules 시뮬레이터로 비로그인/관리자 계정 각각 테스트
- 앱에서 관리자 계정으로 로그인 후 쓰기 동작 확인

주의
- 이 저장소의 클라이언트 코드(예: `assets/js/bootstrap.js`)에 있는 `ADMINS` 배열은 UI 편의용일 뿐 실제 권한을 대체하지 않습니다. 실제 권한은 위 `admins`(UID 기반)로 제어해야 안전합니다.
