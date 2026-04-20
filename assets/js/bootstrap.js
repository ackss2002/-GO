// =========================
// 모든 탭 동작 보장: window.switchTab이 없으면 league-core.js의 switchTab을 window에 바인딩
document.addEventListener('DOMContentLoaded', function() {
  if (typeof window.switchTab !== 'function') {
    try {
      if (typeof switchTab === 'function') {
        window.switchTab = switchTab;
        console.log('[DEBUG] window.switchTab 바인딩 성공');
      } else {
        console.error('[ERROR] switchTab 함수가 정의되어 있지 않습니다.');
      }
    } catch(e) {
      console.error('[ERROR] window.switchTab 바인딩 중 오류:', e);
    }
  }
});
// 운영진 체크 함수는 아래 ADMINS 배열과 함께 정의합니다 (중복 정의 방지)
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
  // 출석부 재렌더링 (✕ 버튼 표시 여부 반영)
  if (typeof renderAttendance === 'function') renderAttendance();
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

// 페이지 로드 시 마지막 활성 탭 복원 (새로고침 후 대시보드로 돌아가는 문제 해결)
// 다른 스크립트가 탭을 바꿀 수 있으므로 완전 로드 이후에 복원합니다.
window.addEventListener('load', function(){
  try{
    var saved = localStorage.getItem('ttgo_active_tab');
    if(saved && typeof window.switchTab === 'function'){
      var tabs = document.querySelectorAll('.tab');
      var found = null;
      tabs.forEach(function(t){
        try{
          var attr = t.getAttribute('onclick')||'';
          if(attr.indexOf("switchTab('"+saved+"'")!==-1 || attr.indexOf('switchTab(\"'+saved+'\"')!==-1) found = t;
        }catch(e){}
      });
      if(!found) found = document.querySelector('.tab');
      if(found) window.switchTab(saved, found);
    } else {
      // 기본 대시보드로 이동
      if(typeof window.switchTab === 'function'){
        var first = document.querySelector('.tab');
        if(first) window.switchTab('dashboard', first);
      }
    }
  }catch(e){ console.error('restore tab error', e); }
});

// 자물쇠 버튼 클릭은 admin.js의 toggleAdmin()이 처리 (PIN 인증 포함)
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

  // 운영자 계정(이름) 배열: early bind to avoid TDZ when isAdmin is called
  if (typeof window.ADMINS === 'undefined') {
    window.ADMINS = ["이미진", "안치국"];
  }

  // window.isAdmin 함수 보장 (중복 방지)
  if (typeof window.isAdmin !== 'function') {
    window.isAdmin = function(userName) {
      return ["이미진", "안치국"].includes(userName);
    };
    console.log('[DEBUG] window.isAdmin 바인딩됨');
  }

  // window.renderMembersAdminUI 함수 보장 (더미라도)
  if (typeof window.renderMembersAdminUI !== 'function') {
    window.renderMembersAdminUI = function(currentUser) {
      var area = document.getElementById('admin-members-area');
      if (area) area.innerHTML = '<div style="color:#e94560;font-weight:700;">회원관리 UI 함수가 정의되어 있지 않습니다. (더미 함수)</div>';
    };
    console.log('[DEBUG] window.renderMembersAdminUI 더미 바인딩됨');
  }

  // window.renderMembers 함수 보장 (실제는 renderMembersAdminUI 호출)
  if (typeof window.renderMembers !== 'function') {
    window.renderMembers = function() {
      if (typeof window.renderMembersAdminUI === 'function') {
        window.renderMembersAdminUI(window.currentUser || '');
      } else {
        var area = document.getElementById('admin-members-area');
        if (area) area.innerHTML = '<div style="color:#e94560;font-weight:700;">회원관리 UI 함수가 정의되어 있지 않습니다.</div>';
      }
    };
    console.log('[DEBUG] window.renderMembers 더미 바인딩됨');
  }
}

