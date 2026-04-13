// =========================
// 운영진 체크 함수 window에 바인딩 (isAdmin 오류 방지)
// =========================
function isAdmin(userName) {
  return ["이미진", "안치국"].includes(userName);
}
if (typeof window !== 'undefined') {
  window.isAdmin = isAdmin;
  // 디버깅용: isAdmin 바인딩 확인
  console.log('[DEBUG] typeof window.isAdmin:', typeof window.isAdmin);
}
// =========================
// 운영자 모드(자물쇠) 상태를 localStorage에 저장/복원하여 새로고침해도 유지
// =========================

// 운영자 모드 상태 저장 함수
function setAdminMode(isAdmin) {
  localStorage.setItem('ttgo_admin_mode', isAdmin ? '1' : '0');
  window.isAdminMode = !!isAdmin;
  // UI 반영 (자물쇠, 배지 등)
  const badge = document.getElementById('admin-badge');
  const lockBtn = document.getElementById('lock-btn');
  if (badge) badge.style.display = isAdmin ? '' : 'none';
  if (lockBtn) lockBtn.textContent = isAdmin ? '🔓' : '🔒';
}

// 페이지 로드 시 운영자 모드 복원
document.addEventListener('DOMContentLoaded', function() {
  const saved = localStorage.getItem('ttgo_admin_mode');
  if (saved === '1') {
    setAdminMode(true);
    window.currentUser = window.currentUser || '안치국';
  } else {
    setAdminMode(false);
  }
});

// 자물쇠 버튼 클릭 시 토글
window.toggleAdmin = function() {
  window.isAdminMode = !window.isAdminMode;
  setAdminMode(window.isAdminMode);
  // 운영자 모드 진입 시 currentUser 자동 세팅
  if (window.isAdminMode && !window.currentUser) window.currentUser = '안치국';
};
// =========================
// 회원관리 데이터/운영진 기본값 보장 및 안내 메시지 보강
// =========================

// MEMBERS, DORMANT, EX_MEMBERS에 더미 데이터라도 기본값으로 바인딩
if (typeof window !== 'undefined') {
  // MEMBERS 기본값 보장
  if (!window.MEMBERS || !Array.isArray(window.MEMBERS) || window.MEMBERS.length === 0) {
    window.MEMBERS = [
      { id: 'admin1', name: '안치국', total: 1 },
      { id: 'admin2', name: '이미진', total: 2 }
    ];
  }
  // DORMANT 기본값 보장
  if (!window.DORMANT || !Array.isArray(window.DORMANT)) {
    window.DORMANT = [];
  }
  // EX_MEMBERS 기본값 보장
  if (!window.EX_MEMBERS || !Array.isArray(window.EX_MEMBERS)) {
    window.EX_MEMBERS = [];
  }
  // currentUser 기본값 보장
  if (!window.currentUser) window.currentUser = '안치국';
  // 디버깅용 콘솔 출력
  console.log('[DEBUG] MEMBERS:', window.MEMBERS);
  console.log('[DEBUG] DORMANT:', window.DORMANT);
  console.log('[DEBUG] EX_MEMBERS:', window.EX_MEMBERS);
  console.log('[DEBUG] currentUser:', window.currentUser);
}

// renderMembersAdminUI 함수 내부에서 데이터 없을 때 안내 메시지 보강(이미 정의된 함수라면 패치 필요)
if (typeof window.renderMembersAdminUI === 'function') {
  const origRender = window.renderMembersAdminUI;
  window.renderMembersAdminUI = function(currentUser) {
    var area = document.getElementById('admin-members-area');
    if (!window.MEMBERS || !Array.isArray(window.MEMBERS) || window.MEMBERS.length === 0) {
      if (area) area.innerHTML = '<div style="color:#e94560;font-weight:700;">회원 데이터가 없습니다. (Firebase 연동 또는 데이터 로딩 오류일 수 있습니다)</div>';
      return;
    }
    // 정상 데이터가 있을 때만 원래 렌더링
    origRender(currentUser);
    // 데이터가 비어있지 않아도, 혹시라도 area가 비어있으면 안내 메시지 출력
    if (area && !area.innerHTML.trim()) {
      area.innerHTML = '<div style="color:#e94560;font-weight:700;">회원 데이터가 없습니다. (렌더링 오류)</div>';
    }
  };
}
// =========================
// 회원관리 탭 진입 시 데이터/함수 바인딩 보장 및 자동 렌더링
// =========================

