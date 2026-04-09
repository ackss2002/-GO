function calcResultsDoubles(){
  if(blockIfTournamentInProgress()) return;
  if(!ST.doubles) return;
  const pairs = ST.doubles.pairs||[];
  const gsPairs = ST.doubles.groups.map(g=>g.map(pi=>pairs[pi])).filter(g=>g.length>0);
  let all=[];
  gsPairs.forEach((grp,gi)=>{
    const teamNames = grp.map(p=>p[0]+'/'+p[1]);
    const matchResults = buildMatchResults(teamNames, `dg${gi}`, false);
    const stats = getPlayerStats(teamNames, matchResults);
    const ranked = ittfRank(teamNames, matchResults);

    ranked.forEach((pi, rank)=>{
      const p = stats[pi];
      const wb=document.getElementById(`dg${gi}wp${pi}`);
      const db=document.getElementById(`dg${gi}ds${pi}`);
      const rb=document.getElementById(`dg${gi}rk${pi}`);
      if(wb) wb.textContent=`${p.w}승${p.l}패 (${p.mp}점)`;
      if(db) db.textContent=`${p.gw}/${p.gl}`;
      if(rb){ rb.textContent=rank+1; rb.style.color=rank===0?'#e94560':rank===1?'#1565C0':'#CD7F32'; }
    });

    const sortedPlayers = ranked.map(pi=>({
      name: teamNames[pi],
      pair: grp[pi],
      w: stats[pi].w, l: stats[pi].l,
      scored: stats[pi].gw, lost: stats[pi].gl,
      mp: stats[pi].mp
    }));
    all.push({g:gi+1, players:sortedPlayers});
  });

  ST.doubles.results=all;
  ST.week.results=all;
  saveST();

  const bgs=['rank-1','rank-2','rank-3','rank-n','rank-n','rank-n','rank-n'];
  document.getElementById('league-results').innerHTML=all.map(r=>`
    <div style="margin-bottom:14px;">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
        <div style="font-size:13px;font-weight:700;">${r.g}조 순위</div>
        <button onclick="reEditGroup(${r.g})" style="padding:4px 10px;background:#fff8e1;color:#e65100;border:1px solid #ffcc80;border-radius:6px;font-size:11px;font-weight:700;cursor:pointer;">✏️ 수정</button>
      </div>
      <table><thead><tr><th>순위</th><th>팀</th><th>승</th><th>패</th><th>승점</th><th>게임득실</th></tr></thead><tbody>
      ${r.players.map((p,i)=>`<tr><td><span class="rank-badge ${bgs[i]||'rank-n'}">${i+1}</span></td>
        <td>${p.name}</td><td>${p.w}</td><td>${p.l}</td><td><strong>${p.mp}점</strong></td><td>${p.scored}/${p.lost}</td></tr>`).join('')}
      </tbody></table>
    </div>`).join('');
  document.getElementById('s4').style.display='block';
  document.getElementById('s3-status').textContent='계산 완료';
}
function calcResults(){
  if(blockIfTournamentInProgress()) return;
  const isDoubles = ST.week.type==='복식';
  if(isDoubles){ calcResultsDoubles(); return; }
  const gs=ST.week.groups.filter(g=>g.length>0);
  let all=[];

  // ── 순위 계산 ──
  window._jankenNeeded = [];
  gs.forEach((grp,gi)=>{
    const n=grp.length;
    const matchResults = buildMatchResults(grp, `g${gi}`, false);
    const stats = getPlayerStats(grp, matchResults);
    const ranked = ittfRank(grp, matchResults);
    // 순위 결정 근거 계산
    const rankReason = {}; // pi → 근거 텍스트
    const mpMap2={};
    grp.forEach((_,i)=>{ const m=stats[i].mp; if(!mpMap2[m]) mpMap2[m]=[]; mpMap2[m].push(i); });
    Object.values(mpMap2).forEach(tied=>{
      if(tied.length<2) return;
      if(tied.length===2){
        const [ia,ib]=tied;
        const r=matchResults[ia][ib];
        if(r&&r.played){
          rankReason[r.gw>r.gl?ia:ib]='승자승';
          rankReason[r.gw>r.gl?ib:ia]='승자승';
          return;
        }
      }
      // 동률자간 승점
      const subMP={},subGW={},subGL={};
      tied.forEach(i=>{subMP[i]=0;subGW[i]=0;subGL[i]=0;});
      tied.forEach(i=>{ tied.forEach(j=>{
        if(i===j) return;
        const r=matchResults[i][j];
        if(!r||!r.played) return;
        subMP[i]+=calcMatchPoints(r.gw,r.gl,r.played);
        subGW[i]+=r.gw; subGL[i]+=r.gl;
      });});
      const subMpVals=new Set(tied.map(i=>subMP[i]));
      if(subMpVals.size>1){ tied.forEach(i=>{ rankReason[i]=rankReason[i]||('동률간 '+subMP[i]+'점'); }); return; }
      // 게임득실률
      const grVals=tied.map(i=>subGL[i]?subGW[i]/subGL[i]:subGW[i]);
      const grSet=new Set(grVals.map(v=>v.toFixed(4)));
      if(grSet.size>1){ tied.forEach((i,idx)=>{ rankReason[i]=rankReason[i]||('득실 '+subGW[i]+'/'+subGL[i]); }); return; }
      // 부수
      const buVals=new Set(tied.map(i=>{ const m=MEMBERS.find(m=>m.name===grp[i]); return m?m.bu:0; }));
      if(buVals.size>1){ tied.forEach(i=>{ const m=MEMBERS.find(m=>m.name===grp[i]); rankReason[i]=rankReason[i]||('부수 '+(m?m.bu:'?')+'부'); }); return; }
      tied.forEach(i=>{ rankReason[i]=rankReason[i]||'✂️'; });
    });

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
        const color = rank===0?'#e94560':rank===1?'#1565C0':rank===2?'#CD7F32':'#aaa';
        const reason = rankReason[pi] ? `<div style="font-size:9px;color:#bbb;font-weight:400;margin-top:1px;">${rankReason[pi]}</div>` : '';
        rkEl.innerHTML = `<div style="font-weight:900;color:${color};">${rank+1}</div>${reason}`;
      }
    });
    const sortedPlayers = ranked.map(pi=>({
      name: grp[pi], w: stats[pi].w, l: stats[pi].l,
      scored: stats[pi].gw, lost: stats[pi].gl, mp: stats[pi].mp
    }));
    all.push({g:gi+1, players:sortedPlayers});
  });

  ST.week.results=all; saveST();

  // ── 가위바위보 감지: 직접 계산 ──
  const jkByGroup = {};
  gs.forEach((grp, gi)=>{
    const matchResults = buildMatchResults(grp, `g${gi}`, false);
    const n = grp.length;
    // 전체 승점
    const mp = grp.map((_,i)=>{
      let s=0;
      for(let j=0;j<n;j++){
        if(i===j) continue;
        const r=matchResults[i][j];
        if(r&&r.played) s+=calcMatchPoints(r.gw,r.gl,r.played);
      }
      return s;
    });
    // 승점별 동률 그룹
    const mpMap={};
    grp.forEach((name,i)=>{ if(!mpMap[mp[i]]) mpMap[mp[i]]=[]; mpMap[mp[i]].push(i); });

    Object.values(mpMap).forEach(tied=>{
      if(tied.length<2) return;
      // 동률자간 승점 계산
      const subMP={}, subGW={}, subGL={};
      tied.forEach(i=>{ subMP[i]=0; subGW[i]=0; subGL[i]=0; });
      tied.forEach(i=>{ tied.forEach(j=>{
        if(i===j) return;
        const r=matchResults[i][j];
        if(!r||!r.played) return;
        subMP[i]+=calcMatchPoints(r.gw,r.gl,r.played);
        subGW[i]+=r.gw; subGL[i]+=r.gl;
      });});
      // 동률자간 승점 같은 그룹 추출
      const subMpMap={};
      tied.forEach(i=>{ if(!subMpMap[subMP[i]]) subMpMap[subMP[i]]=[]; subMpMap[subMP[i]].push(i); });
      Object.values(subMpMap).forEach(g2=>{
        if(g2.length<2) return;
        // g2 멤버끼리만 게임득실률 재계산
        const g2GW={}, g2GL={};
        g2.forEach(i=>{ g2GW[i]=0; g2GL[i]=0; });
        g2.forEach(i=>{ g2.forEach(j=>{
          if(i===j) return;
          const r=matchResults[i][j];
          if(!r||!r.played) return;
          g2GW[i]+=r.gw; g2GL[i]+=r.gl;
        });});
        const gr2 = g2.map(i=>g2GL[i]?g2GW[i]/g2GL[i]:g2GW[i]);
        // 득실률 같은 쌍 → 부수 비교 → 가위바위보
        for(let a=0;a<g2.length;a++){
          for(let b=a+1;b<g2.length;b++){
            if(Math.abs(gr2[a]-gr2[b])>0.0001) continue;
            const mA=MEMBERS.find(m=>m.name===grp[g2[a]])||{bu:0};
            const mB=MEMBERS.find(m=>m.name===grp[g2[b]])||{bu:0};
            if(mA.bu===mB.bu){
              const g=gi+1;
              if(!jkByGroup[g]) jkByGroup[g]=[];
              [grp[g2[a]],grp[g2[b]]].forEach(name=>{
                if(!jkByGroup[g].includes(name)) jkByGroup[g].push(name);
              });
            }
          }
        }
      });
    });
  });
  const hasJk = Object.keys(jkByGroup).length > 0;
  // jkGroups: 어느 조가 가위바위보 필요한지 저장
  ST.week.jkGroups = hasJk ? jkByGroup : {};
  ST.week.jkConfirmed = {};
  // 새로 계산 시 모든 조 미확정으로 리셋
  Object.keys(ST.week.jkGroups).forEach(function(g){ ST.week.jkConfirmed[g] = false; });
  ST.week.hasJanken = hasJk;
  saveST();

  // ── 경기표 가위바위보 처리: 순위 셀을 input으로 교체 ──
  gs.forEach((grp, gi)=>{
    const g = gi+1;
    const jkNames = jkByGroup[g];
    if(!jkNames || jkNames.length < 2) return;

    const grpResult = all.find(r=>r.g===g);
    const startRank = grpResult.players.findIndex(p=>jkNames.includes(p.name)) + 1;
    const endRank   = startRank + jkNames.length - 1;

    // 해당 선수들의 현재 조 내 인덱스 찾기
    jkNames.forEach(name=>{
      const ri = grp.indexOf(name);
      if(ri < 0) return;
      const rkEl = document.getElementById(`g${gi}rk${ri}`);
      if(!rkEl) return;
      const currentRank = rkEl.textContent;
      rkEl.innerHTML = `<input type="number" id="g${gi}jk${ri}"
        value="${currentRank}" min="${startRank}" max="${endRank}"
        onfocus="this.select()"
        style="width:36px;height:26px;text-align:center;font-size:13px;font-weight:900;
        color:#e65100;border:2px solid #ffcc80;border-radius:5px;background:#fff8e1;padding:0;outline:none;">`;
    });

    // 경기표 아래 간단한 확정 배너
    const matchDivs = document.getElementById('league-matches').querySelectorAll('div[style*="margin-bottom:28px"]');
    const matchDiv = matchDivs[gi];
    if(!matchDiv) return;
    const old = matchDiv.querySelector('.jk-banner');
    if(old) old.remove();
    const banner = document.createElement('div');
    banner.className = 'jk-banner';
    banner.style.cssText = 'background:#fff3e0;border:1px solid #ffcc80;border-radius:8px;padding:10px 14px;margin-top:6px;display:flex;align-items:center;justify-content:space-between;gap:10px;';
    const btn = document.createElement('button');
    btn.textContent = '✅ '+g+'조 확정';
    btn.style.cssText = 'padding:7px 16px;background:#e65100;color:white;border:none;border-radius:7px;font-size:12px;font-weight:700;cursor:pointer;white-space:nowrap;';
    btn.dataset.gi = gi;
    btn.dataset.g  = g;
    btn.dataset.names = JSON.stringify(jkNames);
    btn.dataset.startIdx = startRank-1;
    btn.addEventListener('click', function(){
      jkConfirmInline(
        parseInt(this.dataset.gi),
        parseInt(this.dataset.g),
        JSON.parse(this.dataset.names),
        parseInt(this.dataset.startIdx)
      );
    });
    banner.innerHTML = `<span style="font-size:12px;color:#e65100;font-weight:700;">✂️ ${g}조 ${startRank}~${endRank}위 가위바위보 — 순위칸에 직접 입력 후 확정</span>`;
    banner.appendChild(btn);
    matchDiv.appendChild(banner);
  });

  // ── Step4 조별 순위 표시 ──
  const bgs=['rank-1','rank-2','rank-3','rank-n','rank-n','rank-n','rank-n'];
  document.getElementById('league-results').innerHTML=all.map(r=>`
    <div style="margin-bottom:14px;">
      <div style="font-size:13px;font-weight:700;margin-bottom:8px;">${r.g}조 순위</div>
      <table><thead><tr><th>순위</th><th>이름</th><th>승</th><th>패</th><th>승점</th><th>게임득실</th></tr></thead><tbody>
      ${r.players.map((p,i)=>`<tr>
        <td><span class="rank-badge ${bgs[i]||'rank-n'}">${i+1}</span></td>
        <td>${p.name}</td><td>${p.w}</td><td>${p.l}</td><td><strong>${p.mp}점</strong></td><td>${p.scored}/${p.lost}</td>
      </tr>`).join('')}
      </tbody></table>
    </div>`).join('');

  document.getElementById('janken-area').style.display='none';
  document.getElementById('s4').style.display='block';
  document.getElementById('s3-status').textContent='계산 완료'+(hasJk?' · ✂️ 가위바위보 필요':'');
  // 가위바위보 없으면 토너먼트 버튼 표시, 있으면 숨김
  const wrap = document.getElementById('to-tournament-wrap');
  if(wrap) wrap.style.display = hasJk ? 'none' : 'block';
}

