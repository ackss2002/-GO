// 승급 포인트 (마지막 승급 이후 획득, 10점 달성 시 리셋)
function getPromotionPts(name){
  const q1 = (typeof Q1_SCORES!=='undefined' && Q1_SCORES[name]) || {up:false};
  const sc = (ST.scores||{})[name] || {pts:0};
  if(q1.up || sc.up){
    return sc.pts||0;
  } else {
    const co = (ST.carryOver||{})[name]||{pts:0};
    const ex = (typeof Q1_EXCHANGE_SCORES!=='undefined' && Q1_EXCHANGE_SCORES[name]) || {w:0,s:0,t:0};
    const exPts = (ex.w||0)*5+(ex.s||0)*3+(ex.t||0)*2;
    return (co.pts||0)+(sc.pts||0)+exPts;
  }
}

// 1분기 포인트 (리그 + 교류전 합산)
function getQ1Pts(name){
  const q1 = (typeof Q1_SCORES!=='undefined' && Q1_SCORES[name]) || {w:0,s:0,t:0};
  const ex = (typeof Q1_EXCHANGE_SCORES!=='undefined' && Q1_EXCHANGE_SCORES[name]) || {w:0,s:0,t:0};
  const w=(q1.w||0)+(ex.w||0), s=(q1.s||0)+(ex.s||0), t=(q1.t||0)+(ex.t||0);
  return {w,s,t,pts:w*5+s*3+t*2, up:q1.up||false};
}

// 2분기 포인트 (ST.scores 기준)
function getQ2Pts(name){
  const sc = (ST.scores||{})[name] || {w:0,s:0,t:0};
  const w=sc.w||0, s=sc.s||0, t=sc.t||0;
  return {w,s,t,pts:w*5+s*3+t*2, up:sc.up||false};
}

// 역대 누적 포인트 (Q1리그 + Q1교류전 + Q2 합산, 절대 리셋 없음)
function getTotalPts(name){
  const q1 = (typeof Q1_SCORES!=='undefined' && Q1_SCORES[name]) || {w:0,s:0,t:0};
  const ex = (typeof Q1_EXCHANGE_SCORES!=='undefined' && Q1_EXCHANGE_SCORES[name]) || {w:0,s:0,t:0};
  const sc = (ST.scores||{})[name] || {w:0,s:0,t:0};
  const w=(q1.w||0)+(ex.w||0)+(sc.w||0);
  const s=(q1.s||0)+(ex.s||0)+(sc.s||0);
  const t=(q1.t||0)+(ex.t||0)+(sc.t||0);
  return {w,s,t,pts:w*5+s*3+t*2, up:(q1.up||false)||(sc.up||false)};
}

// ── 선수 상세 팝업 ──
var _tooltip = null;