// MEMBERS, DORMANT, EX_MEMBERS를 window에 항상 바인딩
if (typeof window !== 'undefined') {
  window.MEMBERS = window.MEMBERS || (typeof MEMBERS !== 'undefined' ? MEMBERS : []);
  window.DORMANT = window.DORMANT || (typeof DORMANT !== 'undefined' ? DORMANT : []);
  window.EX_MEMBERS = window.EX_MEMBERS || (typeof EX_MEMBERS !== 'undefined' ? EX_MEMBERS : []);
}

// 회원관리 탭 클릭 시 무조건 운영진 UI 렌더링
document.addEventListener('DOMContentLoaded', function() {
  const membersTab = document.querySelector('.tab[onclick*="members"]');
  if (membersTab) {
    membersTab.addEventListener('click', function() {
      if (typeof window.renderMembersAdminUI === 'function') {
        window.renderMembersAdminUI(window.currentUser || '');
      }
    });
  }
});
// 초기 실행
renderDash();
renderMembers();
renderLeague();
updateAdminUI();
restoreLeagueUI();

// 4월 10일 경기 결과 1회성 마이그레이션
(function migrate0410(){
  if(localStorage.getItem('ttgo_m0410v2')) return;
  // 이전 버전 마이그레이션 제거
  localStorage.removeItem('ttgo_m0410');

  // 정회원 승점 누적
  if(!ST.scores) ST.scores={};
  function addScore(name,w,s,t,pts){
    if(!ST.scores[name]) ST.scores[name]={w:0,s:0,t:0,pts:0};
    ST.scores[name].w+=w; ST.scores[name].s+=s; ST.scores[name].t+=t; ST.scores[name].pts+=pts;
  }
  addScore('최양님',1,0,0,5);  // 우승 (정회원)
  addScore('이원호',0,0,1,2);  // 3위 (정회원)

  // 최양님 승급 처리: 이월5점 + 2분기5점 = 10점 → 승급
  ST.scores['최양님'].pts = 0;  // 승점 리셋
  ST.scores['최양님'].up = true;
  if(!ST.buOverride) ST.buOverride={};
  ST.buOverride['최양님'] = 6;  // 7부 → 6부

  // 게스트 순위 기록
  if(!ST.guestScores) ST.guestScores={};
  if(!ST.guestScores['이현구']) ST.guestScores['이현구']={w:0,s:0,t:0,pts:0,bu:7};
  ST.guestScores['이현구'].s++; ST.guestScores['이현구'].pts+=3;  // 준우승

  // 출석부 (정회원만)
  var att;
  try{ att=JSON.parse(localStorage.getItem('ttgo_attendance')||'{"dates":[],"records":{}}'); }catch(e){ att={dates:[],records:{}}; }
  if(!att.dates.includes('2026-04-10')){
    att.dates.push('2026-04-10');
    att.dates.sort();
  }
  ['곽동석','이상건','최양님','이원호','김현종','정헌모','변현진','김옥란','이봄희'].forEach(function(name){
    if(!att.records[name]) att.records[name]={};
    att.records[name]['2026-04-10']=true;
  });
  localStorage.setItem('ttgo_attendance', JSON.stringify(att));
  if(typeof db!=='undefined') db.ref('ttgo_attendance').set(att);

  // 히스토리 추가
  var record={
    date:'2026-04-10', week:'', type:'단식', set:'3판2승',
    players:['양정모','곽동석','이상건','이효준','최양님','김문숙','한상미',
             '이원호','김현종','이현구','정헌모','김옥희','변현진','김옥란','이봄희','전아현'],
    groups:[['양정모','곽동석','이상건','이효준','최양님','김문숙','한상미'],
            ['이원호','김현종','이현구','정헌모','김옥희','변현진','김옥란','이봄희','전아현']],
    results:[],
    final:{win:'최양님',second:'이현구',third:'이원호',third2:'',lucky:'김문숙'},
    savedAt:Date.now()
  };
  var history=[];
  try{ history=JSON.parse(localStorage.getItem('ttgo_history')||'[]'); }catch(e){}
  var idx=history.findIndex(function(h){return h.date==='2026-04-10';});
  if(idx>=0) history[idx]=record; else history.unshift(record);
  localStorage.setItem('ttgo_history', JSON.stringify(history));
  saveST();
  localStorage.setItem('ttgo_m0410v2','done');
})();

// ── Firebase 연동 함수 ──
function saveToFirebase(){
  if(typeof db === 'undefined') return;
  db.ref('ttgo').set({
    ST: ST,
    externals: getExternals(),
    updatedAt: Date.now()
  }).catch(function(e){ console.error('Firebase 저장 오류:', e); });
}