// renderMembersAdminUI 함수 내부에서 데이터 없을 때 안내 메시지 보강(이미 정의된 함수라면 패치 필요)
if (typeof window.renderMembersAdminUI === 'function') {
  const origRender = window.renderMembersAdminUI;
  window.renderMembersAdminUI = function(currentUser) {
    var area = document.getElementById('admin-members-area');
    try {
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
    } catch(e) {
      if (area) area.innerHTML = '<div style="color:#e94560;font-weight:700;">회원관리 UI 렌더링 중 오류 발생: '+e.message+'</div>';
      console.error('[회원관리 UI 렌더링 오류]', e);
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

  // renderMembers 함수가 없으면 더미 함수로 바인딩 (실제는 renderMembersAdminUI 호출)
  if (typeof window.renderMembers !== 'function') {
    window.renderMembers = function() {
      if (typeof window.renderMembersAdminUI === 'function') {
        window.renderMembersAdminUI(window.currentUser || '');
      } else {
        var area = document.getElementById('admin-members-area');
        if (area) area.innerHTML = '<div style="color:#e94560;font-weight:700;">회원관리 UI 함수가 정의되어 있지 않습니다.</div>';
      }
    };
  }
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
if(typeof renderRanking === 'function') renderRanking();
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

// Q1 게스트 랭킹포인트 마이그레이션
(function migrateQ1GuestScores(){
  if(localStorage.getItem('ttgo_q1guest_v1')) return;
  if(!ST.guestScores) ST.guestScores={};

  var guests=[
    {name:'김정연', bu:3, w:1, s:0, t:0, pts:5},   // 01/09 리그 우승
    {name:'이병찬', bu:5, w:0, s:1, t:0, pts:3},   // 01/09 리그 준우승
    {name:'이현구', bu:7, w:0, s:0, t:1, pts:2},   // 01/09 리그 3위 (04/10 준우승은 기존 반영)
    {name:'이희숙', bu:9, w:0, s:1, t:0, pts:3},   // 01/16 리그 준우승
    {name:'김종화', bu:6, w:0, s:1, t:0, pts:3},   // 02/06 리그 준우승
    {name:'황동후', bu:5, w:0, s:1, t:0, pts:3},   // 02/13 리그 준우승
    {name:'조충기', bu:6, w:0, s:0, t:1, pts:2},   // 02/13 리그 3위
    {name:'박한순', bu:8, w:0, s:1, t:1, pts:5},   // 02/27 준우승 + 03/27 3위
    {name:'민경숙', bu:7, w:0, s:0, t:1, pts:2},   // 02/27 리그 3위
    {name:'임계수', bu:6, w:1, s:1, t:0, pts:8},   // 03/13 리그 준우승 + 03/18 푸르미 우승
    {name:'김정만', bu:6, w:1, s:0, t:0, pts:5},   // 02/10 LG 우승
    {name:'한결',   bu:3, w:0, s:0, t:1, pts:2},   // 02/10 LG 3위
    {name:'정용찬', bu:6, w:0, s:1, t:0, pts:3},   // 03/05 한전 준우승
    {name:'임근숙', bu:9, w:0, s:0, t:1, pts:2},   // 03/18 푸르미 3위
    {name:'김재홍', bu:6, w:0, s:1, t:0, pts:3},   // 04/01 송강 준우승
    {name:'신정민', bu:4, w:0, s:0, t:1, pts:2},   // 04/01 송강 3위
  ];

  guests.forEach(function(g){
    if(!ST.guestScores[g.name]) ST.guestScores[g.name]={w:0,s:0,t:0,pts:0,bu:g.bu};
    ST.guestScores[g.name].w+=g.w;
    ST.guestScores[g.name].s+=g.s;
    ST.guestScores[g.name].t+=g.t;
    ST.guestScores[g.name].pts+=g.pts;
    ST.guestScores[g.name].bu=g.bu;
  });

  saveST();
  localStorage.setItem('ttgo_q1guest_v1','done');
})();

// Q1 게스트 부수 정정 마이그레이션
(function migrateQ1GuestBu(){
  if(localStorage.getItem('ttgo_q1guest_bu_v1')) return;
  if(!ST.guestScores) ST.guestScores={};
  var buFix={김정연:3,이희숙:9,김종화:6,황동후:5,조충기:6,민경숙:7};
  Object.keys(buFix).forEach(function(name){
    if(ST.guestScores[name]) ST.guestScores[name].bu=buFix[name];
  });
  saveST();
  localStorage.setItem('ttgo_q1guest_bu_v1','done');
})();

// Q1 경기 결과 히스토리 마이그레이션 (결과만)
(function migrateQ1History(){
  if(localStorage.getItem('ttgo_q1hist_v1')) return;
  var history=[];
  try{ history=JSON.parse(localStorage.getItem('ttgo_history')||'[]'); }catch(e){}

  var records=[
    {date:'2026-01-09',type:'금요리그',final:{win:'김정연',second:'이병찬',third:'이현구',lucky:''}},
    {date:'2026-01-16',type:'금요리그',final:{win:'최양님',second:'이희숙',third:'김덕기',lucky:'안치국, 이현구'}},
    {date:'2026-02-06',type:'금요리그',final:{win:'김덕기',second:'김종화',third:'김영서',lucky:'김영서'}},
    {date:'2026-02-10',type:'LG 교류전',final:{win:'김정만',second:'이원호',third:'한결',lucky:'정희남'}},
    {date:'2026-02-13',type:'금요리그',final:{win:'이원호',second:'황동후',third:'조충기',lucky:'이봄희'}},
    {date:'2026-02-27',type:'금요리그',final:{win:'이미진',second:'박한순',third:'민경숙',lucky:'안경식, 정정순'}},
    {date:'2026-03-05',type:'한전 교류전',final:{win:'김덕기',second:'정용찬',third:'안치국',lucky:'박대근'}},
    {date:'2026-03-13',type:'금요리그',final:{win:'이원호',second:'임계수',third:'이상건',lucky:'이운희'}},
    {date:'2026-03-18',type:'푸르미 교류전',final:{win:'임계수',second:'이진규',third:'임근숙',lucky:'이운희'}},
    {date:'2026-03-27',type:'금요리그',final:{win:'안치국',second:'이상건',third:'박한순',lucky:''}},
    {date:'2026-04-01',type:'송강 교류전',final:{win:'이진규',second:'김재홍',third:'신정민',lucky:'여인국'}},
  ];

  records.forEach(function(r){
    var rec={date:r.date,week:'',type:r.type,set:'',players:[],groups:[],results:[],final:Object.assign({third2:''},r.final),savedAt:Date.now()};
    var idx=history.findIndex(function(h){return h.date===r.date;});
    if(idx>=0) history[idx]=rec; else history.push(rec);
  });

  history.sort(function(a,b){ return b.date.localeCompare(a.date); });
  localStorage.setItem('ttgo_history', JSON.stringify(history));
  if(typeof db!=='undefined') db.ref('ttgo_history').set(history);
  localStorage.setItem('ttgo_q1hist_v1','done');
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
    // format1: saveST()가 raw ST 직접 저장 → data.scores 존재
    // format2: saveToFirebase()가 {ST,externals,updatedAt} 저장 → data.ST 존재
    // format1(saveST: raw ST) 또는 format2({ST:...}) 모두 처리
    var stData = data.ST || (data.scores !== undefined ? data : null);
    if(stData){
      ST = stData;
      if(!ST.scores) ST.scores={};
      if(!ST.week) ST.week={date:'',type:'단식',set:'3판2승',players:[],groups:[[],[],[],[]],results:[]};
      if(!ST.week.players) ST.week.players=[];
      if(!ST.week.groups) ST.week.groups=[[],[],[],[]];
      if(!ST.doubles) ST.doubles={pairs:[],nonMembers:[],groups:[[],[],[],[]],results:[]};
      if(!ST.final) ST.final={win:'',second:'',third:'',third2:'',lucky:''};
      if(!ST.tournament) ST.tournament={};
    }
    // carryOver 단일 소스: state.js의 CARRY_OVER_DATA
    ST.carryOver = CARRY_OVER_DATA;
    // 게스트 기본값: 없으면 DEFAULT_TEMP_PLAYERS로 채움
    if(!ST.guests || !ST.guests.length)
      ST.guests = DEFAULT_TEMP_PLAYERS.slice();
    if(!ST.scores) ST.scores = {};
    // 최양님 승급 상태 항상 보장 (4/10 우승 w:1 보존, pts만 리셋)
    ST.scores['최양님'] = {w:1, s:0, t:0, pts:0, up:true};
    // 이원호 4월10일 3위 점수 — 없으면 복구
    if(!ST.scores['이원호'] || (!ST.scores['이원호'].t && !ST.scores['이원호'].w && !ST.scores['이원호'].s)){
      ST.scores['이원호'] = {w:0, s:0, t:1, pts:2};
    }
    localStorage.setItem('ttgo_v3', JSON.stringify(ST));
    // 출석부 데이터 로드
    db.ref('ttgo_attendance').once('value').then(function(snap){
      if(snap.val()) localStorage.setItem('ttgo_attendance', JSON.stringify(snap.val()));
    });
    // 경기 기록 로드
    db.ref('ttgo_history').once('value').then(function(snap){
      if(snap.val()) localStorage.setItem('ttgo_history', JSON.stringify(snap.val()));
    });
    // 회원 데이터: 항상 Firebase에서 로드 후 한 번에 렌더링 (멀티기기 동기화 보장)
    var fbMembersUpdatedAt = data.membersUpdatedAt || 0;
    Promise.all([
      db.ref('members').once('value'),
      db.ref('dormant').once('value'),
      db.ref('ex_members').once('value')
    ]).then(function(snaps){
      var mVal = snaps[0].val();
      if(mVal && Array.isArray(mVal) && mVal.length > 0){
        MEMBERS.length = 0;
        mVal.forEach(function(m){ MEMBERS.push(m); });
        window.MEMBERS = MEMBERS;
        localStorage.setItem('ttgo_members', JSON.stringify(MEMBERS));
        localStorage.setItem('ttgo_members_updatedAt', String(fbMembersUpdatedAt||Date.now()));
      }
      var dVal = snaps[1].val();
      if(dVal && Array.isArray(dVal)){
        DORMANT.length = 0;
        dVal.forEach(function(m){ DORMANT.push(m); });
        window.DORMANT = DORMANT;
        localStorage.setItem('ttgo_dormant', JSON.stringify(DORMANT));
      }
      var exVal = snaps[2].val();
      if(exVal && Array.isArray(exVal) && exVal.length > 0){
        // Firebase에 탈퇴 데이터 있음 → 로컬 덮어씌우기
        window.EX_MEMBERS = exVal.slice();
        localStorage.setItem('ttgo_ex_members', JSON.stringify(window.EX_MEMBERS));
      } else if(!exVal && window.EX_MEMBERS && window.EX_MEMBERS.length > 0){
        // Firebase에 탈퇴 데이터 없는데 로컬엔 있음 → Firebase로 동기화
        try{ db.ref('ex_members').set(window.EX_MEMBERS); }catch(e){}
      }
      // Firebase 로드 완료 후 탈퇴 회원 복구 (db 준비된 상태에서 실행)
      var knownRetired = [
        {name:'김덕기',g:'남',bu:5,total:4},
        {name:'한철호',g:'남',bu:6,total:6}
      ];
      var exArr = window.EX_MEMBERS || [];
      var changed = false;
      knownRetired.forEach(function(m){
        var inMembers = MEMBERS.some(function(x){ return x.name===m.name; });
        var inDormant = DORMANT.some(function(x){ return x.name===m.name; });
        var inEx      = exArr.some(function(x){ return x.name===m.name; });
        if(!inMembers && !inDormant && !inEx){
          exArr.push({name:m.name,g:m.g,bu:m.bu,total:m.total,retiredAt:Date.now()});
          changed = true;
        }
      });
      if(changed){
        window.EX_MEMBERS = exArr;
        localStorage.setItem('ttgo_ex_members', JSON.stringify(exArr));
        try{ db.ref('ex_members').set(exArr); }catch(e){}
      }
      // 전체 렌더링
      renderDash();
      renderMembers();
      if(typeof renderMembersAdminUI==='function') renderMembersAdminUI(window.currentUser||'');
      renderLeague();
      if(typeof renderRanking==='function') renderRanking();
      restoreLeagueUI();
      autoLoginCheck();
      // 초기 로드 완료 후 실시간 동기화 리스너 설정
      setupRealtimeSync();
    });
  }).catch(function(e){ console.error('Firebase 로드 오류:', e); });
}

// 실시간 동기화: 다른 기기에서 변경 시 자동 반영
var _realtimeSyncReady = false;
function setupRealtimeSync(){
  if(_realtimeSyncReady || typeof db === 'undefined') return;
  _realtimeSyncReady = true;

  // ST 데이터 (경기결과, 토너먼트, 순위)
  db.ref('ttgo').on('value', function(snap){
    var data = snap.val();
    if(!data) return;
    var stData = data.ST || (data.scores !== undefined ? data : null);
    if(!stData) return;
    var co = ST.carryOver;
    var savedGroups = ST.week && ST.week.groups;
    Object.assign(ST, stData);
    if(savedGroups) ST.week.groups = savedGroups;
    if(co) ST.carryOver = co;
    if(!ST.scores) ST.scores={};
    if(!ST.week) ST.week={date:'',type:'단식',set:'3판2승',players:[],groups:[[],[],[],[]],results:[]};
    if(!ST.week.players) ST.week.players=[];
    if(!ST.week.groups) ST.week.groups=[[],[],[],[]];
    if(!ST.doubles) ST.doubles={pairs:[],nonMembers:[],groups:[[],[],[],[]],results:[]};
    if(!ST.final) ST.final={win:'',second:'',third:'',third2:'',lucky:''};
    if(!ST.tournament) ST.tournament={};
    localStorage.setItem('ttgo_v3', JSON.stringify(ST));
    renderDash();
    if(typeof renderRanking==='function') renderRanking();
    var t = localStorage.getItem('ttgo_active_tab');
    if(t==='tournament' && typeof renderTournamentTab==='function') renderTournamentTab();
    if(t==='history' && typeof renderHistory==='function') renderHistory();
  });

  // 회원 데이터
  db.ref('members').on('value', function(snap){
    var val = snap.val();
    if(!val || !Array.isArray(val) || !val.length) return;
    MEMBERS.length=0; val.forEach(function(m){MEMBERS.push(m);}); window.MEMBERS=MEMBERS;
    localStorage.setItem('ttgo_members', JSON.stringify(MEMBERS));
    if(typeof renderMembersAdminUI==='function') renderMembersAdminUI(window.currentUser||'');
    if(typeof renderRanking==='function') renderRanking();
  });

  db.ref('dormant').on('value', function(snap){
    var val = snap.val();
    if(!val || !Array.isArray(val)) return;
    DORMANT.length=0; val.forEach(function(m){DORMANT.push(m);}); window.DORMANT=DORMANT;
    localStorage.setItem('ttgo_dormant', JSON.stringify(DORMANT));
    if(typeof renderMembersAdminUI==='function') renderMembersAdminUI(window.currentUser||'');
  });

  db.ref('ex_members').on('value', function(snap){
    var val = snap.val();
    window.EX_MEMBERS = (val && Array.isArray(val)) ? val.slice() : (window.EX_MEMBERS||[]);
    localStorage.setItem('ttgo_ex_members', JSON.stringify(window.EX_MEMBERS));
    if(typeof renderMembersAdminUI==='function') renderMembersAdminUI(window.currentUser||'');
  });

  // 출석부
  db.ref('ttgo_attendance').on('value', function(snap){
    if(!snap.val()) return;
    localStorage.setItem('ttgo_attendance', JSON.stringify(snap.val()));
    var t = localStorage.getItem('ttgo_active_tab');
    if(t==='attendance' && typeof renderAttendance==='function') renderAttendance();
  });

  // 경기 기록
  db.ref('ttgo_history').on('value', function(snap){
    if(!snap.val()) return;
    localStorage.setItem('ttgo_history', JSON.stringify(snap.val()));
    var t = localStorage.getItem('ttgo_active_tab');
    if(t==='history' && typeof renderHistory==='function') renderHistory();
  });

}

// 앱 시작 시 Firebase 로드는 SDK 초기화 후 실행 (하단 script에서)

// =========================
// 회원관리 고도화 기능 (운영진만 관리, 탈퇴/복구/정보수정/동기화/EX_MEMBERS)
// 오빠: 모든 주석은 한글, 코드 내 문자열은 영어로 작성
// =========================

// 운영진 계정(이름) 배열 (참고: actual list bound to window.ADMINS above)
const ADMINS = (typeof window.ADMINS !== 'undefined') ? window.ADMINS : ["이미진", "안치국"];

// 탈퇴 회원(soft-delete) 관리용 배열 — localStorage에서 복원
let EX_MEMBERS = (function(){
  try { var s = localStorage.getItem('ttgo_ex_members'); return s ? JSON.parse(s) : []; } catch(e){ return []; }
})();
// window.EX_MEMBERS 즉시 동기화 (line 95에서 []로 초기화됐으므로 덮어씀)
window.EX_MEMBERS = EX_MEMBERS;

// 탈퇴 회원 복구는 loadFromFirebase() 내부에서 Firebase 준비 후 실행됨

// 운영진 여부 체크 함수
function isAdmin(userName) {
  // 운영진이면 true 반환
  return ADMINS.includes(userName);
}
// 전역 바인딩
if(typeof window !== 'undefined') window.isAdmin = isAdmin;

// 회원 탈퇴 함수 (soft-delete)
function retireMember(memberName) {
  // memberName으로 회원 찾기
  const member = MEMBERS.find(m => m.name === memberName) || DORMANT.find(m => m.name === memberName);
  if (!member) return false;
  // 확인 모달 표시 (비동기)
  window.showConfirmModal(memberName + '님을 탈퇴 처리하시겠습니까? (복구 가능)', function(){
    removeMemberFromAll(memberName);
    EX_MEMBERS.push({...member, retiredAt: Date.now()});
    syncAllMemberData();
    if (typeof renderMembersAdminUI === 'function') renderMembersAdminUI(window.currentUser||'');
    if (typeof renderRanking === 'function') renderRanking();
    try{ recordAdminAction('retire', { member: memberName }); }catch(e){}
  }, { title: '탈퇴 확인' });
  return true;
}

// 탈퇴 회원 복구 함수
function restoreMemberFromEx(memberName) {
  const idx = EX_MEMBERS.findIndex(m => m.name === memberName);
  if (idx === -1) return false;
  const member = EX_MEMBERS[idx];
  // MEMBERS에 복구
  MEMBERS.push({...member});
  // EX_MEMBERS에서 제거
  EX_MEMBERS.splice(idx, 1);
  syncAllMemberData();
  if (typeof renderMembersAdminUI === 'function') renderMembersAdminUI(window.currentUser||'');
  if (typeof renderRanking === 'function') renderRanking();
  try{ recordAdminAction('restore_ex', { member: memberName }); }catch(e){}
  return true;
}

// 회원 정보 수정 함수
function updateMemberInfo(memberName, newInfo) {
  // MEMBERS/DORMANT/EX_MEMBERS 모두에서 찾아서 수정 (이름 기준)
  let found = false;
  [MEMBERS, DORMANT, EX_MEMBERS].forEach(arr => {
    const idx = arr.findIndex(m => m.name === memberName);
    if (idx !== -1) {
      arr[idx] = {...arr[idx], ...newInfo};
      found = true;
    }
  });
  if (found) syncAllMemberData();
  if (found && typeof renderMembersAdminUI === 'function') renderMembersAdminUI(window.currentUser||'');
  try{ recordAdminAction('update', { from: memberName, to: newInfo }); }catch(e){}
  return found;
}

// 휴면 처리: MEMBERS -> DORMANT
function setDormant(memberName) {
  const member = MEMBERS.find(m=>m.name===memberName);
  if(!member) return false;
  window.showConfirmModal(memberName + '님을 휴면 처리하시겠습니까?', function(){
    removeMemberFromAll(memberName);
    DORMANT.push({...member});
    syncAllMemberData();
    if (typeof renderMembersAdminUI === 'function') renderMembersAdminUI(window.currentUser||'');
    if (typeof renderRanking === 'function') renderRanking();
    try{ recordAdminAction('dormant', { member: memberName }); }catch(e){}
  }, { title: '휴면 확인' });
  return true;
}

// 휴면 복구: DORMANT -> MEMBERS
function restoreFromDormant(memberName){
  const idx = DORMANT.findIndex(m=>m.name===memberName);
  if(idx===-1) return false;
  const member = DORMANT[idx];
  DORMANT.splice(idx,1);
  MEMBERS.push({...member});
  syncAllMemberData();
  if (typeof renderMembersAdminUI === 'function') renderMembersAdminUI(window.currentUser||'');
  if (typeof renderRanking === 'function') renderRanking();
  try{ recordAdminAction('restore', { member: memberName }); }catch(e){}
  return true;
}

// 회원 전체 데이터 동기화 함수
function syncAllMemberData() {
  try {
    // 로컬 변수와 window 글로벌 동기화 (EX_MEMBERS는 let으로 선언되어 분리됨)
    window.MEMBERS   = MEMBERS;
    window.DORMANT   = DORMANT;
    window.EX_MEMBERS = EX_MEMBERS;
    // 로컬에 저장 (타임스탬프 포함 — 다기기 동기화 기준)
    var now = Date.now();
    localStorage.setItem('ttgo_members', JSON.stringify(MEMBERS));
    localStorage.setItem('ttgo_dormant', JSON.stringify(DORMANT));
    localStorage.setItem('ttgo_ex_members', JSON.stringify(EX_MEMBERS));
    localStorage.setItem('ttgo_members_updatedAt', String(now));
    // Firebase에 동기화 (있을 때만) — updatedAt 포함해서 다른 기기가 감지 가능
    if (typeof db !== 'undefined') {
      try {
        db.ref('members').set(MEMBERS);
        db.ref('dormant').set(DORMANT);
        db.ref('ex_members').set(EX_MEMBERS);
        db.ref('ttgo').update({membersUpdatedAt: now});
      } catch(e){ console.error('Firebase syncAllMemberData error', e); }
    }
  } catch(e){ console.error('syncAllMemberData error', e); }
}

// 회원 배열에서 특정 회원 제거
function removeMemberFromAll(memberName) {
  [MEMBERS, DORMANT].forEach(arr => {
    const idx = arr.findIndex(m => m.name === memberName);
    if (idx !== -1) arr.splice(idx, 1);
  });
}

// -----------------------
// 회원 수정 모달 (동적 생성)
// -----------------------
// 모달 오픈/클로즈 유틸: 포커스 트랩 및 포커스 복원
window._lastFocusedElement = null;
window.openModal = function(modalId){
  try{
    const el = document.getElementById(modalId);
    if(!el) return;
    // 저장된 포커스
    if(!window._lastFocusedElement) window._lastFocusedElement = document.activeElement;
    el.style.display = 'flex';
    el.setAttribute('aria-hidden','false');
    // keydown 핸들러 (ESC, TAB 트랩)
    const handler = function(e){
      if(e.key === 'Escape'){
        e.preventDefault();
        window.closeModal(modalId);
        return;
      }
      if(e.key === 'Tab'){
        const focusable = el.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])');
        if(focusable.length === 0){ e.preventDefault(); return; }
        const first = focusable[0], last = focusable[focusable.length-1];
        if(e.shiftKey){ if(document.activeElement === first){ e.preventDefault(); last.focus(); } }
        else { if(document.activeElement === last){ e.preventDefault(); first.focus(); } }
      }
    };
    el._modalKeyHandler = handler;
    document.addEventListener('keydown', handler);
    // 포커스: 첫 입력 또는 확인 버튼
    setTimeout(function(){
      const focusable = el.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])');
      if(focusable.length) focusable[0].focus(); else el.focus();
    }, 40);
  }catch(e){ console.error('openModal error', e); }
};