function jkConfirmInline(gi, g, names, startIdx){
  // 순위 input에서 값 읽기
  const inputs = names.map(name=>{
    const ri = ST.week.groups.filter(gr=>gr.length>0)[gi].indexOf(name);
    const el = document.getElementById(`g${gi}jk${ri}`);
    return {name, rank: el ? parseInt(el.value) : 0};
  });

  // 중복/범위 체크
  const ranks = inputs.map(x=>x.rank);
  const expected = names.map((_,i)=>startIdx+1+i);
  const valid = ranks.every(r=>expected.includes(r)) && new Set(ranks).size===ranks.length;
  if(!valid){
    alert(`${startIdx+1}~${startIdx+names.length}위 사이의 값을 중복 없이 입력하세요.`);
    return;
  }

  // 순위 순으로 정렬
  inputs.sort((a,b)=>a.rank-b.rank);

  // ST.week.results 반영
  const grpResult = ST.week.results.find(r=>r.g===g);
  if(!grpResult) return;
  const jkPlayers = names.map(name=>grpResult.players.find(p=>p.name===name));
  inputs.forEach((x,i)=>{
    grpResult.players[startIdx+i] = jkPlayers.find(p=>p.name===x.name);
  });
  saveST();

  // 순위 셀 복원 (input→숫자)
  names.forEach(name=>{
    const ri = ST.week.groups.filter(gr=>gr.length>0)[gi].indexOf(name);
    const rkEl = document.getElementById(`g${gi}rk${ri}`);
    const finalRank = grpResult.players.findIndex(p=>p.name===name)+1;
    if(rkEl){
      rkEl.innerHTML = finalRank;
      rkEl.style.color = finalRank===1?'#e94560':finalRank===2?'#1565C0':finalRank===3?'#CD7F32':'#aaa';
    }
  });

  // 배너 확정 완료로 교체 (수정 버튼 포함)
  document.querySelectorAll('.jk-banner').forEach(b=>{
    const btn = b.querySelector('button');
    if(btn && parseInt(btn.dataset.gi)===gi){
      const namesStr = JSON.stringify(names).replace(/"/g,'&quot;');
      b.innerHTML =
        `<span style="color:#2e7d32;font-weight:700;font-size:13px;">✅ ${g}조 ${startIdx+1}~${startIdx+names.length}위 확정 완료!</span>`+
        `<button id="unc-btn-${gi}" data-gi="${gi}" data-g="${g}" data-names='${JSON.stringify(names).replace(/'/g,"&#39;")}' data-start="${startIdx}"
          onclick="var d=this.dataset;unconfirmGroup(parseInt(d.gi),parseInt(d.g),JSON.parse(d.names),parseInt(d.start))"
          style="padding:5px 12px;background:#fff8e1;color:#e65100;border:1px solid #ffcc80;border-radius:7px;font-size:12px;font-weight:700;cursor:pointer;">✏️ 수정</button>`;
    }
  });

  // Step4 순위 갱신
  const bgs=['rank-1','rank-2','rank-3','rank-n','rank-n','rank-n','rank-n'];
  document.getElementById('league-results').innerHTML=ST.week.results.map(r=>`
    <div style="margin-bottom:14px;">
      <div style="font-size:13px;font-weight:700;margin-bottom:8px;">${r.g}조 순위</div>
      <table><thead><tr><th>순위</th><th>이름</th><th>승</th><th>패</th><th>승점</th><th>게임득실</th></tr></thead><tbody>
      ${r.players.map((p,i)=>`<tr>
        <td><span class="rank-badge ${bgs[i]||'rank-n'}">${i+1}</span></td>
        <td>${p.name}</td><td>${p.w}</td><td>${p.l}</td><td><strong>${p.mp}점</strong></td><td>${p.scored}/${p.lost}</td>
      </tr>`).join('')}
      </tbody></table>
    </div>`).join('');
  document.getElementById('s3-status').textContent='계산 완료';
  // 해당 조 확정 완료 표시
  if(!ST.week.jkConfirmed) ST.week.jkConfirmed = {};
  ST.week.jkConfirmed[String(g)] = true;
  // 모든 가위바위보 조가 확정됐으면 hasJanken=false
  const allConfirmed = Object.keys(ST.week.jkGroups||{}).every(function(gk){
    return ST.week.jkConfirmed[gk] === true;
  });
  ST.week.hasJanken = !allConfirmed;
  saveST();

  // 가위바위보 확정 완료 → 토너먼트 버튼 표시
  const wrapJk = document.getElementById('to-tournament-wrap');
  if(wrapJk) wrapJk.style.display = 'block';

  // 토너먼트 대진 자동 갱신 (이미 생성된 경우)
  if(ST.tournament && ST.tournament.bracket && ST.tournament.bracket.length > 0){
    const grpNames = ST.week.results.map(r=>r.players.map(p=>p.name));
    const size = ST.tournament.size;
    const newBracket = buildBracket(grpNames, ST.week.results, size);
    while(newBracket.length < size) newBracket.push('BYE');
    newBracket.splice(size);
    ST.tournament.seeds   = newBracket.filter(p=>p!=='BYE');
    ST.tournament.bracket = newBracket;
    ST.tournament.rounds  = {};
    ST.tournament.scores  = {};
    for(let i=0;i<size/2;i++){
      if(newBracket[i*2]==='BYE')   ST.tournament.rounds['r1m'+i]=newBracket[i*2+1];
      if(newBracket[i*2+1]==='BYE') ST.tournament.rounds['r1m'+i]=newBracket[i*2];
    }
    saveST();
    renderBracket(newBracket, size);
  }
  renderDash();
}

// ── 가위바위보 미확정 여부 판단 (ST 데이터 기반) ──
function isJankenPending(){
  if(!ST.week || !ST.week.jkGroups) return false;
  const groups = ST.week.jkGroups;
  if(Object.keys(groups).length === 0) return false;
  const confirmed = ST.week.jkConfirmed || {};
  return Object.keys(groups).some(function(g){ return confirmed[g] !== true; });
}

// ── 토너먼트 진행 중 여부 판단 ──
function isTournamentInProgress(){
  if(!ST.tournament || !ST.tournament.rounds) return false;
  return Object.keys(ST.tournament.rounds).length > 0;
}

function blockIfTournamentInProgress(){
  if(isTournamentInProgress()){
    alert('토너먼트가 진행 중입니다.\n조별 리그 수정은 토너먼트 완료 후 가능합니다.');
    return true;
  }
  return false;
}
