# 탁구치GO 금요리그

간단한 로컬/정적 웹 UI로 구성된 `탁구치GO` 금요리그 관리 화면입니다. 브라우저에서 바로 열어 사용할 수 있는 정적 페이지이며, 관리자용 입력과 일반 회원 조회 기능을 포함합니다.

**주요 기능**
- 대시보드: 주요 지표와 이번주 결과 요약
- 이번주 리그: 선수 등록, 조 편성, 경기 결과 입력, 순위 계산
- 토너먼트: 대진 생성 및 결과 입력(우승/준우승/3위 반영)
- 누적 순위: 분기별 승점 및 승급 규칙 표시
- 출석부: 날짜별 출석 관리 및 집계
- 운영자 모드: 4자리 PIN으로 운영자 권한(입력/편집) 활성화
- 가이드: Firebase 실시간 연동 관련 안내 문구(앱은 실시간 동기화 사용을 가정함)

**사용 방법**
1. 로컬에서 브라우저로 파일을 엽니다: [index.html](index.html)
2. 기본적으로 조회 모드이며, 운영자 기능(입력/저장)이 필요하면 상단의 자물쇠(🔒)를 통해 PIN 입력 오버레이를 사용합니다.
3. 각 탭(대시보드, 이번주 리그, 토너먼트, 누적 순위, 출석부 등)을 통해 기능을 사용하세요.

**구성 파일**
- [index.html](index.html): 화면 마크업 및 외부 자산 로드
- [assets/css/styles.css](assets/css/styles.css): 공통 스타일
- [assets/js/state.js](assets/js/state.js): 기본 데이터, 상태 저장/복원
- [assets/js/history.js](assets/js/history.js): 경기 기록 기능
- [assets/js/admin.js](assets/js/admin.js): 운영자(PIN) 모드 기능
- [assets/js/attendance.js](assets/js/attendance.js): 출석부 기능
- [assets/js/league-core.js](assets/js/league-core.js): 리그 설정/조편성/입력 UI
- [assets/js/league-results.js](assets/js/league-results.js): 리그 순위 계산/가위바위보 처리
- [assets/js/tournament.js](assets/js/tournament.js): 토너먼트 대진/결과 처리
- [assets/js/ranking-members.js](assets/js/ranking-members.js): 누적 순위/회원 관리
- [assets/js/bootstrap.js](assets/js/bootstrap.js): 앱 초기 실행 및 Firebase 연동 함수
- [assets/js/firebase-init.js](assets/js/firebase-init.js): Firebase 초기화 및 초기 동기화 호출

**비고**
- 실제 배포 시에는 Firebase 또는 다른 백엔드와 연동하여 데이터 저장/동기화를 구현해야 합니다. 현재 파일은 클라이언트 UI 중심이며, 가이드 내에 실시간 연동 필요성이 명시되어 있습니다.

궁금한 점이나 추가로 README에 넣고 싶은 내용이 있으면 알려줘요, 오빠.
# -GO