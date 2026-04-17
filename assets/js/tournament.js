// ── 토너먼트 대진 반영 ──
function goToTournament(){
  const res = ST.week.results;
  if(!res || res.length===0){ alert('조별 순위를 먼저 계산하세요.'); return; }
  if(isJankenPending()){
    alert('가위바위보 순위가 확정되지 않은 조가 있습니다.\n이번주 리그 탭에서 가위바위보를 먼저 확정하세요.');
    return;
  }

  // 토너먼트 진행 중 경고
  const hasRounds = ST.tournament && ST.tournament.rounds && Object.keys(ST.tournament.rounds).length > 0;
  if(hasRounds){
    if(!confirm('토너먼트 경기 결과가 초기화됩니다.\n계속하시겠습니까?')) return;
  }

  // 토너먼트 탭으로 이동
  document.querySelectorAll('.section').forEach(s=>s.classList.remove('active'));
  document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
  document.getElementById('tournament').classList.add('active');
  const tTab = document.querySelector('.tab[onclick*="tournament"]');
  if(tTab) tTab.classList.add('active');

  // 대진 자동 생성
  const size = parseInt(document.getElementById('t-size').value) || 8;
  const grpNames = res.map(r=>r.players.map(p=>p.name));
  const strict = !!document.getElementById('t-ittf-strict') && document.getElementById('t-ittf-strict').checked;
  const bracket = buildBracket(grpNames, res, size, strict);
  while(bracket.length < size) bracket.push('BYE');
  bracket.splice(size);

  ST.tournament = {seeds: bracket.filter(p=>p!=='BYE'), size, bracket, rounds:{}, scores:{}};
  for(let i=0;i<size/2;i++){
    if(bracket[i*2]==='BYE')   ST.tournament.rounds['r1m'+i]=bracket[i*2+1];
    if(bracket[i*2+1]==='BYE') ST.tournament.rounds['r1m'+i]=bracket[i*2];
  }
  saveST();

  const bracketLabel = size===4?'4강':size===8?'8강':size===16?'16강':'32강';
  document.getElementById('t-seeds').textContent =
    bracketLabel + ' 토너먼트 대진\n' +
    res.map(r=> (r.g+'조: '+ r.players.map((p,i)=>(i+1)+'위 '+escapeHtml(p.name)).join(', '))).join('\n');

  renderBracket(bracket, size);
  document.getElementById('t2').style.display='block';

  // 결과 입력칸 초기화
  ['t-win','t-second','t-lucky','t-third','t-third2'].forEach(function(id){
    const el=document.getElementById(id); if(el) el.value='';
  });
  ['t-win-info','t-second-info','t-lucky-info','t-result-display'].forEach(function(id){
    const el=document.getElementById(id); if(el) el.textContent='';
  });
  const disp=document.getElementById('t-third-display');
  if(disp) disp.textContent='4강 결과 입력 후 자동 반영';
}

// ── 일반 조 순위 수정 ──
function reEditGroup(g){
  if(blockIfTournamentInProgress()) return;
  const s3 = document.getElementById('league-matches');
  if(s3) s3.scrollIntoView({behavior:'smooth', block:'start'});
  const statusEl = document.getElementById('s3-status');
  if(statusEl) statusEl.textContent = g+'조 점수 수정 후 [순위 계산하기] 다시 누르세요';
  const matchDivs = document.getElementById('league-matches') ?
    document.getElementById('league-matches').querySelectorAll('div[style*="margin-bottom:28px"]') : [];
  matchDivs.forEach(function(div, idx){
    div.style.outline = (idx===g-1) ? '2px solid #e65100' : '';
  });
  setTimeout(function(){ matchDivs.forEach(function(div){ div.style.outline=''; }); }, 3000);
}

// ── 가위바위보 조 확정 취소 ──
function unconfirmGroup(gi, g, names, startIdx){
  if(blockIfTournamentInProgress()) return;
  if(!confirm(g+'조 순위를 다시 입력하시겠습니까?')) return;
  const grp = ST.week.groups.filter(gr=>gr.length>0)[gi];
  const grpResult = ST.week.results ? ST.week.results.find(r=>r.g===g) : null;
  names.forEach(function(name){
    const ri = grp.indexOf(name);
    if(ri<0) return;
    const rkEl = document.getElementById('g'+gi+'rk'+ri);
    if(!rkEl) return;
    const currentRank = grpResult ? grpResult.players.findIndex(function(p){ return p.name===name; })+1 : '';
      rkEl.textContent = currentRank;
  });
  const leagueMatches = document.getElementById('league-matches');
  if(!leagueMatches){ alert(gi+1+'조 경기표를 찾을 수 없습니다. 이번주 리그 탭에서 다시 시도하세요.'); return; }
  const matchDivs = leagueMatches.querySelectorAll('div[style*="margin-bottom:28px"]');
  const matchDiv = matchDivs[gi];
  if(!matchDiv){ alert(gi+1+'조 경기표를 찾을 수 없습니다. 순위 계산하기를 다시 눌러주세요.'); return; }
  const old = matchDiv.querySelector('.jk-banner');
  if(old) old.remove();
  const banner = document.createElement('div');
  banner.className = 'jk-banner';
  banner.style.cssText = 'background:#fff3e0;border:1px solid #ffcc80;border-radius:8px;padding:10px 14px;margin-top:6px;display:flex;align-items:center;justify-content:space-between;gap:10px;';
  const btn = document.createElement('button');
  btn.textContent = '✅ '+g+'조 확정';
  btn.style.cssText = 'padding:7px 16px;background:#e65100;color:white;border:none;border-radius:7px;font-size:12px;font-weight:700;cursor:pointer;white-space:nowrap;';
  btn.dataset.gi = gi; btn.dataset.g = g;
  btn.dataset.names = JSON.stringify(names); btn.dataset.startIdx = startIdx;
  btn.addEventListener('click', function(){
    jkConfirmInline(parseInt(this.dataset.gi), parseInt(this.dataset.g), JSON.parse(this.dataset.names), parseInt(this.dataset.startIdx));
  });
  banner.textContent = '✂️ '+g+'조 '+(startIdx+1)+'~'+(startIdx+names.length)+'위 순위칸에 다시 입력 후 확정';
  banner.appendChild(btn);
  matchDiv.appendChild(banner);
}