function showPlayerTooltip(name, el){
  hidePlayerTooltip();

  var tot = getTotalPts(name);
  var rows = [];

  // Q1 리그 입상 (날짜별 기록 우선, 없으면 집계 표시)
  var q1 = (typeof Q1_SCORES!=='undefined' && Q1_SCORES[name]) || null;
  if(q1){
    var placements = (typeof Q1_LEAGUE_PLACEMENTS!=='undefined' && Q1_LEAGUE_PLACEMENTS[name]) || null;
    if(placements && placements.length){
      placements.forEach(function(p){
        var dateTxt = p.date.slice(5).replace('-','/');
        if(p.r==='w') rows.push({date:dateTxt,type:'1분기 리그',icon:'🥇',result:'우승',pts:5});
        else if(p.r==='s') rows.push({date:dateTxt,type:'1분기 리그',icon:'🥈',result:'준우승',pts:3});
        else if(p.r==='t') rows.push({date:dateTxt,type:'1분기 리그',icon:'🥉',result:'3위',pts:2});
      });
    } else {
      for(var i=0;i<(q1.w||0);i++) rows.push({date:'1분기',type:'1분기 리그',icon:'🥇',result:'우승',pts:5});
      for(var i=0;i<(q1.s||0);i++) rows.push({date:'1분기',type:'1분기 리그',icon:'🥈',result:'준우승',pts:3});
      for(var i=0;i<(q1.t||0);i++) rows.push({date:'1분기',type:'1분기 리그',icon:'🥉',result:'3위',pts:2});
    }
  }

  // Q1 교류전 입상
  var exRes = (typeof Q1_EXCHANGE_RESULTS!=='undefined') ? Q1_EXCHANGE_RESULTS : [];
  var exTeams = (typeof Q1_EXCHANGE_TEAMS!=='undefined') ? Q1_EXCHANGE_TEAMS : [];
  (typeof Q1_EXCHANGE_DATES!=='undefined' ? Q1_EXCHANGE_DATES : []).forEach(function(d,i){
    var res=exRes[i]||{}, dateTxt=d.slice(5).replace('-','/');
    var teamName=(exTeams[i]||'교류')+'전';
    if(res.win===name)         rows.push({date:dateTxt,type:teamName,icon:'🥇',result:'우승',pts:5});
    else if(res.second===name) rows.push({date:dateTxt,type:teamName,icon:'🥈',result:'준우승',pts:3});
    else if(res.third===name)  rows.push({date:dateTxt,type:teamName,icon:'🥉',result:'3위',pts:2});
  });

  // Q2 경기 (복식 제외, 입상만)
  var hist = (typeof getHistory==='function') ? getHistory() : [];
  hist.forEach(function(r){
    if((r.type||'')==='복식') return;
    var f=r.final||{}, dateTxt=(r.date||'').slice(5).replace('-','/');
    if(f.win===name)                         rows.push({date:dateTxt,type:'2분기 리그',icon:'🥇',result:'우승',pts:5});
    else if(f.second===name)                 rows.push({date:dateTxt,type:'2분기 리그',icon:'🥈',result:'준우승',pts:3});
    else if(f.third===name||f.third2===name) rows.push({date:dateTxt,type:'2분기 리그',icon:'🥉',result:'3위',pts:2});
  });

  // 테이블 헤더
  var thead = '<div style="display:flex;padding:4px 0 6px;border-bottom:1px solid #e0e0e0;margin-bottom:2px;">'
    +'<span style="color:#bbb;font-size:10px;width:40px;">날짜</span>'
    +'<span style="color:#bbb;font-size:10px;width:72px;">종류</span>'
    +'<span style="color:#bbb;font-size:10px;flex:1;">성적</span>'
    +'<span style="color:#bbb;font-size:10px;width:32px;text-align:right;">점수</span>'
    +'</div>';

  var tbody = rows.length ? rows.map(function(r){
    return '<div style="display:flex;align-items:center;padding:6px 0;border-bottom:1px solid #f5f5f5;">'
      +'<span style="color:#aaa;font-size:11px;width:40px;">'+r.date+'</span>'
      +'<span style="color:#888;font-size:11px;width:72px;">'+r.type+'</span>'
      +'<span style="font-size:13px;font-weight:600;flex:1;">'+r.icon+' '+r.result+'</span>'
      +'<span style="color:#e94560;font-weight:700;font-size:12px;width:32px;text-align:right;">+'+r.pts+'</span>'
      +'</div>';
  }).join('')
  : '<div style="color:#bbb;text-align:center;padding:12px 0;font-size:12px;">입상 기록 없음</div>';

  if(!_tooltip){
    _tooltip = document.createElement('div');
    _tooltip.id = 'player-tt';
    _tooltip.style.cssText = 'position:fixed;z-index:9999;background:#fff;border-radius:14px;'
      +'box-shadow:0 4px 6px rgba(0,0,0,0.1),0 10px 40px rgba(0,0,0,0.2);'
      +'border:1px solid #eee;padding:14px 16px;min-width:250px;max-width:290px;font-size:13px;';
    document.body.appendChild(_tooltip);
    document.addEventListener('click', function(e){
      if(_tooltip && !_tooltip.contains(e.target)) hidePlayerTooltip();
    }, true);
  }

  _tooltip.innerHTML =
    '<div style="display:flex;justify-content:space-between;align-items:baseline;'
    +'padding-bottom:8px;margin-bottom:8px;border-bottom:2px solid #e94560;">'
    +'<span style="font-weight:700;font-size:15px;color:#1a1a2e;">'+escapeHtml(name)+'</span>'
    +'<span style="font-weight:700;font-size:14px;color:#e94560;">시즌 '+tot.pts+'pt</span>'
    +'</div>'+thead+tbody;

  // 위치: 항상 화면 안에
  var rect = el.getBoundingClientRect();
  var h = Math.min(rows.length*38+80, 300);
  var top = rect.bottom + 8;
  if(top + h > window.innerHeight) top = rect.top - h - 8;
  if(top < 8) top = 8;
  var left = rect.left;
  if(left + 295 > window.innerWidth) left = window.innerWidth - 300;
  if(left < 8) left = 8;
  _tooltip.style.top = top+'px';
  _tooltip.style.left = left+'px';
  _tooltip.style.display = 'block';
}

function hidePlayerTooltip(){
  if(_tooltip) _tooltip.style.display = 'none';
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
    title='Q1 랭킹 포인트';
    getData=function(m){ return getQ1Pts(m.name); };
  } else if(tab==='q2'){
    title='Q2 랭킹 포인트';
    getData=function(m){ return getQ2Pts(m.name); };
  } else {
    title='RANKINGS · 시즌 누적 포인트';
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
      const promoLabel=`<span style="font-size:11px;color:#aaa;margin-left:3px;">(${p.promoPts})</span>`;

      return `<tr><td><span class="rank-badge ${bg}">${rank}</span></td>
        <td style="cursor:pointer;" onclick="showPlayerTooltip('${escapeHtml(p.name)}',this)">
          <strong>${escapeHtml(p.name)}</strong>${exTag}${dormTag}
          <span style="font-size:10px;color:#ccc;margin-left:2px;">▾</span>
        </td>
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
