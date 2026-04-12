function initScores(){
  if(!confirm('누적 승점을 1분기 데이터로 초기화할까요?\n(기존 승점이 덮어씌워집니다)')) return;
  ST.scores = {
    '김영서': {w:0, s:0, t:1, pts:2},
    '안치국': {w:1, s:0, t:1, pts:7},
    '이상건': {w:0, s:0, t:2, pts:4},
    '이진규': {w:0, s:1, t:1, pts:5},
    '최양님': {w:1, s:0, t:0, pts:5},
    '이미진': {w:1, s:0, t:0, pts:5},
  };
  saveST();
  renderDash();
  renderRanking();
  alert('누적 승점 초기화 완료!');
}

function resetAll(){
  if(!confirm('이번주 선수 선택, 조 편성, 경기 결과, 토너먼트를 모두 초기화할까요?\n(누적 승점은 유지됩니다)')) return;
  const savedTemps = ST.week.tempPlayers||[];
  ST.week = {date:'',type:'단식',set:'3판2승',players:[],groups:[[],[],[],[]],results:[],tempPlayers:savedTemps};
  ST.doubles = {pairs:[],nonMembers:[],groups:[[],[],[],[]],results:[]};
  ST.final = {win:'',second:'',third:'',third2:'',lucky:''};
  ST.tournament = {};
  saveST();
  renderDash();
  renderLeague();
}

function switchTab(name,el){
  document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
  document.querySelectorAll('.section').forEach(s=>s.classList.remove('active'));
  document.getElementById(name).classList.add('active');
  el.classList.add('active');
  if(name==='dashboard') renderDash();
  if(name==='ranking') renderRanking();
  if(name==='members') renderMembers();
  if(name==='league') renderLeague();
  if(name==='tournament') renderTournamentTab();
  if(name==='attendance'){ currentAttQuarter===2 ? renderAttendance() : renderQ1Attendance(); switchAttQuarter(currentAttQuarter||1); }
  if(name==='history') renderHistory();
  if(name==='guide'){}
}

function toggleStep(id){
  const el=document.getElementById(id);
  el.style.display=el.style.display==='none'?'block':'none';
}

// 대시보드
function renderDash(){
  const w=ST.week, f=ST.final;
  document.getElementById('dash-notice').textContent=
    w.date?`${w.date} · ${w.type} · ${w.set||'3판2승'} · 출전 ${w.players.length}명`:'이번주 리그 탭에서 경기를 등록하세요.';
  const top=getSorted()[0];
  document.getElementById('dash-metrics').innerHTML =
    `<div class="metric"><div class="metric-label">출전 인원</div><div class="metric-value">${w.players.length||0}명</div></div>`+
    `<div class="metric"><div class="metric-label">운영 조</div><div class="metric-value">${w.groups.filter(g=>g.length>0).length||0}조</div></div>`+
    `<div class="metric"><div class="metric-label">이번주 우승</div><div class="metric-value" style="font-size:15px;margin-top:2px;">${escapeHtml(f.win||'-')}</div></div>`+
    `<div class="metric"><div class="metric-label">시즌 1위</div><div class="metric-value" style="font-size:15px;margin-top:2px;">${top?escapeHtml(top.name):'-'}</div></div>`;
  const weekDate = ST.week.date || '2026-03-27';
  const dateParts = weekDate.split('-');
  const days=['일','월','화','수','목','금','토'];
  const d = new Date(weekDate);
  const dayStr = days[d.getDay()];
  const dateStr = dateParts.length===3 ? dateParts[0]+'년 '+dateParts[1]+'월 '+dateParts[2]+'일 ('+dayStr+')' : weekDate;
  document.getElementById('dash-results').innerHTML = f.win ? (
    `<div style="font-size:12px;color:#888;font-weight:600;margin-bottom:10px;">📅 ${dateStr}</div>`+
    `<div class="result-item"><span>🥇 우승</span><span style="font-weight:700;">${escapeHtml(f.win)} <span class="pill pill-blue">+5점</span></span></div>`+
    `<div class="result-item"><span>🥈 준우승</span><span style="font-weight:700;">${escapeHtml(f.second)} <span class="pill pill-green">+3점</span></span></div>`+
    (f.third?`<div class="result-item"><span>🥉 공동3위</span><span style="font-weight:700;">${escapeHtml([f.third,f.third2].filter(Boolean).join(', '))} <span class="pill" style="background:#ffebee;color:#c62828;">+1점</span></span></div>`:'') +
    (f.lucky?`<div class="result-item"><span>🎁 행운상</span><span style="font-weight:700;">${escapeHtml(f.lucky)}</span></div>`:'')
  ) : '<div style="color:#888;font-size:13px;">토너먼트 결과 없음</div>';
  const sorted=getSorted().slice(0,5);
  const mx=sorted[0]?sorted[0].pts:1;
  document.getElementById('dash-top5').innerHTML = sorted.map(p=>
    `<div class="bar-wrap"><span class="bar-label">${escapeHtml(p.name)}</span>`+
    `<div class="bar"><div class="bar-fill" style="width:${Math.max(5,(p.pts/mx)*100)}%"></div></div>`+
    `<span class="bar-score">${p.pts}점</span></div>`
  ).join('') || '<div style="color:#888;font-size:13px;">데이터 없음</div>';
}

function getSorted(){
  const exts = getExternals();
  const allMembers = [
    ...MEMBERS.map(m=>({...m, isExt:false})),
    ...exts.map(m=>({...m, isExt:true}))
  ];
  if(!ST.scores) ST.scores={};
  return allMembers.map(m=>{const s=ST.scores[m.name]||{w:0,s:0,t:0,pts:0};return{name:m.name,isExt:m.isExt,...s};})
    .filter(p=>p.pts>0).sort((a,b)=>b.pts-a.pts||b.w-a.w);
}