window.closeModal = function(modalId){
  try{
    const el = document.getElementById(modalId);
    if(!el) return;
    el.style.display = 'none';
    el.setAttribute('aria-hidden','true');
    if(el._modalKeyHandler) document.removeEventListener('keydown', el._modalKeyHandler);
    el._modalKeyHandler = null;
    if(window._lastFocusedElement && typeof window._lastFocusedElement.focus === 'function'){
      try{ window._lastFocusedElement.focus(); }catch(e){}
    }
    window._lastFocusedElement = null;
  }catch(e){ console.error('closeModal error', e); }
};

window.showEditMemberModal = function(originalName){
  try{
    if(!document.getElementById('edit-member-modal')){
      const wrapper = document.createElement('div');
      wrapper.id = 'edit-member-modal';
      wrapper.style = 'position:fixed;top:0;left:0;width:100%;height:100%;display:none;align-items:center;justify-content:center;z-index:12000;';
      wrapper.innerHTML = `
        <div style="background:white;border-radius:12px;padding:18px 18px;max-width:420px;width:94%;box-shadow:0 20px 60px rgba(0,0,0,0.25);">
          <h3 style="margin:0 0 8px 0;font-size:18px;color:#1a1a2e;">회원 정보 수정</h3>
          <div style="margin-bottom:8px;font-size:13px;color:#666;">이름</div>
          <input id="edit-member-name" type="text" style="width:100%;padding:8px;border:1px solid #ddd;border-radius:6px;margin-bottom:10px;font-size:14px;" />
          <div style="margin-bottom:8px;font-size:13px;color:#666;">부수</div>
          <input id="edit-member-bu" type="number" min="1" max="99" style="width:100%;padding:8px;border:1px solid #ddd;border-radius:6px;margin-bottom:12px;font-size:14px;" />
          <div style="display:flex;gap:8px;justify-content:flex-end;">
            <button id="edit-member-cancel" style="padding:8px 12px;border-radius:8px;border:1px solid #ddd;background:white;">취소</button>
            <button id="edit-member-save" style="padding:8px 12px;border-radius:8px;border:none;background:#1a1a2e;color:white;">저장</button>
          </div>
        </div>`;
      document.body.appendChild(wrapper);
      // 이벤트 바인딩
      document.getElementById('edit-member-cancel').addEventListener('click', function(){ window.closeModal('edit-member-modal'); });
    }
    // 채우기
    const member = MEMBERS.find(m=>m.name===originalName) || DORMANT.find(m=>m.name===originalName) || EX_MEMBERS.find(m=>m.name===originalName);
    if(!member){ alert('이 페이지 내용:\n회원 정보를 찾을 수 없습니다.'); return; }
      document.getElementById('edit-member-name').value = member.name;
      document.getElementById('edit-member-bu').value = member.total || '';
      window.openModal('edit-member-modal');
    // 저장 버튼 핸들러 (한 번만 바인딩되도록 제거 후 재바인딩)
    const saveBtn = document.getElementById('edit-member-save');
    const newHandler = function(){
      const newName = (document.getElementById('edit-member-name').value||'').trim();
      const newBu = parseInt(document.getElementById('edit-member-bu').value,10);
      if(!newName){ alert('이름을 입력하세요.'); return; }
      if(isNaN(newBu) || newBu < 1){ alert('유효한 부수를 입력하세요.'); return; }
      if(typeof updateMemberInfo === 'function'){
        updateMemberInfo(originalName, { name: newName, total: newBu });
      }
      window.closeModal('edit-member-modal');
      if(typeof renderMembersAdminUI === 'function') renderMembersAdminUI(window.currentUser||'');
    };
    // remove existing listeners by cloning
    const newSave = saveBtn.cloneNode(true);
    saveBtn.parentNode.replaceChild(newSave, saveBtn);
    newSave.addEventListener('click', newHandler);
  }catch(e){ console.error('showEditMemberModal error', e); alert('모달을 열 수 없습니다. 콘솔을 확인하세요.'); }
};