function renderTournamentTab(){
  // 안전 보호: 조별 리그 결과가 비어있는 경우 저장된 토너먼트를 표시하지 않음
  if(!ST || !ST.week || !ST.week.results || ST.week.results.length === 0){
    const tb = document.getElementById('t-bracket'); if(tb) tb.textContent = '대진 정보는 조별 리그 결과가 반영된 경우에만 표시됩니다.';
    const ts = document.getElementById('t-seeds'); if(ts) ts.textContent = '';
    const t2 = document.getElementById('t2'); if(t2) t2.style.display = 'none';
    return;
  }

  // 가위바위보 미확정 여부: ST.week.jankenGroups에 미확정 조 있는지 확인
  if(isJankenPending()){
    document.getElementById('t-bracket').innerHTML =
      '<div style="padding:20px;text-align:center;color:#e65100;font-size:13px;font-weight:700;background:#fff8e1;border-radius:8px;">'+
      '⚠️ 이번주 리그 탭에서 가위바위보 순위를 먼저 확정하세요.</div>';
    document.getElementById('t-seeds').textContent = '';
    document.getElementById('t2').style.display = 'none';
    return;
  }
  // 이미 생성된 토너먼트가 있으면 복원
  if(ST.tournament && ST.tournament.bracket && ST.tournament.bracket.length > 0){
    const seeds = ST.tournament.seeds;
    const size = ST.tournament.size;
    document.getElementById('t-seeds').innerHTML =
      '<div style="font-size:12px;font-weight:700;margin-bottom:8px;color:#e65100;">현재 토너먼트 대진</div>'+
      ST.week.results.map(g=>'<div style="margin-bottom:4px;"><span style="font-size:11px;font-weight:700;color:#1565C0;">'+g.g+'조:</span> '+
        g.players.map((p,i)=>'<span class="pill pill-blue" style="margin:2px;">'+(i+1)+'위 '+escapeHtml(p.name)+'</span>').join('')+'</div>'
      ).join('');
  }
}

// ── 리그 전체 테스트 자동 생성 ──
function runLeagueTest(){
  const numPlay = parseInt(document.getElementById('league-test-players').value)||20;
  const numGrps = parseInt(document.getElementById('league-test-groups').value)||4;
  const max = getMaxScore();

  // 1. 회원 랜덤 선발
  const shuffled = MEMBERS.map(m=>m.name).sort(()=>Math.random()-0.5);
  const pool = shuffled.slice(0, Math.min(numPlay, MEMBERS.length));

  // 2. 조 균등 배분
  const groups = Array.from({length:numGrps},()=>[]);
  pool.forEach((name,i)=>groups[i%numGrps].push(name));

  // 3. 조별 경기 랜덤 결과 + ITTF 순위
  const results = groups.map((grp, gi)=>{
    const n = grp.length;
    const matchRes = Array.from({length:n},()=>Array(n).fill(null));
    for(let a=0;a<n;a++){
      for(let b=a+1;b<n;b++){
        const aWins = Math.random()>0.5;
        const gw = aWins ? max : Math.floor(Math.random()*(max-1));
        const gl = aWins ? Math.floor(Math.random()*(max-1)) : max;
        matchRes[a][b]={gw,gl,pw:0,pl:0,played:true};
        matchRes[b][a]={gw:gl,gl:gw,pw:0,pl:0,played:true};
      }
    }
    const ranked = ittfRank(grp, matchRes);
    const stats  = getPlayerStats(grp, matchRes);
    const sortedPlayers = ranked.map(pi=>({
      name:grp[pi], w:stats[pi].w, l:stats[pi].l,
      scored:stats[pi].gw, lost:stats[pi].gl, mp:stats[pi].mp
    }));
    return {g:gi+1, players:sortedPlayers};
  });

  // 4. ST 업데이트
  const today = new Date().toISOString().slice(0,10);
  ST.week = {
    date: today,
    type: '단식',
    set:  max===2?'3판2승':'5판3승',
    players: pool,
    groups: groups,
    results: results,
    tempPlayers: []
  };
  ST.final = {win:'',second:'',third:'',third2:'',lucky:''};
  ST.tournament = {};
  saveST();

  // 5. UI 전체 갱신
  // 날짜/설정 반영
  document.getElementById('league-date').value = today;
  document.getElementById('league-type').value = '단식';
  document.getElementById('league-set').value  = max===2?'3판2승':'5판3승';

  // 선수 선택 표시
  renderLeague();

  // Step2 조편성 표시
  document.getElementById('s2').style.display='block';
  renderGroupAssign();

  // Step3 경기표 표시 (점수 포함)
  document.getElementById('s3').style.display='block';
  renderMatches();

  // 점수를 DOM에 주입 (matchRes 재계산)
  groups.forEach((grp, gi)=>{
    const n = grp.length;
    for(let a=0;a<n;a++){
      for(let b=a+1;b<n;b++){
        const aWins = Math.random()>0.5;
        const gw = aWins ? max : Math.floor(Math.random()*(max-1));
        const gl = aWins ? Math.floor(Math.random()*(max-1)) : max;
        const elA = document.getElementById('g'+gi+'r'+a+'c'+b);
        const elB = document.getElementById('g'+gi+'r'+b+'c'+a);
        if(elA) elA.value = gw;
        if(elB) elB.value = gl;
      }
    }
    realtimeCalc(gi);
  });

  // Step4 순위 표시
  calcResults();

  // 탭 전환
  document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
  document.querySelectorAll('.section').forEach(s=>s.classList.remove('active'));
  document.getElementById('league').classList.add('active');
  document.querySelectorAll('.tab').forEach(t=>{
    if(t.getAttribute('onclick')&&t.getAttribute('onclick').includes("'league'")) t.classList.add('active');
  });

  renderDash();
  alert('🧪 리그 테스트 완료!\n'+numPlay+'명 / '+numGrps+'조 / 경기결과 자동입력\n조별 순위까지 확인하세요.');
}