// 리그
function renderLeague(){
  if(!ST.week) ST.week={date:'',type:'단식',set:'3판2승',players:[],groups:[[],[],[],[]],results:[]};
  if(!ST.week.players) ST.week.players=[];
  const ps=ST.week.players;
  const isDoubles = ST.week.type==='복식';
  const nms = (ST.doubles&&ST.doubles.nonMembers)||[];
  const exts = getExternals();
  const temps = ST.week.tempPlayers||[];

  // 정회원 칩 (안전하게 이스케이프)
  let html = '<div style="font-size:11px;color:#1a1a2e;font-weight:700;margin-bottom:6px;">🏓 정회원</div>';
  html += MEMBERS.map(function(m){
    const sel = ps.includes(m.name) ? 'selected' : '';
    const style = (!isAdmin && ps.includes(m.name)) ? 'opacity:0.5;cursor:default;' : '';
    const label = escapeHtml(m.name) + (m.bu!==m.total ? escapeHtml(m.bu+'('+m.total+')') : escapeHtml(m.total));
    return `<span class="player-chip ${sel}" onclick="toggleP('${jsEscape(m.name)}')" style="${style}">${label}</span>`;
  }).join('');

  // 게스트 (게스트)
  html += `<div style="font-size:11px;color:#546e7a;font-weight:700;margin:10px 0 6px;">🎫 게스트</div>`;
  
  const maxGuests = 10;
  const guestSlots = Array.from({length:maxGuests}, (_,i)=>{
    const guest = temps[i];
    if(guest){
      const sel = ps.includes(guest.name);
      return `<span class="player-chip ${sel?'selected':''}" onclick="toggleP('${jsEscape(guest.name)}')"
        style="${sel?'background:#546e7a;color:white;border-color:#546e7a;':'background:#eceff1;border-color:#90a4ae;color:#546e7a;'}${!isAdmin&&sel?'opacity:0.5;cursor:default;':''}">${escapeHtml(guest.name)}${escapeHtml(guest.total)}${isAdmin?` <small onclick="removeTempPlayer('${jsEscape(guest.name)}');event.stopPropagation();" style="color:#e94560;cursor:pointer;margin-left:2px;">✕</small>`:''}</span>`;
    } else {
      return `<span class="player-chip" style="background:#eceff1;border:1px dashed #90a4ae;color:#b0bec5;cursor:${isAdmin?'pointer':'default'};" ${isAdmin?`onclick="document.getElementById('temp-combo').focus()"`:''}>+ 추가</span>`;
    }
  });
  html += `<div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:8px;">${guestSlots.join('')}</div>`;
  html += `<div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;margin-top:4px;">
    <input type="text" id="temp-combo" inputmode="text" placeholder="이름+부수 (예: 양정모5)" style="max-width:170px;padding:5px 8px;"
      onkeydown="if(event.key==='Enter'){addTempPlayer();}">
    <button class="btn btn-sm" onclick="addTempPlayer()" style="background:#ede7f6;color:#5c6bc0;border-color:#b39ddb;">+ 추가</button>
  </div>`;

  document.getElementById('player-select').innerHTML = html;
  const total = ps.length;
  document.getElementById('sel-count').textContent=`선택: ${total}명`;
  document.getElementById('s1-status').textContent=`${total}명 선택`;
}

function addTempPlayer(){
  const combo = (document.getElementById('temp-combo').value||'').trim();
  if(!combo){ alert('이름+부수를 입력하세요. (예: 양정모5)'); return; }
  // 뒤에서부터 숫자 추출
  const m = combo.match(/^(.+?)(\d{1,2})$/);
  if(!m){ alert('형식: 이름+부수 (예: 양정모5)'); return; }
  const name = m[1].trim();
  const bu = parseInt(m[2]);
  if(!name){ alert('이름을 입력하세요.'); return; }
  if(bu<1||bu>10){ alert('부수는 1~10 사이여야 합니다.'); return; }
  if(MNAMES.includes(name)||getExternals().find(e=>e.name===name)){
    alert('이미 회원 명단에 있습니다. 위에서 선택하세요.'); return;
  }
  if(!ST.week.tempPlayers) ST.week.tempPlayers=[];
  if(ST.week.tempPlayers.find(p=>p.name===name)){ alert('이미 추가됐습니다.'); return; }
  ST.week.tempPlayers.push({name, total:bu, g:'', temp:true});
  ST.week.players.push(name);
  saveST(); renderLeague();
  // 추가 후 입력란 초기화 + 한글 키보드 유지
  setTimeout(function(){
    const el = document.getElementById('temp-combo');
    if(el){ el.value=''; el.focus(); }
  }, 50);
}

function removeTempPlayer(name){
  ST.week.tempPlayers=(ST.week.tempPlayers||[]).filter(p=>p.name!==name);
  ST.week.players=ST.week.players.filter(p=>p!==name);
  saveST(); renderLeague();
}

function onTypeChange(){
  const isDoubles = document.getElementById('league-type').value === '복식';
  document.getElementById('nonmember-area').style.display = isDoubles ? 'block' : 'none';
}

