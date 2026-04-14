// 누적 순위
function renderRanking(){
  const exts = getExternals();
  const allMembers = [
    ...MEMBERS.map(m=>({...m, isExt:false})),
    ...exts.map(m=>({...m, isExt:true}))
  ];

  // 분기별 점수 결정
  let scores, title;
  const q = currentQuarter||1;
  if(q===1){
    scores = Q1_SCORES;
    title = '1분기 랭킹 포인트 순위';
  } else if(q===2){
    // 2분기: 승급자는 승급 이후 점수만, 미승급자는 이월+2분기 전체
    scores = {};
    allMembers.forEach(m=>{
      const co = (ST.carryOver||{})[m.name]||{w:0,s:0,t:0,pts:0};
      const q2 = (ST.scores||{})[m.name]||{w:0,s:0,t:0,pts:0};
      // 승급 여부 판단 (2분기 내 승급자는 q2.up===true)
      if(q2.up){
        // 승급자는 2분기 점수 리셋: 승급 이후 실적만 반영 (carryOver 제외)
        scores[m.name] = {
          w: q2.w||0,
          s: q2.s||0,
          t: q2.t||0,
          pts: (q2.w||0)*5 + (q2.s||0)*3 + (q2.t||0)*2,
          up: true
        };
      } else {
        // 미승급자는 이월+2분기 전체
        scores[m.name] = {
          w:(co.w||0)+(q2.w||0),
          s:(co.s||0)+(q2.s||0),
          t:(co.t||0)+(q2.t||0),
          pts:(co.pts||0)+(q2.pts||0),
          up: false
        };
      }
    });
    title = '2분기 랭킹 포인트 순위';
  } else {
    // 전체: 횟수 합산 → 실제 획득 총점으로 계산 (승급 리셋 무시)
    scores = {};
    allMembers.forEach(m=>{
      const q1 = Q1_SCORES[m.name]||{w:0,s:0,t:0,pts:0};
      const q2 = (ST.scores||{})[m.name]||{w:0,s:0,t:0,pts:0};
      const w = (q1.w||0)+(q2.w||0);
      const s = (q1.s||0)+(q2.s||0);
      const t = (q1.t||0)+(q2.t||0);
      scores[m.name] = {
        w: w, s: s, t: t,
        pts: w*5 + s*3 + t*2,
        up: q1.up||q2.up
      };
    });
    title = '전체 랭킹 포인트 순위';
  }

  var rankingTitle = document.getElementById('ranking-title');
  if (rankingTitle) rankingTitle.textContent = title;

  const all = allMembers.map(m=>{
    const s = scores[m.name]||{w:0,s:0,t:0,pts:0};
    const buDisplay = m.bu!==m.total ? m.bu+'('+m.total+')' : String(m.bu);
    return {name:m.name, gender:m.g, bu:buDisplay, isExt:m.isExt, ...s};
  }).sort((a,b)=>b.pts-a.pts||b.w-a.w||b.s-a.s);

  const bgs=['rank-1','rank-2','rank-3'];
  let rank=1;
  var rankingTbody = document.getElementById('ranking-tbody');
  if (rankingTbody) {
    rankingTbody.innerHTML=all.map((p,i)=>{
      if(i>0&&p.pts<all[i-1].pts) rank=i+1;
      if(p.pts===0 && !p.up) return '';
      const bg=rank<=3?bgs[rank-1]:'rank-n';
      const upTag = p.up?'<span class="pill pill-amber" style="margin-left:4px;">↑승급</span>':'';
      return `<tr><td><span class="rank-badge ${bg}">${rank}</span></td>
        <td><strong>${escapeHtml(p.name)}</strong></td><td>${escapeHtml(p.gender)}</td><td>${escapeHtml(String(p.bu))}</td>
        <td>${p.w||0}</td><td>${p.s||0}</td><td>${p.t||0}</td><td><strong>${p.pts}점</strong>${upTag}</td>
        <td></td></tr>`;
    }).join('')||'<tr><td colspan="9" style="color:#888;text-align:center;">데이터 없음</td></tr>';
  }

  // 승급 현황 (2분기/전체만)
  var upgradeCard = document.getElementById('upgrade-card');
  if(q!==1 && upgradeCard){
    const ups = all.filter(p=>p.up);
    upgradeCard.innerHTML=
      `<strong>승급 현황</strong> `+
      (ups.length?ups.map(p=>`<span class="pill pill-amber">${escapeHtml(p.name)} 승급완료</span>`).join(' '):'승급자 없음');
  } else if (upgradeCard) {
    upgradeCard.innerHTML='';
  }

  // 게스트 순위
  var guestRankingTbody = document.getElementById('guest-ranking-tbody');
  const guestScores = ST.guestScores||{};
  const guests = Object.keys(guestScores).map(name=>{
    const s = guestScores[name];
    return {name, bu:s.bu||'?', w:s.w||0, s:s.s||0, t:s.t||0, pts:s.pts||0};
  }).filter(g=>g.pts>0).sort((a,b)=>b.pts-a.pts||b.w-a.w);
  let grank=1;
  if (guestRankingTbody) {
    guestRankingTbody.innerHTML = guests.length ?
      guests.map((g,i)=>{
      if(i>0&&g.pts<guests[i-1].pts) grank=i+1;
      const bg=grank<=3?bgs[grank-1]:'rank-n';
      return `<tr><td><span class="rank-badge ${bg}">${grank}</span></td>
        <td><strong>${escapeHtml(g.name)}</strong></td><td>${escapeHtml(String(g.bu))}부</td>
        <td>${g.w}</td><td>${g.s}</td><td>${g.t}</td><td><strong>${g.pts}점</strong></td></tr>`;
    }).join('')
    : '<tr><td colspan="7" style="color:#888;text-align:center;">게스트 랭킹 포인트 없음</td></tr>';
}

// 회원 관리
function renderMembers(){
  // 가나다(한글) 순 정렬 후 출력
  const sorted = (MEMBERS||[]).slice().sort((a,b)=>{
    return (a.name||'').localeCompare(b.name||'', 'ko');
  });
  document.getElementById('active-tbody').innerHTML=sorted.map((m,i)=>{
    return `<tr><td>${i+1}</td><td>${escapeHtml(m.name)}</td><td>${escapeHtml(m.g)}</td><td>${escapeHtml(m.bu)}</td><td>${escapeHtml(m.bu!==m.total?m.bu+'('+m.total+')':m.total)}</td></tr>`;
  }).join('');
  document.getElementById('dormant-tbody').innerHTML=DORMANT.map((m,i)=>{
    return `<tr><td>${i+1}</td><td>${escapeHtml(m.name)}</td><td>${escapeHtml(m.g)}</td><td>${escapeHtml(m.bu)}</td><td>${escapeHtml(m.bu!==m.total?m.bu+'('+m.total+')':m.total)}</td></tr>`;
  }).join('');
}

function renderExternalMembers(){
  const exts = getExternals();
  const el = document.getElementById('external-tbody');
  const empty = document.getElementById('external-empty');
  const cnt = document.getElementById('external-cnt');
  if(cnt) cnt.textContent = exts.length+'명';
  if(!exts.length){
    if(el) el.textContent='';
    if(empty) empty.style.display='block';
    return;
  }
  if(empty) empty.style.display='none';
  if(el) el.innerHTML=exts.map((m,i)=>{
    const s = ST.scores[m.name]||{pts:0};
    return `<tr>
      <td>${i+1}</td>
      <td><strong>${escapeHtml(m.name)}</strong> <span class="pill" style="background:#fff3e0;color:#e65100;font-size:10px;">특별</span></td>
      <td>${escapeHtml(m.g)}</td><td>${escapeHtml(String(m.total))}부</td>
      <td>${s.pts||0}점</td>
      <td><button class="btn btn-sm" onclick="removeExternal('${jsEscape(m.name)}')" style="background:#ffebee;color:#c62828;border-color:#ffcdd2;padding:2px 8px;">삭제</button></td>
    </tr>`;
  }).join('');
}

function addExternal(){
  const name = document.getElementById('ext-name').value.trim();
  const gender = document.getElementById('ext-gender').value;
  const bu = parseInt(document.getElementById('ext-bu').value);
  if(!name){ alert('이름을 입력하세요.'); return; }
  if(isNaN(bu)||bu<1||bu>10){ alert('부수를 입력하세요 (1~10).'); return; }
  if(MNAMES.includes(name)){ alert('정회원 명단에 있는 이름입니다.'); return; }
  const exts = getExternals();
  if(exts.find(e=>e.name===name)){ alert('이미 등록된 특별 회원입니다.'); return; }
  exts.push({name, g:gender, bu, total:bu});
  saveExternals(exts);
  document.getElementById('ext-name').value='';
  document.getElementById('ext-bu').value='';
  renderExternalMembers();
  renderLeague();
}

function removeExternal(name){
  if(!confirm(name+'을(를) 특별 회원에서 삭제할까요?')) return;
  const exts = getExternals().filter(e=>e.name!==name);
  saveExternals(exts);
  renderExternalMembers();
  renderLeague();
}
function renderMembersAdminUI(currentUser) {
  var area = document.getElementById('admin-members-area');
  if (!area) return;
  var isAdm = window.isAdminUser || false;

  var sorted = (MEMBERS||[]).slice().sort((a,b)=>(a.name||'').localeCompare(b.name||'','ko'));
  var dormant = (DORMANT||[]).slice().sort((a,b)=>(a.name||'').localeCompare(b.name||'','ko'));
  var exList = (EX_MEMBERS||[]).slice();

  area.innerHTML = `
    <div style="max-width:700px;margin:0 auto;padding:12px;">

      <!-- 정회원 -->
      <div style="background:#fff;border-radius:12px;box-shadow:0 2px 12px rgba(0,0,0,0.08);margin-bottom:16px;overflow:hidden;">
        <div style="background:#1a1a2e;padding:14px 18px;display:flex;align-items:center;justify-content:space-between;">
          <span style="color:#fff;font-weight:700;font-size:15px;">정회원</span>
          <span style="background:#e94560;color:#fff;border-radius:20px;padding:2px 12px;font-size:13px;font-weight:700;">${sorted.length}명</span>
        </div>
        <div style="padding:0;">
          ${sorted.map((m,i)=>`
            <div style="display:grid;grid-template-columns:32px 1fr 60px 80px ${isAdm?'120px':'0px'};align-items:center;padding:10px 16px;border-bottom:1px solid #f0f0f0;background:${i%2===0?'#fff':'#fafafa'};">
              <span style="color:#bbb;font-size:12px;">${i+1}</span>
              <span style="font-weight:600;font-size:14px;color:#1a1a2e;">${escapeHtml(m.name)}</span>
              <span style="text-align:center;"><span style="background:#e8f4fd;color:#1565c0;border-radius:10px;padding:2px 8px;font-size:12px;font-weight:700;">${m.bu}부</span></span>
              <span style="text-align:center;"><span style="background:#e8f5e9;color:#2e7d32;border-radius:10px;padding:2px 8px;font-size:11px;">정회원</span></span>
              ${isAdm?`<span style="display:flex;gap:4px;justify-content:flex-end;">
                <button onclick="window.showEditMemberModal('${jsEscape(m.name)}')" style="padding:4px 8px;font-size:11px;border:1px solid #1a1a2e;border-radius:6px;background:#fff;color:#1a1a2e;cursor:pointer;">수정</button>
                <button onclick="setDormant('${jsEscape(m.name)}')" style="padding:4px 8px;font-size:11px;border:1px solid #888;border-radius:6px;background:#fff;color:#666;cursor:pointer;">휴면</button>
                <button onclick="retireMember('${jsEscape(m.name)}')" style="padding:4px 8px;font-size:11px;border:1px solid #e94560;border-radius:6px;background:#fff;color:#e94560;cursor:pointer;">탈퇴</button>
              </span>`:''}
            </div>`).join('')}
        </div>
      </div>

      <!-- 휴면 회원 -->
      ${dormant.length?`
      <div style="background:#fff;border-radius:12px;box-shadow:0 2px 12px rgba(0,0,0,0.08);margin-bottom:16px;overflow:hidden;">
        <div style="background:#607d8b;padding:14px 18px;display:flex;align-items:center;justify-content:space-between;">
          <span style="color:#fff;font-weight:700;font-size:15px;">휴면 회원</span>
          <span style="background:#fff;color:#607d8b;border-radius:20px;padding:2px 12px;font-size:13px;font-weight:700;">${dormant.length}명</span>
        </div>
        <div>
          ${dormant.map((m,i)=>`
            <div style="display:grid;grid-template-columns:32px 1fr 60px 80px ${isAdm?'80px':'0px'};align-items:center;padding:10px 16px;border-bottom:1px solid #f0f0f0;background:${i%2===0?'#fff':'#fafafa'};">
              <span style="color:#bbb;font-size:12px;">${i+1}</span>
              <span style="font-weight:600;font-size:14px;color:#607d8b;">${escapeHtml(m.name)}</span>
              <span style="text-align:center;"><span style="background:#eceff1;color:#607d8b;border-radius:10px;padding:2px 8px;font-size:12px;font-weight:700;">${m.bu}부</span></span>
              <span style="text-align:center;"><span style="background:#eceff1;color:#607d8b;border-radius:10px;padding:2px 8px;font-size:11px;">휴면</span></span>
              ${isAdm?`<span><button onclick="restoreFromDormant('${jsEscape(m.name)}')" style="padding:4px 8px;font-size:11px;border:1px solid #2e7d32;border-radius:6px;background:#fff;color:#2e7d32;cursor:pointer;">복구</button></span>`:''}
            </div>`).join('')}
        </div>
      </div>`:''}

      <!-- 탈퇴 회원 -->
      ${exList.length?`
      <div style="background:#fff;border-radius:12px;box-shadow:0 2px 12px rgba(0,0,0,0.08);margin-bottom:16px;overflow:hidden;">
        <div style="background:#c62828;padding:14px 18px;display:flex;align-items:center;justify-content:space-between;">
          <span style="color:#fff;font-weight:700;font-size:15px;">탈퇴 회원</span>
          <span style="background:#fff;color:#c62828;border-radius:20px;padding:2px 12px;font-size:13px;font-weight:700;">${exList.length}명</span>
        </div>
        <div>
          ${exList.map((m,i)=>`
            <div style="display:grid;grid-template-columns:32px 1fr 60px ${isAdm?'80px':'0px'};align-items:center;padding:10px 16px;border-bottom:1px solid #f0f0f0;">
              <span style="color:#bbb;font-size:12px;">${i+1}</span>
              <span style="font-weight:600;font-size:14px;color:#bbb;">${escapeHtml(m.name)}</span>
              <span style="text-align:center;"><span style="background:#ffebee;color:#c62828;border-radius:10px;padding:2px 8px;font-size:11px;">탈퇴</span></span>
              ${isAdm?`<span><button onclick="restoreMemberFromEx('${jsEscape(m.name)}')" style="padding:4px 8px;font-size:11px;border:1px solid #1a1a2e;border-radius:6px;background:#fff;color:#1a1a2e;cursor:pointer;">복구</button></span>`:''}
            </div>`).join('')}
        </div>
      </div>`:''}

    </div>`;
}
window.renderMembersAdminUI = renderMembersAdminUI;