// ── 범용 브라켓 생성 함수 (1~10조, 4/8/16강) ──
// 원칙: 같은 조끼리 최대한 늦게 만나도록 시드 분산
// 시드 풀 구성: 조별 순위 순서로 round-robin 방식 추출
// 예) 4조: 1순위=A1,B1,C1,D1 / 2순위=A2,B2,C2,D2 / ...
// 브라켓 배치: 시드1은 시드(size)와 대결, 시드2는 시드(size-1)와 대결 (표준 시드 배치)
function buildBracket(grpNames, results, size, strict){
  const numG = grpNames.length;
  const get  = (arr, i) => (arr && arr[i]) ? arr[i] : 'BYE';

  // 시드 풀 생성: 조1위전원→조2위전원→조3위전원 순
  const seeds = [];
  for(let rank=0; rank<20; rank++){
    for(let g=0; g<numG; g++){
      const name = get(grpNames[g], rank);
      if(name && name!=='BYE' && !seeds.includes(name)) seeds.push(name);
      if(seeds.length >= size) break;
    }
    if(seeds.length >= size) break;
  }
  while(seeds.length < size) seeds.push('BYE');

  // ITTF 규정: 시드 배치
  // 4강:  S1vS4, S2vS3  → 결승에서 S1vS2 가능
  // 8강:  S1vS8, S4vS5 (상반) / S3vS6, S2vS7 (하반) → 준결승 S1vS4, S3vS2 / 결승 S1vS2
  // 16강: S1vS16,S8vS9 / S4vS13,S5vS12 / S3vS14,S6vS11 / S2vS15,S7vS10
  //       → QF S1vS8,S4vS5 / S3vS6,S2vS7 → SF S1vS4, S3vS2 → 결승 S1vS2
  // 시드인덱스(0-based) → 브라켓 슬롯 매핑
  function getSeedSlot(si, sz){
    if(sz===4)  return [0,2,3,1][si];
    if(sz===8)  return [0,6,4,2,3,5,7,1][si];
    if(sz===16) return [0,12,8,4,6,10,14,2,3,15,11,7,5,9,13,1][si];
    if(sz===32) return [0,28,16,12,8,20,24,4,6,26,22,10,14,18,30,2,3,31,19,15,11,23,27,7,5,25,21,9,13,17,29,1][si];
    return si;
  }

  const bracket = new Array(size).fill('BYE');
  seeds.forEach(function(name, si){
    if(si >= size) return;
    const slot = getSeedSlot(si, size);
    if(slot !== undefined) bracket[slot] = name;
  });

  // 1라운드(첫 매치)에서 같은 조끼리 만나지 않도록 가능한 경우 교환
  try{
    const grpMap = {};
    if(results && Array.isArray(results)){
      results.forEach(function(r, idx){
        (r.players||[]).forEach(function(p){ if(p && p.name) grpMap[p.name]=r.g; });
      });
    }
    const pairs = size/2;
    for(let i=0;i<pairs;i++){
      const aIdx = i*2, bIdx = i*2+1;
      const a = bracket[aIdx], b = bracket[bIdx];
      if(!a || !b || a==='BYE' || b==='BYE') continue;
      if(grpMap[a] && grpMap[b] && grpMap[a]===grpMap[b]){
        // 같은 조 충돌: 시드 보호를 위해 가장 낮은 시드(뒤쪽 페어)부터 교환 시도
        for(let j=pairs-1;j>i;j--){
          const cIdx = j*2, dIdx = j*2+1;
          const c = bracket[cIdx], d = bracket[dIdx];
          // 시도: b<->d (낮은 시드 위치 우선)
          const ok2 = d && d!=='BYE' && (!grpMap[a] || !grpMap[d] || grpMap[a]!==grpMap[d]);
          const ok2b = (!grpMap[b] || !grpMap[c] || grpMap[b]!==grpMap[c]);
          if(ok2 && ok2b){ bracket[bIdx]=d; bracket[dIdx]=b; break; }
          // 시도: b<->c
          const ok1 = c && c!=='BYE' && (!grpMap[a] || !grpMap[c] || grpMap[a]!==grpMap[c]);
          const ok1b = (!grpMap[b] || !grpMap[d] || grpMap[b]!==grpMap[d]);
          if(ok1 && ok1b){ bracket[bIdx]=c; bracket[cIdx]=b; break; }
        }
      }
    }
    // ITTF Strict 모드: 조당 인원이 많으면 반쪽 분리가 불가능하여 오히려 시드 배치를 망가뜨리므로 제거됨
  }catch(e){ /* 안전하게 무시 */ }
  return bracket;
}
function genTestTournament(){
  // 리그 탭 DOM 접근을 위해 잠시 league 탭 활성화
  document.querySelectorAll('.section').forEach(s=>s.classList.remove('active'));
  document.getElementById('league').classList.add('active');

  ['t-win','t-second','t-lucky','t-third','t-third2'].forEach(id=>{
    const el=document.getElementById(id); if(el) el.value='';
  });
  ['t-win-info','t-second-info','t-lucky-info','t-result-display'].forEach(id=>{
    const el=document.getElementById(id); if(el) el.textContent='';
  });
  const disp=document.getElementById('t-third-display');
  if(disp) disp.textContent='4강 결과 입력 후 자동 반영';
  const size    = parseInt(document.getElementById('t-size').value);
  const numGrps = parseInt(document.getElementById('test-groups').value) || 4;
  const numPlay = parseInt(document.getElementById('test-players-input').value) || 20;
  const max     = getMaxScore();

  // ── 1. 실제 회원 풀에서 랜덤 선발 ──
  // 가위바위보 테스트: 1조 첫 3명은 같은 부수(6부) 회원으로 배치
  const bu6 = MEMBERS.filter(m=>m.bu===6).map(m=>m.name).sort(()=>Math.random()-0.5);
  const others = MEMBERS.filter(m=>m.bu!==6).map(m=>m.name).sort(()=>Math.random()-0.5);
  const allSorted = [...bu6, ...others];
  const pool = allSorted.slice(0, Math.min(numPlay, MEMBERS.length));

  // ── 2. 조 편성 ──
  const groups = Array.from({length:numGrps}, ()=>[]);
  const jankenTest = document.getElementById('test-janken') && document.getElementById('test-janken').checked;
  if(jankenTest && numGrps >= 2){
    // 가위바위보 테스트: 1조에 6부 3명 강제 배정
    const jkThree = bu6.slice(0,3);
    groups[0].push(...jkThree);
    const restPool = pool.filter(n=>!jkThree.includes(n));
    restPool.forEach((name,i)=> groups[(i%(numGrps-1))+1].push(name));
  } else {
    // 일반: 균등 배분
    pool.forEach((name, i) => groups[i % numGrps].push(name));
  }

  // ── 3. 조별 경기 랜덤 결과 생성 + ITTF 순위 계산 ──
  const allMatchRes = []; // DOM 주입용으로 저장
  const results = groups.map((grp, gi) => {
    const n = grp.length;
    const matchRes = Array.from({length:n}, ()=>Array(n).fill(null));
    for(let a=0; a<n; a++){
      for(let b=a+1; b<n; b++){
        let gw, gl;
        if(gi===0 && a<3 && b<3){
          // 1조 첫 3명: 순환 승리 → 가위바위보 상황 강제 생성
          // A>B(2:1), B>C(2:1), C>A(2:1) → 1승1패, 게임득실 2/1 동률
          if(a===0&&b===1){ gw=max; gl=max-1; }
          else if(a===0&&b===2){ gw=max-1; gl=max; }
          else if(a===1&&b===2){ gw=max; gl=max-1; }
          else { const aw=Math.random()>0.5; gw=aw?max:max-1; gl=aw?max-1:max; }
        } else {
          const aWins = Math.random() > 0.5;
          gw = aWins ? max : Math.floor(Math.random()*(max-1));
          gl = aWins ? Math.floor(Math.random()*(max-1)) : max;
        }
        matchRes[a][b] = {gw, gl, pw:0, pl:0, played:true};
        matchRes[b][a] = {gw:gl, gl:gw, pw:0, pl:0, played:true};
      }
    }
    allMatchRes.push(matchRes);
    // 순위 계산
    const ranked = ittfRank(grp, matchRes);
    const stats  = getPlayerStats(grp, matchRes);
    const sortedPlayers = ranked.map(pi=>({
      name: grp[pi],
      w:    stats[pi].w,
      l:    stats[pi].l,
      scored: stats[pi].gw,
      lost:   stats[pi].gl,
      mp:     stats[pi].mp
    }));
    return {g: gi+1, players: sortedPlayers};
  });

  ST.week = {
    date: new Date().toISOString().slice(0,10),
    type: '단식',
    set:  max===2 ? '3판2승' : '5판3승',
    players: pool,
    groups:  groups,
    results: results,
    tempPlayers: []
  };

  // ── 4. 토너먼트 대진 생성 ──
  const grpNames = results.map(g=>g.players.map(p=>p.name));
  const strict = !!document.getElementById('t-ittf-strict') && document.getElementById('t-ittf-strict').checked;
  const bracket = buildBracket(grpNames, results, size, strict);

  while(bracket.length < size) bracket.push('BYE');
  bracket.splice(size);

  ST.tournament = {seeds: bracket.filter(p=>p!=='BYE'), size, bracket, rounds:{}, scores:{}};
  for(let i=0;i<size/2;i++){
    if(bracket[i*2]==='BYE')   ST.tournament.rounds['r1m'+i]=bracket[i*2+1];
    if(bracket[i*2+1]==='BYE') ST.tournament.rounds['r1m'+i]=bracket[i*2];
  }

  saveST();

  // ── 5. 이번주 리그 탭 UI 동기화 ──
  const today = new Date().toISOString().slice(0,10);
  document.getElementById('league-date').value = today;
  document.getElementById('league-type').value = '단식';
  document.getElementById('league-set').value  = max===2?'3판2승':'5판3승';
  renderLeague();
  // Step2 조편성
  document.getElementById('s2').style.display='block';
  renderGroupAssign();
  // Step3 경기표
  document.getElementById('s3').style.display='block';
  renderMatches();
  // 점수 DOM 주입 - 저장된 matchRes 그대로 사용
  groups.forEach(function(grp, gi){
    const n = grp.length;
    const matchRes = allMatchRes[gi];
    for(let a=0;a<n;a++){
      for(let b=a+1;b<n;b++){
        const r = matchRes[a][b];
        if(!r) continue;
        const elA = document.getElementById('g'+gi+'r'+a+'c'+b);
        const elB = document.getElementById('g'+gi+'r'+b+'c'+a);
        if(elA) elA.value = r.gw;
        if(elB) elB.value = r.gl;
      }
    }
    realtimeCalc(gi);
  });
  // Step4 순위
  calcResults();

  const bracketLabel = size===4?'4강':size===8?'8강':size===16?'16강':'32강';
  document.getElementById('t-seeds').textContent =
    '테스트: '+numGrps+'조 편성 → '+bracketLabel+' 토너먼트\n' +
    results.map(g=> (g.g+'조: '+ g.players.map((p,i)=>(i+1)+'위 '+p.name).join(', '))).join('\n');

  renderBracket(bracket, size);
  document.getElementById('t2').style.display='block';
  renderDash();

  // tournament 탭으로 복귀
  document.querySelectorAll('.section').forEach(s=>s.classList.remove('active'));
  document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
  document.getElementById('tournament').classList.add('active');
  const tTab = document.querySelector('.tab[onclick*="tournament"]');
  if(tTab) tTab.classList.add('active');
}

