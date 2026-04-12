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