// 초기 실행
renderDash();
renderMembers();
renderLeague();
updateAdminUI();
restoreLeagueUI();

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
  }).catch(function(e){ console.error('Firebase 로드 오류:', e); });
}

// 앱 시작 시 Firebase 로드는 SDK 초기화 후 실행 (하단 script에서)