function genTournament(){
  // 결과 입력칸 초기화
  ['t-win','t-second','t-lucky','t-third','t-third2'].forEach(id=>{
    const el=document.getElementById(id); if(el) el.value='';
  });
  ['t-win-info','t-second-info','t-lucky-info','t-result-display'].forEach(id=>{
    const el=document.getElementById(id); if(el) el.textContent='';
  });
  const disp=document.getElementById('t-third-display');
  if(disp) disp.textContent='4강 결과 입력 후 자동 반영';
  const res=ST.week.results;
  if(!res||res.length===0){alert('리그 순위를 먼저 계산하세요.\n이번주 리그 탭 → 경기 결과 입력 → 순위 계산하기');return;}
  if(ST.week && ST.week.hasJanken){
    alert('가위바위보로 결정되지 않은 순위가 있습니다.\n이번주 리그 탭에서 가위바위보를 먼저 확정하세요.');
    return;
  }
  const totalWins = res.reduce((sum,g)=>sum+g.players.reduce((s,p)=>s+p.w,0),0);
  if(totalWins===0){alert('경기 결과를 먼저 입력하세요.\n이번주 리그 탭 → 경기 결과 입력 → 순위 계산하기');return;}
  const size=parseInt(document.getElementById('t-size').value);

  // 조별 선수 목록
  const groups = res.map(g=>g.players.map(p=>p.name));
  const strict = !!document.getElementById('t-ittf-strict') && document.getElementById('t-ittf-strict').checked;
  const bracket = buildBracket(groups, res, size, strict);
  while(bracket.length < size) bracket.push('BYE');
  bracket.splice(size);

  // seeds: 대진표 순서대로 (표시용)
  const seeds = bracket.filter(p=>p!=='BYE');

  ST.tournament = ST.tournament||{};
  ST.tournament.seeds = seeds;
  ST.tournament.size = size;
  ST.tournament.bracket = bracket;
  ST.tournament.rounds = {};
  ST.tournament.scores = {};
  saveST();

  // BYE 자동 처리
  for(let i=0;i<size/2;i++){
    const p1=bracket[i*2], p2=bracket[i*2+1];
    if(p1==='BYE') ST.tournament.rounds[`r1m${i}`]=p2;
    if(p2==='BYE') ST.tournament.rounds[`r1m${i}`]=p1;
  }
  saveST();

  document.getElementById('t-seeds').innerHTML = '';

  renderBracket(bracket, size);
  document.getElementById('t2').style.display='block';
}

function getPlayerGroupInfo(){
  // 선수별 조번호, 조순위 맵 반환: {이름: {g:1, rank:1}}
  const info = {};
  const res = ST.week.results || [];
  res.forEach(g=>{
    g.players.forEach((p,i)=>{
      info[p.name] = {g: g.g, rank: i+1};
    });
  });
  return info;
}