function loadFromFirebase(){
  if(typeof db === 'undefined') return;
  db.ref('ttgo').once('value').then(function(snapshot){
    const data = snapshot.val();
    if(!data) return;
    if(data.ST){
      ST = data.ST;
      // ST 구조 방어 코드
      if(!ST.scores) ST.scores={};
      if(!ST.week) ST.week={date:'',type:'단식',set:'3판2승',players:[],groups:[[],[],[],[]],results:[]};
      if(!ST.week.players) ST.week.players=[];
      if(!ST.week.groups) ST.week.groups=[[],[],[],[]];
      if(!ST.doubles) ST.doubles={pairs:[],nonMembers:[],groups:[[],[],[],[]],results:[]};
      if(!ST.final) ST.final={win:'',second:'',third:'',third2:'',lucky:''};
      if(!ST.tournament) ST.tournament={};
      // carryOver 없으면 세팅
      ensureCarryOver();
      localStorage.setItem('ttgo_v3', JSON.stringify(ST));
    }
    if(data.externals) saveExternals(data.externals);
    // 출석부 데이터 로드
    db.ref('ttgo_attendance').once('value').then(function(snap){
      if(snap.val()) localStorage.setItem('ttgo_attendance', JSON.stringify(snap.val()));
    });
    // 경기 기록 로드
    db.ref('ttgo_history').once('value').then(function(snap){
      if(snap.val()) localStorage.setItem('ttgo_history', JSON.stringify(snap.val()));
    });
    renderDash();
    renderMembers();
    renderLeague();
    // 조편성 데이터가 있으면 자동 복원
    restoreLeagueUI();
    // 저장된 로그인 자동 복원
    autoLoginCheck();
  }).catch(function(e){ console.error('Firebase 로드 오류:', e); });
}

// 앱 시작 시 Firebase 로드는 SDK 초기화 후 실행 (하단 script에서)

// =========================
// 회원관리 고도화 기능 (운영진만 관리, 탈퇴/복구/정보수정/동기화/EX_MEMBERS)
// 오빠: 모든 주석은 한글, 코드 내 문자열은 영어로 작성
// =========================

// 운영진 계정(이름) 배열
const ADMINS = ["이미진", "안치국"];

// 탈퇴 회원(soft-delete) 관리용 배열
let EX_MEMBERS = [];

// 운영진 여부 체크 함수
function isAdmin(userName) {
  // 운영진이면 true 반환
  return ADMINS.includes(userName);
}

// 회원 탈퇴 함수 (soft-delete)
function retireMember(memberId) {
  // memberId로 회원 찾기
  const member = MEMBERS.find(m => m.id === memberId) || DORMANT.find(m => m.id === memberId);
  if (!member) return false;
  // MEMBERS/DORMANT에서 제거
  removeMemberFromAll(memberId);
  // EX_MEMBERS에 추가 (복구용 정보 포함)
  EX_MEMBERS.push({...member, retiredAt: Date.now()});
  syncAllMemberData();
  return true;
}

// 탈퇴 회원 복구 함수
function restoreMemberFromEx(memberId) {
  const idx = EX_MEMBERS.findIndex(m => m.id === memberId);
  if (idx === -1) return false;
  const member = EX_MEMBERS[idx];
  // MEMBERS에 복구
  MEMBERS.push({...member});
  // EX_MEMBERS에서 제거
  EX_MEMBERS.splice(idx, 1);
  syncAllMemberData();
  return true;
}

// 회원 정보 수정 함수
function updateMemberInfo(memberId, newInfo) {
  // MEMBERS/DORMANT/EX_MEMBERS 모두에서 찾아서 수정
  let found = false;
  [MEMBERS, DORMANT, EX_MEMBERS].forEach(arr => {
    const idx = arr.findIndex(m => m.id === memberId);
    if (idx !== -1) {
      arr[idx] = {...arr[idx], ...newInfo};
      found = true;
    }
  });
  if (found) syncAllMemberData();
  return found;
}

// 회원 전체 데이터 동기화 함수
function syncAllMemberData() {
  // localStorage, Firebase 등 전체 동기화 (구현체에 맞게 수정)
  // ...여기에 동기화 코드 추가...
  // 예시: localStorage.setItem("MEMBERS", JSON.stringify(MEMBERS));
  // 예시: localStorage.setItem("DORMANT", JSON.stringify(DORMANT));
  // 예시: localStorage.setItem("EX_MEMBERS", JSON.stringify(EX_MEMBERS));
  // 필요시 Firebase 연동도 추가
}

// 회원 배열에서 특정 회원 제거
function removeMemberFromAll(memberId) {
  [MEMBERS, DORMANT].forEach(arr => {
    const idx = arr.findIndex(m => m.id === memberId);
    if (idx !== -1) arr.splice(idx, 1);
  });
}

// ...이후 UI/이벤트 바인딩/운영진만 노출/버튼 등은 league-core.js, index.html에서 추가 구현 예정...