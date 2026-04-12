// ── 경기 기록 ──
function saveHistory(){
  const w = ST.week;
  const f = ST.final;
  if(!w.date || !f.win) return; // 날짜나 우승자 없으면 저장 안함

  const record = {
    date: w.date,
    week: w.week||'',
    type: w.type,
    set: w.set,
    players: [...w.players],
    groups: JSON.parse(JSON.stringify(w.groups)),
    results: JSON.parse(JSON.stringify(w.results||[])),
    final: {...f},
    savedAt: Date.now()
  };

  let history = getHistory();
  // 같은 날짜면 덮어쓰기
  const idx = history.findIndex(h=>h.date===w.date);
  if(idx>=0) history[idx] = record;
  else history.unshift(record);

  localStorage.setItem('ttgo_history', JSON.stringify(history));
  if(typeof db !== 'undefined') db.ref('ttgo_history').set(history);
}

function getHistory(){
  try{ return JSON.parse(localStorage.getItem('ttgo_history')||'[]'); }catch(e){ return []; }
}

function renderHistory(){
  const history = getHistory();
  const listEl = document.getElementById('history-list');
  const detailEl = document.getElementById('history-detail');

  listEl.style.display = 'block';
  detailEl.style.display = 'none';

  if(history.length===0){
    listEl.textContent = '아직 기록이 없습니다';
    return;
  }

  listEl.innerHTML = history.map((h,i)=>{
    const date = escapeHtml(h.date);
    const week = escapeHtml(h.week||'');
    const type = escapeHtml(h.type||'');
    const set = escapeHtml(h.set||'');
    const win = escapeHtml((h.final&&h.final.win)||'');
    const second = escapeHtml((h.final&&h.final.second)||'');
    return `
    <div onclick="showHistoryDetail(${i})" style="display:flex;align-items:center;justify-content:space-between;padding:12px 14px;border:1px solid #e8e8e8;border-radius:10px;margin-bottom:8px;cursor:pointer;background:white;transition:all 0.15s;"
      onmouseover="this.style.background='#f5f5f5'" onmouseout="this.style.background='white'">
      <div>
        <div style="font-weight:700;font-size:14px;">${date} <span style="font-size:12px;color:#888;font-weight:400;">${week} · ${type} · ${set}</span></div>
        <div style="font-size:12px;color:#555;margin-top:3px;">
          출전 ${h.players.length}명 &nbsp;·&nbsp;
          🥇 ${win||'-'} &nbsp;·&nbsp;
          🥈 ${second||'-'}
          ${h.final && h.final.third ? ' &nbsp;·&nbsp; 🥉 '+escapeHtml(h.final.third) : ''}
        </div>
      </div>
      <span style="color:#bbb;font-size:18px;">›</span>
    </div>`).join('');
}

function showHistoryDetail(idx){
  const h = getHistory()[idx];
  if(!h) return;

  document.getElementById('history-list').style.display = 'none';
  document.getElementById('history-detail').style.display = 'block';

  const buMap = {};
  MEMBERS.forEach(m=>{ buMap[m.name] = m.bu!==m.total ? m.bu+'('+m.total+')' : m.total; });
  (h.players||[]).forEach(name=>{
    if(!buMap[name]) buMap[name]='';
  });

  let html = `
    <div class="card">
      <div style="font-size:16px;font-weight:700;margin-bottom:4px;">${escapeHtml(h.date)}</div>
      <div style="font-size:12px;color:#888;margin-bottom:14px;">${escapeHtml(h.week||'')} · ${escapeHtml(h.type||'')} · ${escapeHtml(h.set||'')} · 출전 ${h.players.length}명</div>

      <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:16px;">
        <div style="padding:10px 16px;background:#fff9c4;border-radius:8px;text-align:center;min-width:90px;">
          <div style="font-size:18px;">🥇</div>
          <div style="font-weight:700;font-size:14px;">${escapeHtml((h.final&&h.final.win)||'-')}</div>
          <div style="font-size:11px;color:#888;">우승 +5점</div>
        </div>
        <div style="padding:10px 16px;background:#f5f5f5;border-radius:8px;text-align:center;min-width:90px;">
          <div style="font-size:18px;">🥈</div>
          <div style="font-weight:700;font-size:14px;">${escapeHtml((h.final&&h.final.second)||'-')}</div>
          <div style="font-size:11px;color:#888;">준우승 +3점</div>
        </div>
        ${h.final.third?`
        <div style="padding:10px 16px;background:#fff3e0;border-radius:8px;text-align:center;min-width:90px;">
          <div style="font-size:18px;">🥉</div>
          <div style="font-weight:700;font-size:14px;">${escapeHtml([h.final&&h.final.third,h.final&&h.final.third2].filter(Boolean).join(', '))}</div>
          <div style="font-size:11px;color:#888;">공동3위 +2점</div>
        </div>`:''}
        ${h.final.lucky?`
        <div style="padding:10px 16px;background:#e8f5e9;border-radius:8px;text-align:center;min-width:90px;">
          <div style="font-size:18px;">🎁</div>
          <div style="font-weight:700;font-size:14px;">${escapeHtml(h.final.lucky||'')}</div>
          <div style="font-size:11px;color:#888;">행운상</div>
        </div>`:''}
      </div>
    </div>

    <div class="card">
      <div class="card-title">조별 순위</div>
      ${(h.results||[]).length===0 ? '<div style="color:#888;font-size:13px;">기록 없음</div>' :
        h.results.map(r=>`
        <div style="margin-bottom:14px;">
          <div style="font-size:13px;font-weight:700;margin-bottom:6px;">${r.g}조</div>
          <table style="font-size:12px;">
            <thead><tr>
              <th style="padding:4px 8px;background:#e8f5e9;border:1px solid #ddd;">순위</th>
              <th style="padding:4px 8px;background:#e8f5e9;border:1px solid #ddd;">이름</th>
              <th style="padding:4px 8px;background:#e8f5e9;border:1px solid #ddd;">승</th>
              <th style="padding:4px 8px;background:#e8f5e9;border:1px solid #ddd;">패</th>
              <th style="padding:4px 8px;background:#e8f5e9;border:1px solid #ddd;">승점</th>
            </tr></thead>
            <tbody>
              ${r.players.map((p,i)=>`<tr>
                <td style="padding:4px 8px;border:1px solid #ddd;text-align:center;">${i+1}</td>
                <td style="padding:4px 8px;border:1px solid #ddd;font-weight:700;">${escapeHtml(p.name)}${escapeHtml(buMap[p.name]||'')}</td>
                <td style="padding:4px 8px;border:1px solid #ddd;text-align:center;">${p.w}</td>
                <td style="padding:4px 8px;border:1px solid #ddd;text-align:center;">${p.l}</td>
                <td style="padding:4px 8px;border:1px solid #ddd;text-align:center;font-weight:700;">${p.mp}점</td>
              </tr>`).join('')}
            </tbody>
          </table>
        </div>`).join('')}
    </div>

    <div class="card">
      <div class="card-title">출전 선수 (${h.players.length}명)</div>
      <div style="display:flex;flex-wrap:wrap;gap:6px;">
        ${h.players.map(name=>`<span class="player-chip selected" style="pointer-events:none;">${escapeHtml(name)}${escapeHtml(buMap[name]?buMap[name]:'' )}</span>`).join('')}
      </div>
    </div>`;

  document.getElementById('history-detail-content').innerHTML = html;
}

function closeHistoryDetail(){
  document.getElementById('history-list').style.display = 'block';
  document.getElementById('history-detail').style.display = 'none';
}