function renderBracket(bracket, size){
  const r = ST.tournament.rounds || {};
  const gInfo = getPlayerGroupInfo();

  const rounds = [];
  let curBracket = [...bracket];
  let roundSize = size;
  let roundNum = 1;
  while(roundSize >= 2){
    const pairs = [];
    for(let i=0;i<roundSize/2;i++) pairs.push([curBracket[i*2], curBracket[i*2+1]]);
    rounds.push({pairs, roundNum});
    const winners = pairs.map((_,i)=>r['r'+roundNum+'m'+i]||null);
    curBracket = winners;
    roundSize = roundSize/2;
    roundNum++;
  }

  const CARD_W   = size===16 ? 200 : 220;
  const ROW_H    = size===16 ? 38  : 44;
  const SEP_H    = 1;
  const MATCH_H  = ROW_H * 2 + SEP_H;
  const MATCH_GAP= size===16 ? 10 : 16;
  const COL_GAP  = size===16 ? 60 : 70;
  const HEADER_H = 40;
  const SLOT_H   = MATCH_H + MATCH_GAP;

  function matchCY(ri, mi){
    if(ri===0) return mi * SLOT_H + MATCH_H/2;
    return (matchCY(ri-1,mi*2) + matchCY(ri-1,mi*2+1)) / 2;
  }

  const totalH = HEADER_H + (size/2) * SLOT_H - MATCH_GAP + 24;
  const totalW = rounds.length * (CARD_W + COL_GAP) - COL_GAP;

  const roundLabels = size===32 ? ['ROUND OF 32','ROUND OF 16','QUARTERFINAL','SEMIFINAL','FINAL']
                    : size===16 ? ['ROUND OF 16','QUARTERFINAL','SEMIFINAL','FINAL']
                    : size===8  ? ['QUARTERFINAL','SEMIFINAL','FINAL']
                    : size===4  ? ['SEMIFINAL','FINAL'] : [];

  const buMap = {};
  MEMBERS.forEach(function(m){ buMap[m.name] = m.bu!==m.total ? m.bu+'('+m.total+')' : m.total; });
  getExternals().forEach(function(m){ buMap[m.name] = m.total; });
  (ST.week.tempPlayers||[]).forEach(function(m){ buMap[m.name] = m.total; });
  if(ST.doubles && ST.doubles.pairs){
    ST.doubles.pairs.forEach(function(pair){
      const tn=pair[0]+'/'+pair[1];
      const b1=buMap[pair[0]]||'', b2=buMap[pair[1]]||'';
      if(b1||b2) buMap[tn]=b1&&b2?pair[0]+b1+'/'+pair[1]+b2:tn;
    });
  }

  let svgLines = '';
  rounds.forEach(function(round, ri){
    if(ri===rounds.length-1) return;
    round.pairs.forEach(function(pair, mi){
      if(mi%2!==0) return;
      const xR    = ri*(CARD_W+COL_GAP) + CARD_W;
      const xMid  = xR + COL_GAP/2;
      const xL    = (ri+1)*(CARD_W+COL_GAP);
      const yCur  = HEADER_H + matchCY(ri, mi);
      const ySib  = HEADER_H + matchCY(ri, mi+1);
      const yNext = HEADER_H + matchCY(ri+1, mi/2);
      svgLines += '<line x1="'+xR+'" y1="'+yCur+'" x2="'+xMid+'" y2="'+yCur+'" stroke="#1a9650" stroke-width="2"/>';
      svgLines += '<line x1="'+xR+'" y1="'+ySib+'" x2="'+xMid+'" y2="'+ySib+'" stroke="#1a9650" stroke-width="2"/>';
      svgLines += '<line x1="'+xMid+'" y1="'+yCur+'" x2="'+xMid+'" y2="'+ySib+'" stroke="#1a9650" stroke-width="2"/>';
      svgLines += '<line x1="'+xMid+'" y1="'+yNext+'" x2="'+xL+'" y2="'+yNext+'" stroke="#1a9650" stroke-width="2"/>';
    });
  });

  let cardsHtml = '';
  rounds.forEach(function(round, ri){
    const rn    = round.roundNum;
    const xBase = ri*(CARD_W+COL_GAP);

    cardsHtml += '<div style="position:absolute;left:'+xBase+'px;top:8px;width:'+CARD_W+'px;'
      +'font-size:11px;font-weight:900;color:#333;letter-spacing:2px;text-transform:uppercase;">'
      +roundLabels[ri]+'</div>';

    round.pairs.forEach(function(pair, mi){
      const winner = r['r'+rn+'m'+mi]||'';
      const scores = (ST.tournament.scores&&ST.tournament.scores['r'+rn+'m'+mi])||[null,null];
      const cy     = HEADER_H + matchCY(ri, mi);
      const yTop   = cy - MATCH_H/2;
      const mId    = 'r'+rn+'m'+mi;
      const p0safe = (pair[0]||'').replace(/'/g,"\\'");
      const p1safe = (pair[1]||'').replace(/'/g,"\\'");
      const bothReal = pair[0]&&pair[0]!=='BYE'&&pair[1]&&pair[1]!=='BYE';
      const matchClick = bothReal ? 'data-mid="'+mId+'" data-p0="'+p0safe+'" data-p1="'+p1safe+'" onclick="var d=this.dataset;openScoreModal(d.mid,d.p0,d.p1)"' : '';

      cardsHtml += '<div '+matchClick+' style="position:absolute;left:'+xBase+'px;top:'+yTop+'px;'
        +'width:'+CARD_W+'px;height:'+MATCH_H+'px;'+(bothReal?'cursor:pointer;':'')+'overflow:hidden;">';

      [pair[0],pair[1]].forEach(function(p, pi){
        const isBye   = p==='BYE';
        const isEmpty = !p||p==='?';
        const isWin   = !isEmpty&&!isBye&&winner===p;
        const isLose  = !isEmpty&&!isBye&&!!winner&&!isWin;
        const gi      = (!isBye&&!isEmpty&&gInfo[p])?gInfo[p]:null;
        const buRaw   = (!isBye&&!isEmpty&&buMap[p])?buMap[p]:'';
        const nm      = isEmpty?'':isBye?'BYE':p;
        const isDP    = p&&p.includes('/');
        const dn      = isDP&&buRaw ? buRaw : (buRaw ? nm+' '+buRaw : nm);
        const sv      = scores[pi]!==null&&scores[pi]!==undefined ? scores[pi] : '';
        const rowTop  = pi===0 ? 0 : ROW_H+SEP_H;
        const rowBg   = isWin ? '#e8f5e9' : isEmpty||isBye ? '#f8f8f8' : 'white';
        const fc      = isWin ? '#1b5e20' : isEmpty||isBye ? '#bbb' : '#1a1a2e';
        const fw      = isWin ? '800' : isLose ? '400' : '600';
        const scColor = sv!=='' ? (isWin?'#2e7d32':'#aaa') : 'transparent';
        const scFw    = isWin ? '800' : '400';
        const leftBar = '';
        const sepDiv  = pi===0 ? '<div style="position:absolute;left:0;top:'+ROW_H+'px;width:100%;height:'+SEP_H+'px;background:'+(isWin?'#c8e6c9':'#eee')+';"></div>' : '';
        const bt      = pi===0 ? 'border-radius:6px 6px 0 0;border-top:1px solid '+(isWin?'#a5d6a7':'#e0e0e0')+';' : 'border-radius:0 0 6px 6px;border-bottom:1px solid '+(isWin?'#a5d6a7':'#e0e0e0')+';';
        const giTagColor = isWin ? '#388e3c' : '#888';
        const giTag = gi ? '<span style="font-size:10px;color:'+giTagColor+';margin-left:4px;font-weight:600;">'+gi.g+'조'+gi.rank+'위</span>' : '';
        const nameTag = isEmpty ? '<span style="color:#bbb;font-size:11px;font-style:italic;">미정</span>'
          : isBye ? '<span style="color:#bbb;font-size:11px;">BYE</span>'
          : '<span style="font-size:13px;font-weight:'+fw+';color:'+fc+';">'+dn+'</span>'+giTag;
        const scEl    = (!isEmpty&&!isBye)
          ? '<div style="min-width:28px;text-align:right;font-size:14px;font-weight:'+scFw+';color:'+scColor+';padding-right:10px;">'+(sv!==''?sv:'')+'</div>'
          : '<div style="min-width:28px;"></div>';
        const pSafe2  = (!isEmpty&&!isBye)?p.replace(/'/g,"\\'"):'';
        const hov     = (!isEmpty&&!isBye)
          ? 'data-pname="'+pSafe2+'" onmouseenter="showPlayerPopup(event,this.dataset.pname)" onmouseleave="hidePlayerPopup()"'
          : '';

        cardsHtml += '<div '+hov+' style="position:absolute;left:0;top:'+rowTop+'px;width:100%;height:'+ROW_H+'px;'
          +'box-sizing:border-box;'+bt+'border-left:1px solid '+(isWin?'#a5d6a7':'#e0e0e0')+';border-right:1px solid '+(isWin?'#a5d6a7':'#e0e0e0')+';'
          +'display:flex;align-items:center;background:'+rowBg+';overflow:hidden;">'
          +'<div style="flex:1;overflow:hidden;display:flex;align-items:center;padding-left:10px;padding-right:4px;">'
          +nameTag+'</div>'
          +scEl
          +'</div>';
        if(pi===0) cardsHtml += sepDiv;
      });

      cardsHtml += '</div>';
    });
  });

  const html =
    '<div style="overflow-x:auto;padding:24px 16px 28px;background:white;border-radius:12px;border:1px solid #ebebeb;">'
   +'<div style="position:relative;width:'+totalW+'px;height:'+totalH+'px;">'
   +'<svg style="position:absolute;top:0;left:0;width:100%;height:100%;overflow:visible;">'+svgLines+'</svg>'
   +cardsHtml
   +'</div></div>';

  document.getElementById('t-bracket').innerHTML = html;

  const lastRound = rounds.length;
  const finWinner = r['r'+lastRound+'m0']||'';
  const finalist  = rounds[rounds.length-1].pairs[0];
  if(finWinner){
    const second = finalist[0]===finWinner ? finalist[1] : finalist[0];
    const twEl = document.getElementById('t-win');
    const tsEl = document.getElementById('t-second');
    if(twEl) twEl.value = finWinner;
    if(tsEl) tsEl.value = second||'';
  }

  if(lastRound >= 2){
    const sfRound = lastRound - 1;
    const sfPairs = rounds[sfRound-1] ? rounds[sfRound-1].pairs : null;
    if(sfPairs){
      const losers = [];
      sfPairs.forEach(function(pair, mi){
        const w = r['r'+sfRound+'m'+mi]||'';
        if(w){ const loser=pair[0]===w?pair[1]:pair[0]; if(loser&&loser!=='?'&&loser!=='BYE') losers.push(loser); }
      });
      const trdEl  = document.getElementById('t-third');
      const trd2El = document.getElementById('t-third2');
      if(trdEl  && losers[0]) trdEl.value  = losers[0];
      if(trd2El && losers[1]) trd2El.value = losers[1];
      const dispEl = document.getElementById('t-third-display');
      if(dispEl && losers.length>0){
        const bm2={}; MEMBERS.forEach(function(m){ bm2[m.name]=m.total; });
        const gi2=getPlayerGroupInfo();
        dispEl.innerHTML=losers.map(function(name){
          const bu=bm2[name]?bm2[name]:'';
          const gi=gi2[name]?gi2[name].g+'조 '+gi2[name].rank+'위':'';
          const sub=[bu,gi].filter(Boolean).join(' · ');
          return '<div style="display:flex;flex-direction:column;padding:4px 12px;background:white;border-radius:6px;border:1px solid #e0e0e0;min-width:120px;">'
            +'<span style="font-size:13px;font-weight:600;color:#1a1a2e;">'+name+'</span>'
            +(sub?'<span style="font-size:10px;color:#888;margin-top:1px;">'+sub+'</span>':'')+'</div>';
        }).join('<span style="font-size:12px;color:#bbb;font-weight:600;margin:0 4px;">vs</span>');
      }
    }
  }

  fillResultInfo('t-win');
  fillResultInfo('t-second');
  fillResultInfo('t-third');
  fillResultInfo('t-third2');
  fillResultInfo('t-lucky');
}

function fillResultInfo(inputId){
  const input = document.getElementById(inputId);
  const info  = document.getElementById(inputId+'-info');
  if(!input||!info) return;
  const name = input.value.trim();
  if(!name){ info.textContent=''; return; }
  const m = MEMBERS.find(function(x){ return x.name===name; });
  const ext = getExternals().find(function(x){ return x.name===name; });
  const person = m || ext;
  const gi = (ST.week.results||[]).reduce(function(found, g){
    if(found) return found;
    const idx = g.players.findIndex(function(p){ return p.name===name; });
    return idx>=0 ? {g:g.g, rank:idx+1} : null;
  }, null);
  const buStr  = person ? person.total : '';
  const giStr  = gi ? gi.g+'조 '+gi.rank+'위' : '';
  const extTag = ext ? ' [특별]' : '';
  const parts  = [buStr, giStr].filter(Boolean);
  info.textContent = parts.length ? parts.join(' · ')+extTag : (person?extTag:'게스트');
  info.style.color = m ? '#1565C0' : ext ? '#e65100' : '#888';
}

function openScoreModal(matchId, p0, p1){
  hidePlayerPopup(); // 팝업 먼저 숨기기
  const sc = (ST.tournament.scores && ST.tournament.scores[matchId]) || [null, null];
  document.getElementById('sm-title').textContent = p0 + ' vs ' + p1;
  document.getElementById('sm-p0-name').textContent = p0;
  document.getElementById('sm-p1-name').textContent = p1;
  document.getElementById('sm-sc0').value = sc[0] !== null ? sc[0] : '';
  document.getElementById('sm-sc1').value = sc[1] !== null ? sc[1] : '';
  document.getElementById('sm-matchid').value = matchId;
  document.getElementById('sm-p0').value = p0;
  document.getElementById('sm-p1').value = p1;
  document.getElementById('score-modal').style.display = 'flex';
  setTimeout(function(){ document.getElementById('sm-sc0').focus(); document.getElementById('sm-sc0').select(); }, 50);
}

function closeScoreModal(){
  document.getElementById('score-modal').style.display = 'none';
}

function saveScoreModal(){
  const matchId = document.getElementById('sm-matchid').value;
  const p0 = document.getElementById('sm-p0').value;
  const p1 = document.getElementById('sm-p1').value;
  const v0 = parseInt(document.getElementById('sm-sc0').value);
  const v1 = parseInt(document.getElementById('sm-sc1').value);
  const max = getMaxScore();
  if(isNaN(v0) || isNaN(v1)){ alert('두 점수를 모두 입력하세요.'); return; }
  if(v0 === v1){ alert('동점은 불가합니다.'); return; }
  if(v0 > max || v1 > max){ alert('최대 점수는 ' + max + '입니다.'); return; }
  if(!ST.tournament.scores) ST.tournament.scores = {};
  ST.tournament.scores[matchId] = [v0, v1];
  if(!ST.tournament.rounds) ST.tournament.rounds = {};
  ST.tournament.rounds[matchId] = v0 > v1 ? p0 : p1;
  saveST();
  closeScoreModal();
  renderBracket(ST.tournament.bracket, ST.tournament.size);
}

var _popupTimer = null;
var _popupEventCache = null;

function showPlayerPopup(e, name){
  // 점수 입력 모달이 열려있으면 팝업 표시 안 함
  if(document.getElementById('score-modal').style.display==='flex') return;
  // 딜레이: 빠르게 지나가면 팝업 안 뜸
  clearTimeout(_popupTimer);
  _popupEventCache = {pageX: e.clientX, pageY: e.clientY};
  _popupTimer = setTimeout(function(){
    _showPlayerPopupNow(_popupEventCache, name);
  }, 450);
}

function _showPlayerPopupNow(e, name){
  // 점수 입력 모달이 열려있으면 팝업 표시 안 함
  if(document.getElementById('score-modal').style.display==='flex') return;
  const popup = document.getElementById('player-popup');
  if(!popup) return;

  // 조별리그 성적 찾기
  const res = ST.week.results || [];
  let groupInfo = null, groupStats = null;
  res.forEach(function(g){
    g.players.forEach(function(p, idx){
      if(p.name === name){
        groupInfo = {g: g.g, rank: idx+1, total: g.players.length};
        groupStats = p;
      }
    });
  });

  // 토너먼트 결과 찾기
  const tr = (ST.tournament && ST.tournament.rounds) || {};
  const ts = (ST.tournament && ST.tournament.scores) || {};
  const bracket = (ST.tournament && ST.tournament.bracket) || [];
  const size = (ST.tournament && ST.tournament.size) || 0;
  const tResults = [];

  if(size >= 2){
    let curBracket = [...bracket];
    let roundSize = size;
    let roundNum = 1;
    const roundNames = {1:'16강',2:'8강',3:'4강',4:'결승'};
    const totalRounds = Math.log2(size);
    while(roundSize >= 2){
      const rLabel = roundNames[totalRounds - Math.log2(roundSize) + 1] || (roundSize+'강');
      for(let i=0; i<roundSize/2; i++){
        const p0 = curBracket[i*2], p1 = curBracket[i*2+1];
        if(p0===name || p1===name){
          const mId = 'r'+roundNum+'m'+i;
          const w = tr[mId]||'';
          const sc = ts[mId]||[null,null];
          const opp = p0===name ? p1 : p0;
          const myScore = p0===name ? sc[0] : sc[1];
          const oppScore = p0===name ? sc[1] : sc[0];
          const result = !w ? '진행중' : w===name ? '승' : '패';
          const scoreStr = (myScore!==null&&oppScore!==null) ? myScore+' : '+oppScore : '-';
          tResults.push({round:rLabel, opp:opp||'미정', result, scoreStr});
        }
      }
      const winners = [];
      for(let i=0; i<roundSize/2; i++) winners.push(tr['r'+roundNum+'m'+i]||null);
      curBracket = winners;
      roundSize = roundSize/2;
      roundNum++;
    }
  }

  // 팝업 내용 구성
  const memberBuMap3 = {};
  MEMBERS.forEach(function(m){ memberBuMap3[m.name]=m.total; });
  const bu = memberBuMap3[name] || '';

  let html = '<div style="font-weight:800;font-size:14px;color:#1a1a2e;margin-bottom:8px;border-bottom:1px solid #eee;padding-bottom:6px;">'
    +name+(bu?' <span style="font-size:11px;color:#888;font-weight:400;">'+bu+'부</span>':'')+'</div>';

  // 조별리그
  if(groupStats){
    html += '<div style="font-size:11px;font-weight:700;color:#1565C0;margin-bottom:4px;">📊 조별리그 ('+groupInfo.g+'조 '+groupInfo.rank+'위/'+groupInfo.total+'명)</div>';
    html += '<div style="display:flex;gap:8px;margin-bottom:8px;">'
      +'<span style="background:#e8f5e9;color:#2e7d32;padding:2px 7px;border-radius:4px;font-size:11px;font-weight:700;">'+groupStats.w+'승</span>'
      +'<span style="background:#ffebee;color:#c62828;padding:2px 7px;border-radius:4px;font-size:11px;font-weight:700;">'+groupStats.l+'패</span>'
      +'<span style="background:#f5f5f5;color:#555;padding:2px 7px;border-radius:4px;font-size:11px;">승점 '+groupStats.mp+'</span>'
      +'</div>';
  } else {
    html += '<div style="font-size:11px;color:#bbb;margin-bottom:8px;">조별리그 데이터 없음</div>';
  }

  // 토너먼트
  if(tResults.length > 0){
    html += '<div style="font-size:11px;font-weight:700;color:#e65100;margin-bottom:4px;">🏆 토너먼트</div>';
    tResults.forEach(function(t){
      const rc = t.result==='승'?'#2e7d32':t.result==='패'?'#c62828':'#888';
      const rb = t.result==='승'?'#e8f5e9':t.result==='패'?'#ffebee':'#f5f5f5';
      html += '<div style="display:flex;align-items:center;gap:6px;margin-bottom:3px;">'
        +'<span style="font-size:10px;color:#888;min-width:28px;">'+t.round+'</span>'
        +'<span style="font-size:11px;color:#1a1a2e;">vs '+t.opp+'</span>'
        +'<span style="background:'+rb+';color:'+rc+';padding:1px 6px;border-radius:4px;font-size:11px;font-weight:700;">'+t.result+'</span>'
        +'<span style="font-size:11px;color:#888;">'+t.scoreStr+'</span>'
        +'</div>';
    });
  }

  popup.innerHTML = html;
  popup.style.display = 'block';
  // 마우스 커서 위쪽에 표시
  const popH = popup.offsetHeight || 200;
  const popW = popup.offsetWidth  || 260;
  let px = e.pageX - popW/2;
  let py = e.pageY - popH - 16;
  // 화면 왼쪽 벗어남 방지
  if(px < 8) px = 8;
  // 화면 오른쪽 벗어남 방지
  if(px + popW > window.innerWidth - 8) px = window.innerWidth - popW - 8;
  // 위쪽 벗어나면 커서 아래로
  if(py < 8) py = e.pageY + 16;
  // 아래쪽 벗어남 방지
  if(py + popH > window.innerHeight - 8) py = e.pageY - popH - 16;
  popup.style.left = px + 'px';
  popup.style.top  = py + 'px';
}

function hidePlayerPopup(){
  clearTimeout(_popupTimer);
  _popupTimer = null;
  const popup = document.getElementById('player-popup');
  if(popup) popup.style.display = 'none';
}

function setWinner(matchId, winner, loser){
  if(!ST.tournament.rounds) ST.tournament.rounds={};
  ST.tournament.rounds[matchId]=winner;
  saveST();
  renderBracket(ST.tournament.bracket, ST.tournament.size);
}

function inputScore(matchId, playerIdx, val, p0, p1){
  if(!ST.tournament.scores) ST.tournament.scores={};
  if(!ST.tournament.scores[matchId]) ST.tournament.scores[matchId]=[null,null];
  const maxSc = getMaxScore();
  let v = parseInt(val);
  if(isNaN(v)||v<0) return;
  if(v > maxSc){ v = maxSc; }
  ST.tournament.scores[matchId][playerIdx] = v;
  const sc = ST.tournament.scores[matchId];
  if(sc[0]!==null && sc[1]!==null && sc[0]!==sc[1]){
    const winner = sc[0]>sc[1] ? p0 : p1;
    if(!ST.tournament.rounds) ST.tournament.rounds={};
    ST.tournament.rounds[matchId] = winner;
  }
  saveST();
  renderBracket(ST.tournament.bracket, ST.tournament.size);
}

function saveResult(){
  const win =document.getElementById('t-win').value.trim();
  const sec =document.getElementById('t-second').value.trim();
  const trd =document.getElementById('t-third').value.trim();
  const trd2=document.getElementById('t-third2')?document.getElementById('t-third2').value.trim():'';
  const lky =document.getElementById('t-lucky').value.trim();
  if(!win||!sec){alert('우승/준우승은 필수입니다.');return;}

  // 전체화면 최종 확인 모달
  function proceedSave(){
    ST.final={win,second:sec,third:trd,third2:trd2,lucky:lky};

  const exts = getExternals();
  const extNames = exts.map(e=>e.name);
  const temps = (ST.week.tempPlayers||[]).map(p=>p.name);

  [win,sec,trd,trd2].forEach((name,i)=>{
    if(!name) return;
    const isMember = MNAMES.includes(name);
    const isTemp = temps.includes(name);

    if(isMember){
      // 정회원 승점
      if(!ST.scores[name]) ST.scores[name]={w:0,s:0,t:0,pts:0};
      if(i===0){ST.scores[name].w++;ST.scores[name].pts+=5;}
      else if(i===1){ST.scores[name].s++;ST.scores[name].pts+=3;}
      else{ST.scores[name].t++;ST.scores[name].pts+=2;}
      // 승급 체크: 이월 승점 + 2분기 획득분 합산으로 10점 달성 시
      const copts = (ST.carryOver&&ST.carryOver[name]) ? ST.carryOver[name].pts : 0;
      const totalPts = copts + ST.scores[name].pts;
      if(totalPts >= 10){
        ST.scores[name].up = true;
        // 총 획득 승점 누적 기록
        if(!ST.scores[name].totalEarned) ST.scores[name].totalEarned = 0;
        ST.scores[name].totalEarned += totalPts;
        // 승점 리셋
        ST.scores[name].pts = 0;
        if(ST.carryOver && ST.carryOver[name]) ST.carryOver[name].pts = 0;
        // 부수 자동 1 감소 (강해짐) - ST.buOverride에 저장
        if(!ST.buOverride) ST.buOverride = {};
        const member = MEMBERS.find(m=>m.name===name);
        if(member){
          const curBu = ST.buOverride[name] !== undefined ? ST.buOverride[name] : member.bu;
          if(curBu > 1) ST.buOverride[name] = curBu - 1;
        }
      }
    } else if(isTemp){
      // 게스트 승점
      if(!ST.guestScores) ST.guestScores={};
      const guest = (ST.week.tempPlayers||[]).find(p=>p.name===name);
      const bu = guest ? guest.total : '?';
      if(!ST.guestScores[name]) ST.guestScores[name]={w:0,s:0,t:0,pts:0,bu};
      if(i===0){ST.guestScores[name].w++;ST.guestScores[name].pts+=5;}
      else if(i===1){ST.guestScores[name].s++;ST.guestScores[name].pts+=3;}
      else{ST.guestScores[name].t++;ST.guestScores[name].pts+=2;}
    }
  });
    saveST();
    saveHistory();
    document.getElementById('t-result-display').textContent = '저장 완료! 우승: ' + win + ' (+5점) · 준우승: ' + sec + (trd ? ' · 공동3위: '+ [trd,trd2].filter(Boolean).join(', ') : '');
    alert('승점 반영 완료! 경기 기록에 저장되었습니다.');
  }

  // 전체화면 최종 확인 모달 표시
  if(!document.getElementById('save-result-modal')){
    const m = document.createElement('div');
    m.id = 'save-result-modal';
    m.style = 'position:fixed;top:0;left:0;width:100%;height:100%;display:none;align-items:center;justify-content:center;z-index:13000;background:rgba(0,0,0,0.7);';
    document.body.appendChild(m);
  }
  const modal = document.getElementById('save-result-modal');
  const thirds = [trd,trd2].filter(Boolean).join(', ') || '없음';
  modal.innerHTML = `
    <div style="background:white;border-radius:16px;padding:24px;max-width:400px;width:92%;box-shadow:0 20px 60px rgba(0,0,0,0.4);">
      <div style="text-align:center;font-size:18px;font-weight:700;color:#1a1a2e;margin-bottom:20px;">🏆 최종 결과 확인</div>
      <div style="display:flex;flex-direction:column;gap:12px;margin-bottom:24px;">
        <div style="display:flex;align-items:center;gap:12px;padding:12px;background:#fff9c4;border-radius:10px;">
          <span style="font-size:28px;">🥇</span>
          <div><div style="font-size:11px;color:#888;">우승 (+5점)</div><div style="font-size:18px;font-weight:700;">${escapeHtml(win)}</div></div>
        </div>
        <div style="display:flex;align-items:center;gap:12px;padding:12px;background:#f5f5f5;border-radius:10px;">
          <span style="font-size:28px;">🥈</span>
          <div><div style="font-size:11px;color:#888;">준우승 (+3점)</div><div style="font-size:18px;font-weight:700;">${escapeHtml(sec)}</div></div>
        </div>
        ${trd ? `<div style="display:flex;align-items:center;gap:12px;padding:12px;background:#fff3e0;border-radius:10px;">
          <span style="font-size:28px;">🥉</span>
          <div><div style="font-size:11px;color:#888;">공동3위 (+2점)</div><div style="font-size:18px;font-weight:700;">${escapeHtml(thirds)}</div></div>
        </div>` : ''}
        ${lky ? `<div style="display:flex;align-items:center;gap:12px;padding:12px;background:#e8f5e9;border-radius:10px;">
          <span style="font-size:28px;">🎁</span>
          <div><div style="font-size:11px;color:#888;">행운상</div><div style="font-size:16px;font-weight:700;">${escapeHtml(lky)}</div></div>
        </div>` : ''}
      </div>
      <div style="display:flex;gap:10px;">
        <button onclick="document.getElementById('save-result-modal').style.display='none';"
          style="flex:1;padding:14px;border-radius:10px;border:1px solid #ddd;background:white;font-size:15px;cursor:pointer;font-weight:600;">취소</button>
        <button id="save-result-confirm-btn"
          style="flex:2;padding:14px;border-radius:10px;border:none;background:#e94560;color:white;font-size:15px;font-weight:700;cursor:pointer;">승점 반영 확정</button>
      </div>
    </div>`;
  modal.style.display = 'flex';
  document.getElementById('save-result-confirm-btn').onclick = function(){
    modal.style.display = 'none';
    proceedSave();
  };
}