function addNonMember(){
  const nm = document.getElementById('nonmember-name').value.trim();
  const bu = parseInt(document.getElementById('nonmember-bu').value);
  if(!nm){ alert('이름을 입력하세요.'); return; }
  if(isNaN(bu)||bu<1||bu>10){ alert('부수를 입력하세요 (1~10).'); return; }
  if(MNAMES.includes(nm)){ alert('정회원 명단에 있는 이름입니다. 위에서 선택하세요.'); return; }
  if(!ST.doubles) ST.doubles={pairs:[],nonMembers:[],groups:[[],[],[],[]],results:[]};
  if(!ST.doubles.nonMembers) ST.doubles.nonMembers=[];
  const displayName = nm+bu;
  if(ST.doubles.nonMembers.includes(displayName)){ alert('이미 추가됐습니다.'); return; }
  ST.doubles.nonMembers.push(displayName);
  saveST();
  document.getElementById('nonmember-name').value='';
  document.getElementById('nonmember-bu').value='';
  renderNonMemberList();
  renderLeague();
}

function renderNonMemberList(){
  const nms = (ST.doubles&&ST.doubles.nonMembers)||[];
  document.getElementById('nonmember-list').innerHTML = nms.map(n=>
    `${escapeHtml(n)} ✕`
  ).join(', ');
}

function removeNonMember(name){
  if(!ST.doubles||!ST.doubles.nonMembers) return;
  ST.doubles.nonMembers = ST.doubles.nonMembers.filter(n=>n!==name);
  // 페어에서도 제거
  ST.doubles.pairs = (ST.doubles.pairs||[]).filter(p=>!p.includes(name));
  saveST(); renderNonMemberList(); renderLeague();
}

// 복식 페어 구성
let pairTemp = []; // 현재 선택 중인 2명

function renderPairSelect(){
  const isDoubles = ST.week.type==='복식';
  if(!isDoubles) return;
  if(!ST.doubles) ST.doubles={pairs:[],nonMembers:[],groups:[[],[],[],[]],results:[]};
  const pairs = ST.doubles.pairs||[];
  const paired = pairs.flat();
  const temps = ST.week.tempPlayers||[];
  const allPlayers = [...ST.week.players];
  const unpaired = allPlayers.filter(p=>!paired.includes(p));

  // 부수 맵
  const buMap={};
  MEMBERS.forEach(m=>{ buMap[m.name]=m.total; });
  getExternals().forEach(m=>{ buMap[m.name]=m.total; });
  temps.forEach(m=>{ buMap[m.name]=m.total; });

  document.getElementById('pair-select').innerHTML =
    `<div style="font-size:12px;color:#888;margin-bottom:6px;">미배정 선수 (클릭해서 페어 구성)</div>`+
    unpaired.map(name=>{
      const isSel = pairTemp.includes(name);
      const bu = buMap[name]||'';
      const isTemp = temps.find(t=>t.name===name);
      const chipStyle = isSel ? '' : isTemp ? 'background:#eceff1;border-color:#90a4ae;color:#546e7a;' : '';
      return `<span class="player-chip ${isSel?'selected':''}" onclick="selectForPair('${jsEscape(name)}')" style="${chipStyle}">${escapeHtml(name)}${escapeHtml(String(bu))}</span>`;
    }).join('')+
    (unpaired.length===0?'<span style="font-size:12px;color:#888;">모두 배정 완료</span>':'');

  document.getElementById('pair-list').innerHTML =
    `<div style="font-size:12px;color:#888;margin-bottom:6px;">구성된 페어 (${pairs.length}팀)</div>`+
    pairs.map((pair,i)=>{
      const b1=buMap[pair[0]]||''; const b2=buMap[pair[1]]||'';
      return `<div style="display:inline-flex;align-items:center;gap:6px;margin:3px;padding:5px 10px;background:#e8f5e9;border:1px solid #a5d6a7;border-radius:20px;font-size:12px;">
        <strong>${escapeHtml(pair[0])}${escapeHtml(String(b1))}/${escapeHtml(pair[1])}${escapeHtml(String(b2))}</strong>
        <span onclick="removePair(${i})" style="cursor:pointer;color:#e94560;font-size:11px;">✕</span>
      </div>`;
    }).join('')||'<span style="font-size:12px;color:#bbb;">아직 없음</span>';

  document.getElementById('s-pairs-status').textContent = `${pairs.length}팀 구성`;
}

function selectForPair(name){
  if(pairTemp.includes(name)){
    pairTemp = pairTemp.filter(p=>p!==name);
  } else {
    pairTemp.push(name);
    if(pairTemp.length===2){
      if(!ST.doubles.pairs) ST.doubles.pairs=[];
      ST.doubles.pairs.push([...pairTemp]);
      pairTemp=[];
      saveST();
    }
  }
  renderPairSelect();
}

function removePair(idx){
  ST.doubles.pairs.splice(idx,1);
  saveST(); renderPairSelect();
}

function confirmPairs(){
  const pairs = ST.doubles.pairs||[];
  const total = ST.week.players.length;
  if(pairs.length*2 < total){
    if(!confirm(`미배정 선수가 있습니다. 계속할까요?`)) return;
  }
  if(pairs.length<2){ alert('최소 2팀 필요합니다.'); return; }
  // 조 편성으로
  document.getElementById('s2').style.display='block';
  renderGroupAssignDoubles();
}

function resetPairs(){
  ST.doubles.pairs=[];
  pairTemp=[];
  saveST(); renderPairSelect();
}