window.showAddMemberModal = function(){
  try{
    if(!document.getElementById('add-member-modal')){
      const wrapper = document.createElement('div');
      wrapper.id = 'add-member-modal';
      wrapper.style = 'position:fixed;top:0;left:0;width:100%;height:100%;display:none;align-items:center;justify-content:center;z-index:12000;background:rgba(0,0,0,0.5);';
      wrapper.innerHTML = `
        <div style="background:white;border-radius:12px;padding:20px;max-width:420px;width:94%;box-shadow:0 20px 60px rgba(0,0,0,0.25);">
          <h3 style="margin:0 0 16px 0;font-size:18px;color:#1a1a2e;">신규 회원 추가</h3>
          <div style="margin-bottom:6px;font-size:13px;color:#666;">이름</div>
          <input id="add-member-name" type="text" placeholder="이름 입력" style="width:100%;box-sizing:border-box;padding:9px;border:1px solid #ddd;border-radius:6px;margin-bottom:12px;font-size:14px;" />
          <div style="margin-bottom:6px;font-size:13px;color:#666;">성별</div>
          <select id="add-member-gender" style="width:100%;padding:9px;border:1px solid #ddd;border-radius:6px;margin-bottom:12px;font-size:14px;">
            <option value="남">남</option>
            <option value="여">여</option>
          </select>
          <div style="margin-bottom:6px;font-size:13px;color:#666;">부수</div>
          <input id="add-member-bu" type="number" min="1" max="99" placeholder="예: 6" style="width:100%;box-sizing:border-box;padding:9px;border:1px solid #ddd;border-radius:6px;margin-bottom:18px;font-size:14px;" />
          <div style="display:flex;gap:8px;justify-content:flex-end;">
            <button id="add-member-cancel" style="padding:9px 16px;border-radius:8px;border:1px solid #ddd;background:white;cursor:pointer;font-size:14px;">취소</button>
            <button id="add-member-save" style="padding:9px 16px;border-radius:8px;border:none;background:#1a1a2e;color:white;cursor:pointer;font-size:14px;font-weight:700;">추가</button>
          </div>
        </div>`;
      document.body.appendChild(wrapper);
      document.getElementById('add-member-cancel').addEventListener('click', function(){ window.closeModal('add-member-modal'); });
    }
    // 입력 초기화
    document.getElementById('add-member-name').value = '';
    document.getElementById('add-member-bu').value = '';
    document.getElementById('add-member-gender').value = '남';
    window.openModal('add-member-modal');
    // 저장 버튼 핸들러
    const saveBtn = document.getElementById('add-member-save');
    const newSave = saveBtn.cloneNode(true);
    saveBtn.parentNode.replaceChild(newSave, saveBtn);
    newSave.addEventListener('click', function(){
      const name = (document.getElementById('add-member-name').value||'').trim();
      const gender = document.getElementById('add-member-gender').value;
      const bu = parseInt(document.getElementById('add-member-bu').value, 10);
      if(!name){ alert('이름을 입력하세요.'); return; }
      if(isNaN(bu) || bu < 1){ alert('유효한 부수를 입력하세요.'); return; }
      if(MEMBERS.find(m=>m.name===name) || DORMANT.find(m=>m.name===name)){
        alert('이미 존재하는 회원입니다.'); return;
      }
      MEMBERS.push({name, g:gender, bu, total:bu});
      window.MEMBERS = MEMBERS;
      // MNAMES 즉시 갱신 (출석 자동기록 등에 사용)
      window.MNAMES = MEMBERS.map(function(m){ return m.name; });
      syncAllMemberData();
      window.closeModal('add-member-modal');
      if(typeof renderMembersAdminUI === 'function') renderMembersAdminUI(window.currentUser||'');
      alert(name + ' 님이 정회원으로 추가되었습니다.');
    });
  }catch(e){ console.error('showAddMemberModal error', e); }
};

