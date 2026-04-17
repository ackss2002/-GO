// 승급 포인트 (마지막 승급 이후 획득, 10점 달성 시 리셋)
function getPromotionPts(name){
  const q1 = (typeof Q1_SCORES!=='undefined' && Q1_SCORES[name]) || {up:false};
  const sc = (ST.scores||{})[name] || {pts:0};
  if(q1.up || sc.up){
    return sc.pts||0;
  } else {
    const co = (ST.carryOver||{})[name]||{pts:0};
    return (co.pts||0)+(sc.pts||0);
  }
}

// 1분기 포인트
function getQ1Pts(name){
  const q1 = (typeof Q1_SCORES!=='undefined' && Q1_SCORES[name]) || {w:0,s:0,t:0,pts:0};
  const w=q1.w||0, s=q1.s||0, t=q1.t||0;
  return {w,s,t,pts:w*5+s*3+t*2, up:q1.up||false};
}

// 2분기 포인트 (ST.scores 기준)
function getQ2Pts(name){
  const sc = (ST.scores||{})[name] || {w:0,s:0,t:0};
  const w=sc.w||0, s=sc.s||0, t=sc.t||0;
  return {w,s,t,pts:w*5+s*3+t*2, up:sc.up||false};
}

// 역대 누적 포인트 (1분기+2분기 합산, 절대 리셋 없음)
function getTotalPts(name){
  const q1 = (typeof Q1_SCORES!=='undefined' && Q1_SCORES[name]) || {w:0,s:0,t:0};
  const sc = (ST.scores||{})[name] || {w:0,s:0,t:0};
  const w=(q1.w||0)+(sc.w||0);
  const s=(q1.s||0)+(sc.s||0);
  const t=(q1.t||0)+(sc.t||0);
  const q1up = q1.up||false;
  const scup = sc.up||false;
  return {w,s,t,pts:w*5+s*3+t*2, up:q1up||scup};
}