// 복식 조 편성 (팀 단위)
function renderGroupAssignDoubles(){
  const pairs = ST.doubles.pairs||[];
  const gs = ST.doubles.groups||[[],[],[],[]];
  const cls=['g1','g2','g3','g4'];
  const lbl=['1조','2조','3조','4조'];

  document.getElementById('s2-notice').textContent='팀 클릭 시 1조→2조→3조→4조→미배정 순으로 변경됩니다.';
  document.getElementById('group-assign').innerHTML = pairs.map((pair,pi)=>{
    const teamName = pair[0]+'/'+pair[1];
    const gi = gs.findIndex(g=>g.includes(pi));
    return `<span class="player-chip ${gi>=0?cls[gi]:''}" onclick="cycleGDoubles(${pi})">${escapeHtml(teamName)} <small>${gi>=0?lbl[gi]:'미배정'}</small></span>`;
  }).join('');

  const sm=lbl.map((l,i)=>gs[i]&&gs[i].length>0?
    `<span class="pill pill-blue" style="margin:2px;">${l}: ${gs[i].map(pi=>escapeHtml(pairs[pi][0]+'/'+pairs[pi][1])).join(', ')}</span>`:''
  ).join('');
  document.getElementById('group-summary').innerHTML= (sm ? sm : '조 배정을 시작하세요');
  document.getElementById('s2-status').textContent=gs.filter(g=>g.length>0).length+'조 구성 중';
}

function cycleGDoubles(pairIdx){
  const gs = ST.doubles.groups;
  const cur = gs.findIndex(g=>g.includes(pairIdx));
  if(cur>=0) gs[cur].splice(gs[cur].indexOf(pairIdx),1);
  const next = cur>=0?(cur+1)%5:0;
  if(next<4) gs[next].push(pairIdx);
  saveST(); renderGroupAssignDoubles();
}

function onDateChange(){
  const val = document.getElementById('league-date').value;
  if(!val) return;
  const d = new Date(val);
  // 금요일 체크 (5 = 금요일)
  if(d.getDay() !== 5){
    alert('금요일만 선택할 수 있습니다!');
    document.getElementById('league-date').value = '';
    return;
  }
  // 몇째주 금요일인지 계산
  const weekNum = Math.ceil(d.getDate() / 7);
  const weekEl = document.getElementById('league-week');
  const typeEl = document.getElementById('league-type');
  if(weekNum === 1){ weekEl.value='1주차'; typeEl.value='단식'; }
  else if(weekNum === 2){ weekEl.value='2주차'; typeEl.value='단식'; }
  else if(weekNum === 3){ weekEl.value='3주차(복식)'; typeEl.value='복식'; }
  else { weekEl.value='4주차'; typeEl.value='단식'; }
  onTypeChange();
}

function autoSetType(){
  const week = document.getElementById('league-week').value;
  const typeEl = document.getElementById('league-type');
  if(week === '3주차(복식)') typeEl.value = '복식';
  else typeEl.value = '단식';
  onTypeChange();
}

function toggleP(name){
  const ps=ST.week.players;
  const i=ps.indexOf(name);
  if(i>=0)ps.splice(i,1); else ps.push(name);
  saveST(); renderLeague();
}

function confirmPlayers(){
  const isDoubles = document.getElementById('league-type').value==='복식';
  if(ST.week.players.length<(isDoubles?4:4)){alert('최소 4명 선택하세요.');return;}
  ST.week.date=document.getElementById('league-date').value||new Date().toISOString().slice(0,10);
  ST.week.type=document.getElementById('league-type').value;
  ST.week.set=document.getElementById('league-set').value;
  saveST();
  if(isDoubles){
    // 복식: 페어 구성 단계 표시
    if(!ST.doubles) ST.doubles={pairs:[],nonMembers:[],groups:[[],[],[],[]],results:[]};
    document.getElementById('step-pairs').style.display='block';
    document.getElementById('s-pairs').style.display='block';
    document.getElementById('s2-num').textContent='3';
    document.getElementById('s3-num').textContent='4';
    document.getElementById('s4-num').textContent='5';
    renderPairSelect();
  } else {
    document.getElementById('s2').style.display='block';
    renderGroupAssign();
  }
}

function renderGroupAssign(){
  const ps=ST.week.players, gs=ST.week.groups;
  const cls=['g1','g2','g3','g4'];
  const lbl=['1조','2조','3조','4조'];
  document.getElementById('group-assign').innerHTML=ps.map(name=>{
    const gi=gs.findIndex(g=>g.includes(name));
    return `<span class="player-chip ${gi>=0?cls[gi]:''}" onclick="cycleG('${jsEscape(name)}')">${escapeHtml(name)} <small>${gi>=0?lbl[gi]:'미배정'}</small></span>`;
  }).join('');
  const sm=lbl.map((l,i)=>gs[i]&&gs[i].length>0?`<span class="pill pill-blue" style="margin:2px;">${l}: ${gs[i].map(escapeHtml).join(', ')}</span>`:'').join('');
  document.getElementById('group-summary').innerHTML= (sm ? sm : '조 배정을 시작하세요');
  document.getElementById('s2-status').textContent=gs.filter(g=>g.length>0).length+'조 구성 중';
}

function cycleG(name){
  const gs=ST.week.groups;
  const cur=gs.findIndex(g=>g.includes(name));
  if(cur>=0) gs[cur].splice(gs[cur].indexOf(name),1);
  const next=cur>=0?(cur+1)%5:0;
  if(next<4) gs[next].push(name);
  saveST(); renderGroupAssign();
}

function resetGroups(){
  ST.week.groups=[[],[],[],[]];
  saveST();
  renderGroupAssign();
  document.getElementById('s3').style.display='none';
  document.getElementById('s4').style.display='none';
  document.getElementById('league-matches').textContent='';
  document.getElementById('league-results').textContent='';
}

