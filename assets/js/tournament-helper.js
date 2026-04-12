// Helper for initializing/creating/verifying tournament from console
// 주석은 한국어, 코드 문자열은 영어
(function(){
  // 안전한 네임스페이스
  window.TournamentHelper = window.TournamentHelper || {};

  // 백업 및 초기화
  TournamentHelper.backupAndClear = function(){
    if(window.ST) window._ST_backup = JSON.parse(JSON.stringify(window.ST));
    ST.week = ST.week || {};
    ST.week.players = [];
    ST.week.groups = [];
    ST.week.results = [];
    ST.week.tempPlayers = [];
    ST.final = {win:'',second:'',third:'',third2:'',lucky:''};
    ST.tournament = {seeds:[], size:8, bracket:[], rounds:{}, scores:{}};
    if(typeof saveST==='function') saveST();
    try{ if(typeof renderLeague==='function') renderLeague(); }catch(e){}
    try{ if(typeof renderGroupAssign==='function') renderGroupAssign(); }catch(e){}
    try{ if(typeof renderMatches==='function') renderMatches(); }catch(e){}
    console.log('TournamentHelper: cleared ST and backed up at window._ST_backup');
  };

  // 그룹 배열로 ST.week.results 채우기
  // groups: Array<Array<string>>
  TournamentHelper.setGroupsFromArray = function(groups){
    ST.week = ST.week || {};
    ST.week.groups = groups.map(g=>g.slice());
    ST.week.results = groups.map(function(gr, idx){
      return { g: idx+1, players: gr.map(function(name){ return { name: name }; }) };
    });
    if(typeof saveST==='function') saveST();
    try{ if(typeof renderGroupAssign==='function') renderGroupAssign(); }catch(e){}
    try{ if(typeof renderMatches==='function') renderMatches(); }catch(e){}
    console.log('TournamentHelper: groups set. groups count=', groups.length);
  };

  // 브라켓 생성 및 ST.tournament 설정
  TournamentHelper.createTournament = function(size){
    if(!ST.week || !ST.week.results || ST.week.results.length===0){ console.warn('TournamentHelper: no ST.week.results found.'); }
    const grpNames = (ST.week.results||[]).map(r=> (r.players||[]).map(p=>p.name) );
    const strict = !!document.getElementById('t-ittf-strict') && document.getElementById('t-ittf-strict').checked;
    const bracket = buildBracket(grpNames, ST.week.results, size, strict);
    while(bracket.length < size) bracket.push('BYE');
    bracket.splice(size);
    ST.tournament = { seeds: bracket.filter(p=>p!=='BYE'), size: size, bracket: bracket, rounds:{}, scores:{} };
    for(let i=0;i<size/2;i++){
      if(bracket[i*2]==='BYE')   ST.tournament.rounds['r1m'+i]=bracket[i*2+1];
      if(bracket[i*2+1]==='BYE') ST.tournament.rounds['r1m'+i]=bracket[i*2];
    }
    if(typeof saveST==='function') saveST();
    try{ renderBracket(bracket, size); }catch(e){}
    console.log('TournamentHelper: tournament created. size=', size, 'bracket:', bracket);
    return bracket;
  };

  // 1라운드 같은조 충돌 검사
  TournamentHelper.checkFirstRoundConflicts = function(bracket){
    bracket = bracket || (ST.tournament && ST.tournament.bracket);
    if(!bracket) return [];
    const map = {};
    (ST.week.results||[]).forEach(r=> (r.players||[]).forEach(p=>{ if(p && p.name) map[p.name]=r.g; }));
    const conflicts = [];
    for(let i=0;i<bracket.length/2;i++){
      const a = bracket[i*2], b = bracket[i*2+1];
      if(!a||!b) continue;
      if(a!=='BYE' && b!=='BYE' && map[a] && map[b] && map[a]===map[b]){
        conflicts.push({match:i+1, a:a, b:b, group:map[a]});
      }
    }
    console.log('TournamentHelper: first-round conflicts count=', conflicts.length);
    if(conflicts.length>0) console.table(conflicts);
    return conflicts;
  };

  // 종합 실행: 초기화→그룹 설정→대진 생성→검증
  TournamentHelper.runFull = function(groups, size){
    try{
      TournamentHelper.backupAndClear();
      TournamentHelper.setGroupsFromArray(groups);
      const bracket = TournamentHelper.createTournament(size || 8);
      const conflicts = TournamentHelper.checkFirstRoundConflicts(bracket);
      if(conflicts.length===0) console.log('TournamentHelper: OK - no first-round same-group matches.');
      else console.warn('TournamentHelper: conflicts exist - consider re-seeding or adjust groups.');
      return {bracket:bracket, conflicts:conflicts};
    }catch(e){ console.error('TournamentHelper.runFull error', e); throw e; }
  };

})();

// 자동 실행: URL에 clear=week 또는 clear=all 이 포함되면 페이지 로드시 초기화 수행
(function(){
  try{
    const qs = window.location.search || '';
    if(qs.includes('clear=week') || qs.includes('clear=all')){
      console.log('TournamentHelper: auto-clear triggered by URL query');
      TournamentHelper.backupAndClear();
      alert('초기화 완료: 이번주 리그 및 토너먼트 데이터가 초기화되었습니다. (Backup at window._ST_backup)');
    }
  }catch(e){ /* ignore */ }
})();
