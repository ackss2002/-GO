const MEMBERS = [
  {name:'곽동석',g:'남',bu:6,total:6},{name:'김덕기',g:'남',bu:5,total:4},
  {name:'김동수',g:'남',bu:6,total:6},{name:'김영란',g:'여',bu:6,total:6},
  {name:'김영서',g:'남',bu:6,total:6},{name:'김옥란',g:'여',bu:9,total:9},
  {name:'김조영',g:'남',bu:6,total:6},{name:'김현종',g:'남',bu:6,total:6},
  {name:'변현진',g:'여',bu:8,total:8},{name:'신문섭',g:'남',bu:6,total:6},
  {name:'안치국',g:'남',bu:6,total:6},
  {name:'양선한',g:'남',bu:6,total:6},{name:'이미진',g:'여',bu:8,total:8},
  {name:'이봄희',g:'여',bu:9,total:9},{name:'이상건',g:'남',bu:6,total:6},
  {name:'이운희',g:'남',bu:7,total:7},{name:'이원호',g:'남',bu:5,total:4},
  {name:'이진규',g:'남',bu:6,total:6},{name:'전인석',g:'남',bu:7,total:7},
  {name:'정영아',g:'여',bu:8,total:8},{name:'정헌모',g:'남',bu:7,total:7},
  {name:'정희남',g:'남',bu:7,total:7},{name:'조경숙',g:'여',bu:9,total:9},
  {name:'최양님',g:'여',bu:7,total:7},{name:'한금환',g:'남',bu:5,total:5},
  {name:'한철호',g:'남',bu:6,total:6},];
const DORMANT = [
  {name:'안경식',g:'남',bu:6,total:6},
  {name:'김성훈',g:'남',bu:7,total:7},
  {name:'오영준',g:'남',bu:4,total:4},
  {name:'이동규',g:'남',bu:5,total:5},
  {name:'허순임',g:'여',bu:9,total:9},
];
// 특별 회원 (localStorage에서 관리)
function getExternals(){ 
  try{ return JSON.parse(localStorage.getItem('ttgo_externals')||'[]'); }catch(e){ return []; }
}
function saveExternals(arr){ localStorage.setItem('ttgo_externals', JSON.stringify(arr)); }
function saveST(){ localStorage.setItem('ttgo_v3', JSON.stringify(ST)); if(typeof db!=='undefined'){ try{ db.ref('ttgo').set(ST); }catch(e){} } }

const MNAMES = MEMBERS.map(m=>m.name);
const INIT_SCORES = {};

let ST = loadST();
ensureCarryOver();
function loadST(){
  try{ const s=localStorage.getItem('ttgo_v3');if(s)return JSON.parse(s); }catch(e){}
  return {
    scores:{},  // 2분기 순수 획득분만
    carryOver:{ // 1분기 이월 승점 (별도 보관)
      '김영서':{w:0,s:0,t:1,pts:2},
      '안치국':{w:1,s:0,t:1,pts:7},
      '이상건':{w:0,s:0,t:2,pts:4},
      '이진규':{w:0,s:1,t:1,pts:5},
      '최양님':{w:1,s:0,t:0,pts:5},
      '이미진':{w:1,s:0,t:0,pts:5},
    },
    week:{date:'',type:'단식',set:'3판2승',players:[],groups:[[],[],[],[]],results:[]},
    doubles:{pairs:[],nonMembers:[],groups:[[],[],[],[]],results:[]},
    final:{win:'',second:'',third:'',third2:'',lucky:''},
    tournament:{},
  };
}

// ST.carryOver 없으면 세팅, ST.scores에서 이월분 제거
function ensureCarryOver(){
  const co = {
    '김영서':{w:0,s:0,t:1,pts:2},
    '안치국':{w:1,s:0,t:1,pts:7},
    '이상건':{w:0,s:0,t:2,pts:4},
    '이진규':{w:0,s:1,t:1,pts:5},
    '최양님':{w:1,s:0,t:0,pts:5},
    '이미진':{w:1,s:0,t:0,pts:5},
  };
  if(!ST.carryOver){
    ST.carryOver = co;
    // 기존 ST.scores에서 이월분 완전 제거 (순수 2분기 획득분만 남김)
    if(ST.scores){
      Object.keys(co).forEach(name=>{
        if(ST.scores[name]){
          const newPts = Math.max(0,(ST.scores[name].pts||0)-(co[name].pts||0));
          if(newPts===0 && !(ST.scores[name].w||ST.scores[name].s||ST.scores[name].t)){
            delete ST.scores[name]; // 2분기 획득 없으면 제거
          } else {
            ST.scores[name].pts = newPts;
          }
        }
      });
    }
    saveST();
  }
}
// 부수 조회 (승급 반영)
function getBu(name){
  if(ST.buOverride && ST.buOverride[name] !== undefined) return ST.buOverride[name];
  const m = MEMBERS.find(m=>m.name===name);
  return m ? m.total : 0;
}