function confirmGroups(){
  const isDoubles = ST.week.type==='복식';
  if(isDoubles){
    if(ST.doubles.groups.filter(g=>g.length>=2).length===0){alert('각 조 최소 2팀 배정하세요.');return;}
  } else {
    if(ST.week.groups.filter(g=>g.length>=3).length===0){alert('각 조 최소 3명 배정하세요.');return;}
  }
  saveST();
  document.getElementById('s3').style.display='block';
  renderMatches();
}

function getMaxScore(){
  return (ST.week.set||'3판2승')==='5판3승' ? 3 : 2;
}

function validateScore(gi, ri, ci){
  if(isTournamentInProgress()){ alert('토너먼트 진행 중에는 경기 점수를 수정할 수 없습니다.'); return; }
  const max = getMaxScore();
  const aEl = document.getElementById(`g${gi}r${ri}c${ci}`);
  const bEl = document.getElementById(`g${gi}r${ci}c${ri}`);
  if(!aEl||!bEl) return;
  let a = parseInt(aEl.value);
  let b = parseInt(bEl.value);
  if(isNaN(a)||isNaN(b)) return;
  if(a > max){ aEl.value = max; a = max; }
  if(b > max){ bEl.value = max; b = max; }
  
  let valid = true;
  let msg = '';
  if(a === b){ valid=false; msg='동점 불가'; }
  else if(a !== max && b !== max){ valid=false; msg='한 명은 반드시 '+max+'이어야 함'; }
  
  const color = valid ? 'transparent' : '#ffebee';
  const border = valid ? 'none' : '1px solid #f44336';
  aEl.style.background = color;
  bEl.style.background = color;
  aEl.style.border = border;
  bEl.style.border = border;
  aEl.title = valid ? '' : msg;
  bEl.title = valid ? '' : msg;
}

// ── ITTF 정식 순위 계산 ──
// 승=2점, 패=1점, 미완료=0점
// 동률: 동률자간 직접대결 → 승점 → 게임득실률 → 점수득실률

function calcMatchPoints(w, l, played){
  // played: 경기를 정상 완료했는지 여부
  if(!played) return 0;
  return w > l ? 2 : 1;
}

function ittfRank(players, matchResults){
  // matchResults[i][j] = {gw, gl, pw, pl, played}
  // gw=이긴게임수, gl=진게임수, pw=이긴점수, pl=진점수
  const n = players.length;

  // 1단계: 전체 승점 계산
  const pts = players.map((_,i)=>{
    let mp=0;
    for(let j=0;j<n;j++){
      if(i===j) continue;
      const r = matchResults[i][j];
      if(!r) continue;
      mp += calcMatchPoints(r.gw, r.gl, r.played);
    }
    return mp;
  });

  // 그룹화 (같은 승점끼리)
  const groups = {};
  players.forEach((_,i)=>{
    const p = pts[i];
    if(!groups[p]) groups[p]=[];
    groups[p].push(i);
  });

  // 각 그룹 내 동률 해소
  const finalRanks = new Array(n).fill(0);
  let rankOffset = 0;

  Object.keys(groups).sort((a,b)=>b-a).forEach(ptKey=>{
    const grp = groups[ptKey];
    if(grp.length===1){
      finalRanks[grp[0]] = rankOffset;
      rankOffset++;
      return;
    }

    // 동률 2명: 직접 대결
    if(grp.length===2){
      const [i,j] = grp;
      const r = matchResults[i][j];
      if(r && r.played){
        if(r.gw > r.gl){ finalRanks[i]=rankOffset; finalRanks[j]=rankOffset+1; }
        else { finalRanks[j]=rankOffset; finalRanks[i]=rankOffset+1; }
      } else {
        // 직접대결 결과 없으면 게임득실률
        const subRanked = ittfSubRank(grp, matchResults, players);
        subRanked.forEach((idx,r)=>{ finalRanks[idx]=rankOffset+r; });
      }
      rankOffset+=2;
      return;
    }

    // 동률 3명 이상: 동률자들끼리 경기만 추출해서 재계산
    const subRanked = ittfSubRank(grp, matchResults, players);
    subRanked.forEach((idx,r)=>{ finalRanks[idx]=rankOffset+r; });
    rankOffset+=grp.length;
  });

  // rank 순으로 정렬된 인덱스 반환
  return players.map((_,i)=>i).sort((a,b)=>finalRanks[a]-finalRanks[b]);
}

if(typeof window !== 'undefined') window._jankenNeeded = [];

function ittfSubRank(grp, matchResults, players){
  // grp: 인덱스 배열, players: 이름 배열 (players[idx] = 이름)
  const subPts={}, subGW={}, subGL={};
  grp.forEach(i=>{ subPts[i]=0; subGW[i]=0; subGL[i]=0; });

  for(let a=0;a<grp.length;a++){
    for(let b=0;b<grp.length;b++){
      if(a===b) continue;
      const i=grp[a], j=grp[b];
      const r=matchResults[i][j];
      if(!r||!r.played) continue;
      subPts[i] += calcMatchPoints(r.gw, r.gl, r.played);
      subGW[i]  += r.gw; subGL[i] += r.gl;
    }
  }

  return [...grp].sort((a,b)=>{
    // 1. 동률자간 승점
    if(subPts[b]!==subPts[a]) return subPts[b]-subPts[a];
    // 2. 동률자간 게임득실률
    const agr = subGL[a]?subGW[a]/subGL[a]:subGW[a];
    const bgr = subGL[b]?subGW[b]/subGL[b]:subGW[b];
    if(Math.abs(bgr-agr)>0.0001) return bgr-agr;
    // 3. 부수 높은 순
    const nameA = players ? players[a] : null;
    const nameB = players ? players[b] : null;
    const mA = nameA ? (MEMBERS.find(m=>m.name===nameA)||{bu:0}) : {bu:0};
    const mB = nameB ? (MEMBERS.find(m=>m.name===nameB)||{bu:0}) : {bu:0};
    if(mB.bu !== mA.bu) return mA.bu - mB.bu; // 부수 낮은 숫자(강한 선수) 우선
    // 4. 완전 동률 → 가위바위보 플래그 기록
    if(nameA && nameB && typeof window !== 'undefined'){
      if(!window._jankenNeeded) window._jankenNeeded = [];
      window._jankenNeeded.push(nameA, nameB);
    }
    return Math.random()-0.5;
  });
}