function renderRanking(){
  let exMems=[], dormMems=[];
  try{ exMems=JSON.parse(localStorage.getItem('ttgo_ex_members')||'[]'); }catch(e){}
  try{ dormMems=JSON.parse(localStorage.getItem('ttgo_dormant')||'[]'); }catch(e){}
  const allMembers=[
    ...MEMBERS.map(m=>({...m,isEx:false,isDormant:false})),
    ...dormMems.map(m=>({...m,isEx:false,isDormant:true})),
    ...exMems.map(m=>({...m,isEx:true,isDormant:false}))
  ];

  const tab = (typeof currentRankingTab!=='undefined' ? currentRankingTab : null) || 'total';

  let title, getData;
  if(tab==='q1'){
    title='1분기 랭킹 포인트';
    getData=function(m){ return getQ1Pts(m.name); };
  } else if(tab==='q2'){
    title='2분기 랭킹 포인트';
    getData=function(m){ return getQ2Pts(m.name); };
  } else {
    title='시즌 랭킹 포인트 (전분기 누적)';
    getData=function(m){ return getTotalPts(m.name); };
  }

  var rankingTitle=document.getElementById('ranking-title');
  if(rankingTitle) rankingTitle.textContent=title;

  const all=allMembers.map(m=>{
    const d=getData(m);
    const promoPts=getPromotionPts(m.name);
    const buDisplay=m.bu!==m.total?m.bu+'('+m.total+')':String(m.bu);
    return{name:m.name,gender:m.g,bu:buDisplay,isExt:m.isExt,isEx:m.isEx,isDormant:m.isDormant,...d,promoPts};
  }).sort((a,b)=>b.pts-a.pts||b.w-a.w||b.s-a.s);

  const bgs=['rank-1','rank-2','rank-3'];
  let rank=1;
  var rankingTbody=document.getElementById('ranking-tbody');
  if(rankingTbody){
    rankingTbody.innerHTML=all.map((p,i)=>{
      if(i>0&&p.pts<all[i-1].pts) rank=i+1;
      if(p.pts===0&&!p.up) return '';
      const bg=rank<=3?bgs[rank-1]:'rank-n';
      const upTag=p.up?'<span class="pill pill-amber" style="margin-left:4px;">↑승급</span>':'';
      const exTag=p.isEx?'<span class="pill" style="margin-left:4px;background:#ffebee;color:#c62828;font-size:10px;">탈퇴</span>':'';
      const dormTag=p.isDormant?'<span class="pill" style="margin-left:4px;background:#eceff1;color:#607d8b;font-size:10px;">휴면</span>':'';
      const promoLabel=`<span style="font-size:11px;color:#888;margin-left:4px;">(승급 ${p.promoPts}pt)</span>`;

      return `<tr><td><span class="rank-badge ${bg}">${rank}</span></td>
        <td><strong>${escapeHtml(p.name)}</strong>${exTag}${dormTag}</td>
        <td>${escapeHtml(p.gender)}</td><td>${escapeHtml(String(p.bu))}</td>
        <td>${p.w||0}</td><td>${p.s||0}</td><td>${p.t||0}</td>
        <td><strong>${p.pts}점</strong>${promoLabel}${upTag}</td>
        <td></td></tr>`;
    }).join('')||'<tr><td colspan="9" style="color:#888;text-align:center;">데이터 없음</td></tr>';
  }

  // 승급 현황 카드
  var upgradeCard=document.getElementById('upgrade-card');
  if(upgradeCard){
    const ups=all.filter(p=>p.up);
    upgradeCard.innerHTML=ups.length
      ?`<strong>승급 현황</strong> `+ups.map(p=>`<span class="pill pill-amber">${escapeHtml(p.name)} 승급완료</span>`).join(' ')
      :'';
  }

  // 게스트 순위
  var guestRankingTbody=document.getElementById('guest-ranking-tbody');
  const guestScores=ST.guestScores||{};
  const guests=Object.keys(guestScores).map(name=>{
    const s=guestScores[name];
    return{name,bu:s.bu||'?',w:s.w||0,s:s.s||0,t:s.t||0,pts:s.pts||0};
  }).filter(g=>g.pts>0).sort((a,b)=>b.pts-a.pts||b.w-a.w);
  let grank=1;
  if(guestRankingTbody){
    guestRankingTbody.innerHTML=guests.length?
      guests.map((g,i)=>{
        if(i>0&&g.pts<guests[i-1].pts) grank=i+1;
        const bg=grank<=3?bgs[grank-1]:'rank-n';
        return `<tr><td><span class="rank-badge ${bg}">${grank}</span></td>
          <td><strong>${escapeHtml(g.name)}</strong></td><td>${escapeHtml(String(g.bu))}부</td>
          <td>${g.w}</td><td>${g.s}</td><td>${g.t}</td><td><strong>${g.pts}점</strong></td></tr>`;
      }).join('')
      :'<tr><td colspan="7" style="color:#888;text-align:center;">게스트 랭킹 포인트 없음</td></tr>';
  }
}

// 회원 관리
function renderMembers(){
  var activeEl=document.getElementById('active-tbody');
  var dormantEl=document.getElementById('dormant-tbody');
  if(!activeEl||!dormantEl) return;
  const sorted=(MEMBERS||[]).slice().sort((a,b)=>{
    return (a.name||'').localeCompare(b.name||'','ko');
  });
  activeEl.innerHTML=sorted.map((m,i)=>{
    return `<tr><td>${i+1}</td><td>${escapeHtml(m.name)}</td><td>${escapeHtml(m.g)}</td><td>${escapeHtml(m.bu)}</td><td>${escapeHtml(m.bu!==m.total?m.bu+'('+m.total+')':m.total)}</td></tr>`;
  }).join('');
  dormantEl.innerHTML=DORMANT.map((m,i)=>{
    return `<tr><td>${i+1}</td><td>${escapeHtml(m.name)}</td><td>${escapeHtml(m.g)}</td><td>${escapeHtml(m.bu)}</td><td>${escapeHtml(m.bu!==m.total?m.bu+'('+m.total+')':m.total)}</td></tr>`;
  }).join('');
}

// renderMembersAdminUI is defined in league-core.js