function getMemberBuMap(){
  const map = {};
  MEMBERS.forEach(m=>{
    const bu = getBu(m.name);
    map[m.name] = bu !== m.bu ? m.bu+'('+bu+')' : bu;
  });
  getExternals().forEach(m=>{ map[m.name]=m.total; });
  (ST.week.tempPlayers||[]).forEach(m=>{ map[m.name]=m.total; });
  return map;
}

function loadTestDataDoubles(numGroups){
  if(!confirm('복식 '+numGroups+'조 테스트 데이터를 불러올까요?')) return;

  const pool = MEMBERS.map(m=>m.name);
  const perGroup = 4; // 각 조 4팀
  const totalPlayers = numGroups * perGroup * 2;
  const players = pool.slice(0, totalPlayers);
  const max = 2;

  // 2명씩 페어 구성
  const pairs = [];
  for(let i=0; i<players.length; i+=2) pairs.push([players[i], players[i+1]]);

  // 조 편성 (팀 인덱스로)
  const groups = Array.from({length:numGroups}, (_,gi)=>
    pairs.map((_,pi)=>pi).filter(pi=>pi%numGroups===gi)
  );

  // 경기별 점수 행렬 생성
  const scoreMatrix = groups.map(function(grpIndices){
    const n = grpIndices.length;
    const sc = Array.from({length:n}, ()=>new Array(n).fill(null));
    for(let ri=0;ri<n;ri++){
      for(let ci=ri+1;ci<n;ci++){
        const winner = Math.random()>0.5 ? ri : ci;
        const loser  = winner===ri ? ci : ri;
        sc[winner][loser] = max;
        sc[loser][winner] = Math.floor(Math.random()*max);
      }
    }
    return sc;
  });

  // ITTF 방식으로 결과 계산
  const results = groups.map(function(grpIndices, gi){
    const grp = grpIndices.map(pi=>pairs[pi]);
    const teamNames = grp.map(p=>p[0]+'/'+p[1]);
    const sc = scoreMatrix[gi];
    const n = grp.length;
    const matchResults = Array.from({length:n},()=>Array(n).fill(null));
    for(let ri=0;ri<n;ri++){
      for(let ci=ri+1;ci<n;ci++){
        if(sc[ri][ci]===null) continue;
        matchResults[ri][ci]={gw:sc[ri][ci],gl:sc[ci][ri],pw:0,pl:0,played:true};
        matchResults[ci][ri]={gw:sc[ci][ri],gl:sc[ri][ci],pw:0,pl:0,played:true};
      }
    }
    const stats = getPlayerStats(teamNames, matchResults);
    const ranked = ittfRank(teamNames, matchResults);
    return {
      g: gi+1,
      players: ranked.map(pi=>({
        name: teamNames[pi],
        pair: grp[pi],
        w: stats[pi].w, l: stats[pi].l,
        scored: stats[pi].gw, lost: stats[pi].gl,
        mp: stats[pi].mp
      }))
    };
  });

  ST.week = {date:'2026-04-03', type:'복식', set:'3판2승', players, groups:[[],[],[],[]], results};
  ST.doubles = {
    pairs, nonMembers:[],
    groups: groups.concat([[],[]]).slice(0,4),
    results
  };
  ST.tournament={};
  ST.final={win:'',second:'',third:'',third2:'',lucky:''};
  saveST();

  // 리그 탭으로 이동
  document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
  document.querySelectorAll('.section').forEach(s=>s.classList.remove('active'));
  document.getElementById('league').classList.add('active');
  document.querySelector('.tab[onclick*="league"]').classList.add('active');
  renderLeague();

  document.getElementById('s3').style.display='block';
  document.getElementById('s4').style.display='block';

  const memberBuMap={};
  MEMBERS.forEach(m=>{ memberBuMap[m.name]=m.bu!==m.total?m.bu+"("+m.total+")":m.total; });

  // 경기표 생성
  let matchHtml='';
  groups.forEach(function(grpIndices, gi){
    const grp = grpIndices.map(pi=>pairs[pi]);
    const teamNames = grp.map(p=>p[0]+'/'+p[1]);
    const n = grp.length;
    const sc = scoreMatrix[gi];
    const ord = getOrder(n);
    matchHtml+=`<div style="margin-bottom:28px;">
      <div style="overflow-x:auto;">
      <table style="border-collapse:collapse;font-size:13px;">
        <thead><tr>
          <th colspan="2" style="background:#e8f5e9;color:#1a1a2e;padding:8px 14px;border:2px solid #aaa;font-size:15px;font-weight:900;text-align:left;min-width:140px;">${gi+1}조</th>
          ${teamNames.map(tn=>`<th style="background:#e3f2fd;color:#1a1a2e;padding:8px 6px;border:1px solid #bbb;text-align:center;min-width:80px;font-weight:700;font-size:12px;">${tn}</th>`).join('')}
          <th style="background:#fff9c4;padding:8px 6px;border:1px solid #bbb;text-align:center;min-width:36px;font-weight:700;">승</th>
          <th style="background:#fff9c4;padding:8px 6px;border:1px solid #bbb;text-align:center;min-width:36px;font-weight:700;">패</th>
          <th style="background:#fff9c4;padding:8px 6px;border:1px solid #bbb;text-align:center;min-width:46px;font-weight:700;">승점</th>
          <th style="background:#fff9c4;padding:8px 6px;border:1px solid #bbb;text-align:center;min-width:44px;font-weight:700;">순위</th>
        </tr></thead>
        <tbody>
        ${teamNames.map((tn,ri)=>`
          <tr>
            <td style="background:#e3f2fd;color:#1a1a2e;font-weight:700;text-align:center;padding:6px 8px;border:1px solid #bbb;">${ri+1}</td>
            <td style="padding:6px 10px;border:1px solid #bbb;white-space:nowrap;min-width:120px;">
              <span style="font-weight:700;font-size:13px;">${(()=>{const p=grp[ri];const b1=memberBuMap[p[0]]||'';const b2=memberBuMap[p[1]]||'';return b1&&b2?escapeHtml(p[0])+escapeHtml(String(b1))+'/'+escapeHtml(p[1])+escapeHtml(String(b2)):escapeHtml(tn);})()}</span>
            </td>
            ${teamNames.map((_,ci)=>ri===ci?
              `<td style="background:#ccc;border:1px solid #bbb;min-width:80px;"></td>`:
              `<td style="border:1px solid #bbb;padding:2px;text-align:center;min-width:80px;">
                <input type="number" id="dg${gi}r${ri}c${ci}" value="${sc[ri][ci]!==null?sc[ri][ci]:''}"
                  min="0" max="${max}"
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
      <div style="margin-top:8px;">${ord.map(m=>`<span class="game-tag" style="font-size:11px;padding:2px 7px;">${m[0]}:${m[1]}</span>`).join('')}</div>
    </div>`;
  });
  document.getElementById('league-matches').innerHTML=matchHtml;

  // 실시간 순위 계산
  groups.forEach((_,gi)=>realtimeCalcDoubles(gi));

  // 조별 순위 표시
  const bgs=['rank-1','rank-2','rank-3','rank-n','rank-n'];
      document.getElementById('league-results').innerHTML=results.map(r=>`
    <div style="margin-bottom:14px;">
      <div style="font-size:13px;font-weight:700;margin-bottom:8px;">${r.g}조 순위</div>
      <table><thead><tr><th>순위</th><th>팀</th><th>승</th><th>패</th><th>승점</th><th>게임득실</th></tr></thead><tbody>
      ${r.players.map((p,i)=>`<tr><td><span class="rank-badge ${bgs[i]||'rank-n'}">${i+1}</span></td>
        <td>${p.name}</td><td>${p.w}</td><td>${p.l}</td><td><strong>${p.mp}점</strong></td><td>${p.scored}/${p.lost}</td></tr>`).join('')}
      </tbody></table>
    </div>`).join('');

  document.getElementById('s3-status').textContent='계산 완료';
}

function loadTestData(numGroups){
  if(!confirm(numGroups+'조 테스트 데이터를 불러올까요?\n현재 이번주 데이터는 초기화됩니다.')) return;

  const pool = MEMBERS.map(m=>m.name);
  const perGroup = numGroups===2 ? 5 : numGroups===3 ? 5 : 5;
  const total = numGroups * perGroup;
  const players = pool.slice(0, total);

  // 조 편성
  const groups = Array.from({length:numGroups}, ()=>[]);
  players.forEach(function(p, i){ groups[i % numGroups].push(p); });

  const max = 2; // 3판2승

  // 경기별 점수 행렬 생성 (gi → ri → ci → 점수)
  const scoreMatrix = groups.map(function(grp){
    const n = grp.length;
    const sc = Array.from({length:n}, ()=>new Array(n).fill(null));
    for(let ri=0;ri<n;ri++){
      for(let ci=ri+1;ci<n;ci++){
        // 랜덤 결과 (동률 상황도 나오도록)
        const winner = Math.random() > 0.5 ? ri : ci;
        const loser  = winner===ri ? ci : ri;
        const loserScore = Math.floor(Math.random()*max); // 0 또는 1
        sc[winner][loser] = max;
        sc[loser][winner] = loserScore;
      }
    }
    return sc;
  });

  // ITTF 방식으로 결과 계산
  const results = groups.map(function(grp, gi){
    const n = grp.length;
    const sc = scoreMatrix[gi];

    // matchResults 구성
    const matchResults = Array.from({length:n},()=>Array(n).fill(null));
    for(let ri=0;ri<n;ri++){
      for(let ci=ri+1;ci<n;ci++){
        if(sc[ri][ci]===null) continue;
        matchResults[ri][ci]={gw:sc[ri][ci],gl:sc[ci][ri],pw:0,pl:0,played:true};
        matchResults[ci][ri]={gw:sc[ci][ri],gl:sc[ri][ci],pw:0,pl:0,played:true};
      }
    }

    const stats = getPlayerStats(grp, matchResults);
    const ranked = ittfRank(grp, matchResults);
    return {
      g: gi+1,
      players: ranked.map(pi=>({
        name: grp[pi],
        w: stats[pi].w,
        l: stats[pi].l,
        scored: stats[pi].gw,
        lost: stats[pi].gl,
        mp: stats[pi].mp
      }))
    };
  });

  ST.week = {
    date:'2026-04-03', type:'단식', set:'3판2승',
    players, groups: groups.concat([[],[]]).slice(0,4), results
  };
  ST.tournament={};
  ST.final={win:'',second:'',third:'',third2:'',lucky:''};
  saveST();

  // 리그 탭으로 이동 후 순위 바로 표시
  document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
  document.querySelectorAll('.section').forEach(s=>s.classList.remove('active'));
  document.getElementById('league').classList.add('active');
  document.querySelector('.tab[onclick*="league"]').classList.add('active');

  renderLeague();

  // Step 3,4 열기 + 경기표 렌더링
  document.getElementById('s3').style.display='block';
  document.getElementById('s4').style.display='block';

  // 경기표에 점수 채우기
  const memberBuMap2={};
  MEMBERS.forEach(m=>{ memberBuMap2[m.name]=m.total; });
  getExternals().forEach(m=>{ memberBuMap2[m.name]=m.total; });
  (ST.week.tempPlayers||[]).forEach(m=>{ memberBuMap2[m.name]=m.total; });
  let matchHtml='';
  groups.forEach(function(grp, gi){
    const n=grp.length;
    const sc=scoreMatrix[gi];
    const ord=getOrder(n);
    matchHtml+=`<div style="margin-bottom:28px;">
      <div style="overflow-x:auto;">
      <table style="border-collapse:collapse;font-size:13px;">
        <thead><tr>
          <th colspan="2" style="background:#e8f5e9;color:#1a1a2e;padding:8px 14px;border:2px solid #aaa;font-size:15px;font-weight:900;text-align:left;min-width:120px;">${gi+1}조</th>
          ${grp.map(name=>`<th style="background:#e3f2fd;color:#1a1a2e;padding:8px 6px;border:1px solid #bbb;text-align:center;min-width:54px;font-weight:700;font-size:13px;">${escapeHtml(name)}</th>`).join('')}
          <th style="background:#fff9c4;padding:8px 6px;border:1px solid #bbb;text-align:center;min-width:36px;font-weight:700;">승</th>
          <th style="background:#fff9c4;padding:8px 6px;border:1px solid #bbb;text-align:center;min-width:36px;font-weight:700;">패</th>
          <th style="background:#fff9c4;padding:8px 6px;border:1px solid #bbb;text-align:center;min-width:46px;font-weight:700;">승점</th>
          <th style="background:#fff9c4;padding:8px 6px;border:1px solid #bbb;text-align:center;min-width:44px;font-weight:700;">순위</th>
        </tr></thead>
        <tbody>
        ${grp.map((p,ri)=>`
          <tr>
            <td style="background:#e3f2fd;color:#1a1a2e;font-weight:700;text-align:center;padding:6px 8px;border:1px solid #bbb;min-width:28px;">${ri+1}</td>
            <td style="padding:6px 10px;border:1px solid #bbb;white-space:nowrap;min-width:100px;">
              <span style="font-weight:700;font-size:13px;">${escapeHtml(p)}${escapeHtml(String(memberBuMap2[p]?memberBuMap2[p]:''))}</span>
            </td>
            ${grp.map((_,ci)=>ri===ci?
              `<td style="background:#ccc;border:1px solid #bbb;min-width:54px;"></td>`:
              `<td style="border:1px solid #bbb;padding:2px;text-align:center;min-width:54px;">
                <input type="number" id="g${gi}r${ri}c${ci}" value="${sc[ri][ci]!==null?sc[ri][ci]:''}"
                  min="0" max="${max}"
                  oninput="validateScore(${gi},${ri},${ci}); realtimeCalc(${gi}); styleScoreCell(${gi},${ri},${ci})"
                  style="width:44px;text-align:center;border:none;background:transparent;font-size:15px;font-weight:700;padding:2px;color:#1a1a2e;">
              </td>`
            ).join('')}
            <td style="text-align:center;padding:6px;border:1px solid #bbb;font-weight:700;" id="g${gi}w${ri}">-</td>
            <td style="text-align:center;padding:6px;border:1px solid #bbb;font-weight:700;" id="g${gi}l${ri}">-</td>
            <td style="text-align:center;padding:6px;border:1px solid #bbb;font-weight:900;font-size:14px;" id="g${gi}wp${ri}">-</td>
            <td style="text-align:center;padding:6px;border:1px solid #bbb;font-weight:900;font-size:15px;" id="g${gi}rk${ri}">-</td>
          </tr>`).join('')}
        </tbody>
      </table></div>
      <div style="margin-top:8px;">${ord.map(m=>`<span class="game-tag" style="font-size:11px;padding:2px 7px;">${m[0]}:${m[1]}</span>`).join('')}</div>
    </div>`;
  });
  document.getElementById('league-matches').innerHTML=matchHtml;

  // 실시간 순위 계산
  groups.forEach((_,gi)=>realtimeCalc(gi));

  // 조별 순위 표시
  const bgs=['rank-1','rank-2','rank-3','rank-n','rank-n'];
  document.getElementById('league-results').innerHTML=results.map(r=>{
    const rows = r.players.map((p,i)=>{
      return `<tr><td><span class="rank-badge ${bgs[i]||'rank-n'}">${i+1}</span></td>`+
             `<td>${escapeHtml(p.name)}</td><td>${p.w}</td><td>${p.l}</td><td><strong>${p.mp}점</strong></td><td>${p.scored}/${p.lost}</td></tr>`;
    }).join('');
    return `
    <div style="margin-bottom:14px;">
      <div style="font-size:13px;font-weight:700;margin-bottom:8px;">${r.g}조 순위</div>
      <table><thead><tr><th>순위</th><th>이름</th><th>승</th><th>패</th><th>승점</th><th>게임득실</th></tr></thead><tbody>
      ${rows}
      </tbody></table>
    </div>`;
  }).join('');

  document.getElementById('s3-status').textContent='계산 완료';
}