function buildMatchResults(grp, prefix, isDoubles){
  // DOM에서 점수 읽어서 matchResults 행렬 구성
  const n = grp.length;
  const res = Array.from({length:n},()=>Array(n).fill(null));
  for(let ri=0;ri<n;ri++){
    for(let ci=ri+1;ci<n;ci++){
      const aEl = document.getElementById(`${prefix}r${ri}c${ci}`);
      const bEl = document.getElementById(`${prefix}r${ci}c${ri}`);
      if(!aEl||!bEl) continue;
      const gw = parseInt(aEl.value);
      const gl = parseInt(bEl.value);
      if(isNaN(gw)||isNaN(gl)) continue;
      // 점수(포인트)는 없으므로 0으로 처리 (게임수만 비교)
      res[ri][ci] = {gw, gl, pw:0, pl:0, played:true};
      res[ci][ri] = {gw:gl, gl:gw, pw:0, pl:0, played:true};
    }
  }
  return res;
}

function getPlayerStats(grp, matchResults){
  const n = grp.length;
  return grp.map((_,i)=>{
    let w=0,l=0,gw=0,gl=0;
    for(let j=0;j<n;j++){
      if(i===j) continue;
      const r=matchResults[i][j];
      if(!r||!r.played) continue;
      if(r.gw>r.gl) w++; else l++;
      gw+=r.gw; gl+=r.gl;
    }
    const mp = w*2 + l; // 승점
    return {name:grp[i], w, l, gw, gl, mp};
  });
}

function styleScoreCell(gi, ri, ci){
  // 이긴 쪽 굵고 크게, 진 쪽 회색 작게
  const aEl = document.getElementById(`g${gi}r${ri}c${ci}`);
  const bEl = document.getElementById(`g${gi}r${ci}c${ri}`);
  if(!aEl||!bEl) return;
  const a = parseInt(aEl.value), b = parseInt(bEl.value);
  if(isNaN(a)||isNaN(b)) return;
  if(a > b){
    aEl.style.color='#1a1a2e'; aEl.style.fontSize='15px';
    bEl.style.color='#aaa';    bEl.style.fontSize='12px';
  } else if(b > a){
    bEl.style.color='#1a1a2e'; bEl.style.fontSize='15px';
    aEl.style.color='#aaa';    aEl.style.fontSize='12px';
  } else {
    aEl.style.color='#1a1a2e'; aEl.style.fontSize='14px';
    bEl.style.color='#1a1a2e'; bEl.style.fontSize='14px';
  }
}

function realtimeCalc(gi){
  if(isTournamentInProgress()) return;
  const grp = ST.week.groups.filter(g=>g.length>0)[gi];
  if(!grp) return;
  const n = grp.length;
  const matchResults = buildMatchResults(grp, `g${gi}`, false);
  const stats = getPlayerStats(grp, matchResults);
  const ranked = ittfRank(grp, matchResults);

  ranked.forEach((pi, rank)=>{
    const p = stats[pi];
    const wEl =document.getElementById(`g${gi}w${pi}`);
    const lEl =document.getElementById(`g${gi}l${pi}`);
    const mpEl=document.getElementById(`g${gi}wp${pi}`);
    const rkEl=document.getElementById(`g${gi}rk${pi}`);
    if(wEl)  wEl.textContent  = p.w;
    if(lEl)  lEl.textContent  = p.l;
    if(mpEl) mpEl.textContent = p.mp+'점';
    if(rkEl){
      rkEl.textContent = rank+1;
      rkEl.style.color = rank===0?'#e94560':rank===1?'#1565C0':rank===2?'#CD7F32':'#aaa';
    }
  });
  // 경기순서 태그 자동 완료 표시
  updateGameTags(gi,'g');
}

function updateGameTags(gi,prefix){
  var idx=0;
  while(true){
    var tag=document.getElementById('gt'+gi+'_'+idx);
    if(!tag) break;
    var ri=parseInt(tag.dataset.r), ci=parseInt(tag.dataset.c);
    var a=document.getElementById(prefix+gi+'r'+ri+'c'+ci);
    var b=document.getElementById(prefix+gi+'r'+ci+'c'+ri);
    var filled = a && b && a.value!=='' && b.value!=='';
    if(filled) tag.classList.add('done'); else tag.classList.remove('done');
    idx++;
  }
}

function getOrder(n){
  // ITTF 표준 베르거 방식 - n명 어떤 수도 자동 계산
  const N = n % 2 === 0 ? n : n + 1;
  const rounds = [];
  // 마지막 자리(N번)를 고정, 나머지를 회전
  let circle = Array.from({length: N - 1}, (_, i) => i + 1); // 1 ~ N-1
  const fixed = N; // N번 고정 (홀수면 BYE)

  for(let r = 0; r < N - 1; r++){
    const pairs = [];
    // 첫 번째 vs 고정
    const top = circle[0];
    if(top <= n && fixed <= n) pairs.push([top, fixed]);
    // 나머지 맞은편끼리
    for(let i = 1; i <= (N - 2) / 2; i++){
      const p1 = circle[i];
      const p2 = circle[N - 1 - i];
      if(p1 <= n && p2 <= n) pairs.push([p1, p2]);
    }
    rounds.push(...pairs);
    // circle 회전 (마지막 → 앞으로)
    circle = [circle[circle.length - 1], ...circle.slice(0, circle.length - 1)];
  }
  return rounds;
}

