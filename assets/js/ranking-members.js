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
  return {w,s,t,pts:w*5+s*3+t*2, up:(q1.up||false)||(sc.up||false)};
}

// ── 선수 상세 팝업 ──
var _tooltip = null;

function showPlayerTooltip(name, el){
  hidePlayerTooltip();

  // Q1 요약 (Q1_SCORES 합계)
  var q1 = (typeof Q1_SCORES!=='undefined' && Q1_SCORES[name]) || null;
  var q1Html = '';
  if(q1 && (q1.w||q1.s||q1.t)){
    var parts = [];
    if(q1.w) parts.push('🥇 우승 '+q1.w+'회');
    if(q1.s) parts.push('🥈 준우승 '+q1.s+'회');
    if(q1.t) parts.push('🥉 3위 '+q1.t+'회');
    var q1pts = (q1.w||0)*5+(q1.s||0)*3+(q1.t||0)*2;
    q1Html = '<div style="margin-bottom:10px;">'
      +'<div style="font-size:11px;font-weight:700;color:#888;letter-spacing:.5px;margin-bottom:5px;">Q1</div>'
      +'<div style="background:#f8f9fa;border-radius:8px;padding:8px 10px;font-size:12px;color:#333;">'
      +parts.join(' · ')
      +'<span style="float:right;color:#e94560;font-weight:700;">+'+q1pts+'pt</span></div>'
      +'</div>';
  }

  // Q2 경기 (history에서 날짜별)
  var hist = (typeof getHistory==='function') ? getHistory() : [];
  var q2Rows = [];
  hist.forEach(function(r){
    var f = r.final || {};
    var d = r.date || '';
    var icon, label, pts;
    if(f.win===name)                           { icon='🥇'; label='우승';    pts=5; }
    else if(f.second===name)                   { icon='🥈'; label='준우승';  pts=3; }
    else if(f.third===name||f.third2===name)   { icon='🥉'; label='공동3위'; pts=2; }
    else if((r.players||[]).includes(name))    { icon='▸';  label='참가';    pts=0; }
    else return;
    var dateTxt = d.slice(5).replace('-','/');
    var ptsTxt = pts>0 ? '<span style="color:#e94560;font-weight:700;">+'+pts+'pt</span>' : '';
    q2Rows.push('<div style="display:flex;justify-content:space-between;align-items:center;padding:4px 0;border-bottom:1px solid #f5f5f5;">'
      +'<span style="color:#888;font-size:11px;min-width:36px;">'+dateTxt+'</span>'
      +'<span style="flex:1;margin-left:6px;">'+icon+' '+label+'</span>'
      +ptsTxt+'</div>');
  });
  var q2Html = '';
  if(q2Rows.length){
    q2Html = '<div style="margin-bottom:10px;">'
      +'<div style="font-size:11px;font-weight:700;color:#888;letter-spacing:.5px;margin-bottom:5px;">Q2</div>'
      +q2Rows.join('')+'</div>';
  }

  // 교류전
  var eAtt = (typeof Q1_EXCHANGE_ATT!=='undefined' && Q1_EXCHANGE_ATT[name]) || [];
  var exRows = [];
  (typeof Q1_EXCHANGE_DATES!=='undefined' ? Q1_EXCHANGE_DATES : []).forEach(function(d,i){
    if(!eAtt[i]) return;
    var dateTxt = d.slice(5).replace('-','/');
    exRows.push('<div style="display:flex;align-items:center;padding:4px 0;border-bottom:1px solid #f5f5f5;">'
      +'<span style="color:#888;font-size:11px;min-width:36px;">'+dateTxt+'</span>'
      +'<span style="flex:1;margin-left:6px;color:#e65100;">🤝 '+escapeHtml(Q1_EXCHANGE_TEAMS[i])+'</span>'
      +'</div>');
  });
  var exHtml = '';
  if(exRows.length){
    exHtml = '<div>'
      +'<div style="font-size:11px;font-weight:700;color:#888;letter-spacing:.5px;margin-bottom:5px;">교류전</div>'
      +exRows.join('')+'</div>';
  }

  // 시즌 합계
  var tot = getTotalPts(name);
  var seasonHtml = '<div style="background:#1a1a2e;border-radius:8px;padding:8px 12px;margin-bottom:12px;display:flex;justify-content:space-between;align-items:center;">'
    +'<span style="color:#aaa;font-size:11px;font-weight:700;letter-spacing:.5px;">SEASON TOTAL</span>'
    +'<span style="color:#fff;font-weight:700;font-size:15px;">'+tot.pts+'pt</span>'
    +'</div>';

  var body = seasonHtml + q1Html + q2Html + exHtml ||
    '<div style="color:#bbb;text-align:center;padding:10px 0;font-size:12px;">기록 없음</div>';

  if(!_tooltip){
    _tooltip = document.createElement('div');
    _tooltip.id = 'player-tt';
    _tooltip.style.cssText = 'position:fixed;z-index:9500;background:#fff;border-radius:14px;'
      +'box-shadow:0 8px 32px rgba(0,0,0,0.18);padding:16px 18px;min-width:230px;max-width:280px;font-size:13px;line-height:1.6;';
    document.body.appendChild(_tooltip);
    document.addEventListener('click', function(e){
      if(_tooltip && !_tooltip.contains(e.target)) hidePlayerTooltip();
    }, true);
  }

  _tooltip.innerHTML =
    '<div style="font-weight:700;font-size:14px;color:#1a1a2e;border-bottom:2px solid #e94560;padding-bottom:8px;margin-bottom:12px;">'
    +escapeHtml(name)+'</div>'+body;

  var rect = el.getBoundingClientRect();
  var top = rect.bottom + 6;
  var left = rect.left;
  if(left + 290 > window.innerWidth) left = window.innerWidth - 295;
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