// 기록(간단 로그) 추가
function recordAdminAction(type, details){
  try{
    var logs = [];
    try{ logs = JSON.parse(localStorage.getItem('ttgo_admin_actions')||'[]'); }catch(e){ logs = []; }
    logs.unshift({ type: type, details: details||null, actor: window.currentUser||null, at: Date.now() });
    // keep recent 200
    if(logs.length>200) logs = logs.slice(0,200);
    localStorage.setItem('ttgo_admin_actions', JSON.stringify(logs));
    // optional Firebase record
    if(typeof db!=='undefined'){
      try{ db.ref('admin_actions').push({ type:type, details:details||null, actor:window.currentUser||null, at:Date.now() }); }catch(e){}
    }
  }catch(e){ console.error('recordAdminAction error', e); }
}

// Generic confirm modal
// 매번 innerHTML을 새로 그리고 핸들러를 재바인딩한다 (콜백 stale 버그 방지)
window.showConfirmModal = function(message, onConfirm, options){
  options = options || {};
  try{
    // 모달 컨테이너: 없으면 생성, 있으면 재사용
    var o = document.getElementById('confirm-modal');
    if(!o){
      o = document.createElement('div');
      o.id = 'confirm-modal';
      document.body.appendChild(o);
    }
    // 오버레이 스타일을 인라인으로도 보장 (CSS 누락 대비)
    o.className = 'modal-overlay';
    o.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;' +
      'display:none;align-items:center;justify-content:center;' +
      'background:rgba(0,0,0,0.55);z-index:12000;';
    // 매번 내용 갱신 + 핸들러 재바인딩
    var titleColor = options.danger ? '#c62828' : '#1a1a2e';
    var confirmBg  = options.danger ? '#c62828' : '#e94560';
    o.innerHTML =
      '<div class="modal" role="dialog" aria-modal="true" ' +
        'style="max-width:380px;width:92%;border-radius:16px;padding:24px 22px;' +
               'background:#fff;box-shadow:0 24px 60px rgba(0,0,0,0.28);">' +
        '<h3 style="margin:0 0 12px 0;font-size:17px;color:' + titleColor + ';">' +
          (options.title || '확인') +
        '</h3>' +
        '<div style="color:#333;font-size:14px;line-height:1.7;">' +
          message.replace(/\n/g,'<br/>') +
        '</div>' +
        '<div style="display:flex;gap:8px;justify-content:flex-end;margin-top:20px;">' +
          '<button class="btn-modal-cancel" style="padding:9px 20px;border-radius:8px;' +
            'border:1.5px solid #ddd;background:#fff;color:#555;cursor:pointer;' +
            'font-size:13px;font-weight:600;">취소</button>' +
          '<button class="btn-modal-confirm" style="padding:9px 20px;border-radius:8px;' +
            'border:none;background:' + confirmBg + ';color:#fff;cursor:pointer;' +
            'font-size:13px;font-weight:700;">' + (options.confirmText || '확인') + '</button>' +
        '</div>' +
      '</div>';
    o.querySelector('.btn-modal-cancel').addEventListener('click', function(){
      window.closeModal('confirm-modal');
    });
    o.querySelector('.btn-modal-confirm').addEventListener('click', function(){
      window.closeModal('confirm-modal');
      try{ if(typeof onConfirm==='function') onConfirm(); }catch(e){ console.error(e); }
    });
    window.openModal('confirm-modal');
    // 확인 버튼에 포커스
    setTimeout(function(){
      var btn = o.querySelector('.btn-modal-confirm');
      if(btn) btn.focus();
    }, 50);
  }catch(e){ console.error('showConfirmModal error', e); if(typeof onConfirm==='function') onConfirm(); }
};

// ...이후 UI/이벤트 바인딩/운영진만 노출/버튼 등은 league-core.js, index.html에서 추가 구현 예정...