function renderMatches(){
  const isDoubles = ST.week.type==='복식';
  if(isDoubles){ renderMatchesDoubles(); return; }
  const gs=ST.week.groups.filter(g=>g.length>0);
  const memberBuMap={};
  MEMBERS.forEach(m=>{ memberBuMap[m.name]=m.bu!==m.total?m.bu+"("+m.total+")":m.total; });
  getExternals().forEach(m=>{ memberBuMap[m.name]=m.total; });
  (ST.week.tempPlayers||[]).forEach(m=>{ memberBuMap[m.name]=m.total; });
  let html='';
  gs.forEach((grp,gi)=>{
    const n=grp.length;
    const ord=getOrder(n);
    html+=`<div style="margin-bottom:28px;">
      <div style="overflow-x:auto;">
      <table style="border-collapse:collapse;font-size:13px;">
        <thead>
          <tr>
            <th colspan="2" style="background:#e8f5e9;color:#1a1a2e;padding:8px 14px;border:2px solid #aaa;font-size:15px;font-weight:900;text-align:left;min-width:120px;">${gi+1}조</th>
            ${grp.map(name=>`<th style="background:#e3f2fd;color:#1a1a2e;padding:8px 6px;border:1px solid #bbb;text-align:center;min-width:54px;font-weight:700;font-size:13px;">${escapeHtml(name)}</th>`).join('')}
            <th style="background:#fff9c4;padding:8px 6px;border:1px solid #bbb;text-align:center;min-width:36px;font-weight:700;">승</th>
            <th style="background:#fff9c4;padding:8px 6px;border:1px solid #bbb;text-align:center;min-width:36px;font-weight:700;">패</th>
            <th style="background:#fff9c4;padding:8px 6px;border:1px solid #bbb;text-align:center;min-width:46px;font-weight:700;">승점</th>
            <th style="background:#fff9c4;padding:8px 6px;border:1px solid #bbb;text-align:center;min-width:44px;font-weight:700;">순위</th>
          </tr>
        </thead>
        <tbody>
          ${grp.map((p,ri)=>{
            const isGuest = (ST.week.tempPlayers||[]).find(t=>t.name===p);
            const nameStyle = isGuest ? 'color:#546e7a;' : '';
            return `
          <tr>
            <td style="background:#e3f2fd;color:#1a1a2e;font-weight:700;text-align:center;padding:6px 8px;border:1px solid #bbb;min-width:28px;">${ri+1}</td>
            <td style="padding:6px 10px;border:1px solid #bbb;white-space:nowrap;min-width:100px;">
              <span style="font-weight:700;font-size:13px;${nameStyle}">${escapeHtml(p)}${escapeHtml(memberBuMap[p]?memberBuMap[p]: '')}</span>
            </td>
            ${grp.map((_,ci)=>ri===ci?
              `<td style="background:#ccc;border:1px solid #bbb;min-width:54px;"></td>`:
              `<td style="border:1px solid #bbb;padding:2px;text-align:center;min-width:54px;">
                <input type="number" id="g${gi}r${ri}c${ci}" min="0" max="${getMaxScore()}" placeholder=""
                  oninput="validateScore(${gi},${ri},${ci}); realtimeCalc(${gi}); styleScoreCell(${gi},${ri},${ci})"
                  style="width:44px;text-align:center;border:none;background:transparent;font-size:15px;font-weight:700;padding:2px;color:#1a1a2e;">
              </td>`
            ).join('')}
            <td style="text-align:center;padding:6px;border:1px solid #bbb;font-weight:700;" id="g${gi}w${ri}">-</td>
            <td style="text-align:center;padding:6px;border:1px solid #bbb;font-weight:700;" id="g${gi}l${ri}">-</td>
            <td style="text-align:center;padding:6px;border:1px solid #bbb;font-weight:900;font-size:14px;" id="g${gi}wp${ri}">-</td>
            <td style="text-align:center;padding:6px;border:1px solid #bbb;font-weight:900;font-size:15px;" id="g${gi}rk${ri}">-</td>
          </tr>`;}).join('')}
        </tbody>
      </table>
      </div>
      <div style="margin-top:8px;">${ord.map((m,idx)=>`<span id="gt${gi}_${idx}" class="game-tag" onclick="this.classList.toggle('done')" style="font-size:11px;padding:2px 7px;cursor:pointer;" data-r="${m[0]-1}" data-c="${m[1]-1}"><b style="color:#e94560;">${idx+1}</b> ${escapeHtml(grp[m[0]-1])}:${escapeHtml(grp[m[1]-1])}</span>`).join('')}</div>
    </div>`;
  });
  document.getElementById('league-matches').innerHTML=html;
  document.getElementById('s3-status').textContent='입력 대기 중';
}

function renderMatchesDoubles(){
  if(!ST.doubles) return;
  const pairs = ST.doubles.pairs||[];
  const gs = ST.doubles.groups.map(g=>g.map(pi=>pairs[pi])).filter(g=>g.length>0);
  const memberBuMap={};
  MEMBERS.forEach(m=>{ memberBuMap[m.name]=m.bu!==m.total?m.bu+"("+m.total+")":m.total; });
  getExternals().forEach(m=>{ memberBuMap[m.name]=m.total; });

  let html='';
  gs.forEach((grp,gi)=>{
    const n=grp.length;
    const ord=getOrder(n);
    const teamNames = grp.map(p=>p[0]+'/'+p[1]);
    // 팀별 부수 표시 (두 선수 부수)
    const teamBu = grp.map(p=>{
      const b1 = memberBuMap[p[0]]||'';
      const b2 = memberBuMap[p[1]]||'';
      return b1&&b2 ? b1+'/'+b2 : '';
    });
    html+=`<div style="margin-bottom:28px;">
      <div style="overflow-x:auto;">
      <table style="border-collapse:collapse;font-size:13px;">
        <thead><tr>
          <th colspan="2" style="background:#e8f5e9;color:#1a1a2e;padding:8px 14px;border:2px solid #aaa;font-size:15px;font-weight:900;text-align:left;min-width:140px;">${gi+1}조</th>
          ${teamNames.map(tn=>`<th style="background:#e3f2fd;color:#1a1a2e;padding:8px 6px;border:1px solid #bbb;text-align:center;min-width:80px;font-weight:700;font-size:12px;">${escapeHtml(tn)}</th>`).join('')}
          <th style="background:#fff9c4;padding:8px 6px;border:1px solid #bbb;text-align:center;min-width:36px;font-weight:700;">승</th>
          <th style="background:#fff9c4;padding:8px 6px;border:1px solid #bbb;text-align:center;min-width:36px;font-weight:700;">패</th>
          <th style="background:#fff9c4;padding:8px 6px;border:1px solid #bbb;text-align:center;min-width:46px;font-weight:700;">승점</th>
          <th style="background:#fff9c4;padding:8px 6px;border:1px solid #bbb;text-align:center;min-width:44px;font-weight:700;">순위</th>
        </tr></thead>
        <tbody>
          ${teamNames.map((tn,ri)=>`
          <tr>
            <td style="background:#e3f2fd;color:#1a1a2e;font-weight:700;text-align:center;padding:6px 8px;border:1px solid #bbb;min-width:28px;">${ri+1}</td>
            <td style="padding:6px 10px;border:1px solid #bbb;white-space:nowrap;min-width:130px;">
              <span style="font-weight:700;font-size:13px;">${escapeHtml(teamBu[ri]||tn)}</span>
            </td>
            ${teamNames.map((_,ci)=>ri===ci?
              `<td style="background:#ccc;border:1px solid #bbb;min-width:80px;"></td>`:
              `<td style="border:1px solid #bbb;padding:2px;text-align:center;min-width:80px;">
                <input type="number" id="dg${gi}r${ri}c${ci}" min="0" max="${getMaxScore()}" placeholder=""
                  oninput="realtimeCalcDoubles(${gi})"
                  style="width:50px;text-align:center;border:none;background:transparent;font-size:15px;font-weight:700;padding:2px;color:#1a1a2e;">
              </td>`
            ).join('')}
            <td style="text-align:center;padding:6px;border:1px solid #bbb;font-weight:700;" id="dg${gi}w${ri}">-</td>
            <td style="text-align:center;padding:6px;border:1px solid #bbb;font-weight:700;" id="dg${gi}l${ri}">-</td>
            <td style="text-align:center;padding:6px;border:1px solid #bbb;font-weight:900;font-size:14px;" id="dg${gi}wp${ri}">-</td>
            <td style="text-align:center;padding:6px;border:1px solid #bbb;font-weight:900;font-size:15px;" id="dg${gi}rk${ri}">-</td>
          </tr>`).join('')}
        </tbody>
      </table></div>
      <div style="margin-top:8px;">${ord.map((m,idx)=>`<span id="gt${gi}_${idx}" class="game-tag" onclick="this.classList.toggle('done')" style="font-size:11px;padding:2px 7px;cursor:pointer;" data-r="${m[0]-1}" data-c="${m[1]-1}"><b style="color:#e94560;">${idx+1}</b> ${escapeHtml(teamNames[m[0]-1])}:${escapeHtml(teamNames[m[1]-1])}</span>`).join('')}</div>
    </div>`;
  });
  document.getElementById('league-matches').innerHTML=html;
  document.getElementById('s3-status').textContent='입력 대기 중';
}

function realtimeCalcDoubles(gi){
  if(isTournamentInProgress()) return;
  if(!ST.doubles) return;
  const pairs = ST.doubles.pairs||[];
  const grpPairs = ST.doubles.groups.map(g=>g.map(pi=>pairs[pi])).filter(g=>g.length>0)[gi];
  if(!grpPairs) return;
  const teamNames = grpPairs.map(p=>p[0]+'/'+p[1]);
  const matchResults = buildMatchResults(teamNames, `dg${gi}`, false);
  const stats = getPlayerStats(teamNames, matchResults);
  const ranked = ittfRank(teamNames, matchResults);
  ranked.forEach((pi, rank)=>{
    const p = stats[pi];
    const wEl =document.getElementById(`dg${gi}w${pi}`);
    const lEl =document.getElementById(`dg${gi}l${pi}`);
    const mpEl=document.getElementById(`dg${gi}wp${pi}`);
    const rkEl=document.getElementById(`dg${gi}rk${pi}`);
    if(wEl)  wEl.textContent = p.w;
    if(lEl)  lEl.textContent = p.l;
    if(mpEl) mpEl.textContent = p.mp+'점';
    if(rkEl){
      rkEl.textContent = rank+1;
      rkEl.style.color = rank===0?'#e94560':rank===1?'#1565C0':rank===2?'#CD7F32':'#aaa';
    }
  });
  updateGameTags(gi,'dg');
}
