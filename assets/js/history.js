// ── 경기 기록 ──
var HISTORY_VIEW = [];

function normalizeHistoryItem(h){
  const item = h && typeof h === 'object' ? h : {};
  const players = Array.isArray(item.players) ? item.players : [];
  const results = Array.isArray(item.results) ? item.results : [];
  const final = item.final && typeof item.final === 'object' ? item.final : {};
  return {
    date: item.date || '',
    week: item.week || '',
    type: item.type || '',
    set: item.set || '',
    players: players,
    groups: Array.isArray(item.groups) ? item.groups : [],
    results: results,
    final: final,
    savedAt: item.savedAt || 0
  };
}

function buildHistorySearchIndex(h){
  const parts = [
    h.date, h.week, h.type, h.set,
    h.final && h.final.win,
    h.final && h.final.second,
    h.final && h.final.third,
    h.final && h.final.third2,
    h.final && h.final.lucky
  ].concat(h.players || []);
  return parts.filter(Boolean).join(' ').toLowerCase();
}

function getHistoryView(){
  const raw = getHistory().map(normalizeHistoryItem);
  const byKey = {};
  raw.forEach(function(h){
    const key = (h.date || '') + '|' + (h.type || '');
    if(!byKey[key]) byKey[key] = h;
    else if((byKey[key].savedAt || 0) < (h.savedAt || 0)) byKey[key] = h;
  });
  return Object.keys(byKey).map(function(k){ return byKey[k]; });
}
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
  try{
    const raw = JSON.parse(localStorage.getItem('ttgo_history')||'[]');
    if(Array.isArray(raw)) return raw;
    if(raw && typeof raw === 'object') return Object.keys(raw).map(function(k){ return raw[k]; });
    const legacy = JSON.parse(localStorage.getItem('takgu_history_db')||'[]');
    if(Array.isArray(legacy)) return legacy;
    return [];
  }catch(e){ return []; }
}

function initHistoryUI(){
  const searchEl = document.getElementById('history-search');
  const typeEl = document.getElementById('history-type');
  const sortEl = document.getElementById('history-sort');
  const resetEl = document.getElementById('history-reset');
  if(!searchEl || !typeEl || !sortEl || !resetEl) return;

  function rerender(){ renderHistory(); }
  searchEl.addEventListener('input', rerender);
  typeEl.addEventListener('change', rerender);
  sortEl.addEventListener('change', rerender);
  resetEl.addEventListener('click', function(){
    searchEl.value = '';
    typeEl.value = '';
    sortEl.value = 'desc';
    renderHistory();
  });
}

function renderHistory(){
  const history = getHistoryView();
  const listEl = document.getElementById('history-list');
  const detailEl = document.getElementById('history-detail');
  const searchEl = document.getElementById('history-search');
  const typeEl = document.getElementById('history-type');
  const sortEl = document.getElementById('history-sort');
  const countEl = document.getElementById('history-count');

  listEl.style.display = 'block';
  detailEl.style.display = 'none';

  if(history.length===0){
    listEl.innerHTML = '<div style="color:#666;font-style:italic;text-align:center;padding:60px 0;font-size:15px;">기록이 없습니다. 토너먼트 결과를 저장하거나 Firebase 로드를 확인하세요.</div>';
    if(countEl) countEl.textContent = '0 records';
    return;
  }

  const types = Array.from(new Set(history.map(function(h){ return h.type || ''; }).filter(Boolean)));
  if(typeEl){
    const selected = typeEl.value;
    typeEl.innerHTML = '<option value="">All types</option>' + types.map(function(t){
      return '<option value="' + escapeHtml(t) + '">' + escapeHtml(t) + '</option>';
    }).join('');
    if(selected) typeEl.value = selected;
  }

  const query = (searchEl && searchEl.value ? searchEl.value.trim().toLowerCase() : '');
  const typeFilter = typeEl && typeEl.value ? typeEl.value : '';
  const sortDir = sortEl && sortEl.value === 'asc' ? 'asc' : 'desc';

  let filtered = history.filter(function(h){
    if(typeFilter && h.type !== typeFilter) return false;
    if(query){
      const index = buildHistorySearchIndex(h);
      if(index.indexOf(query) === -1) return false;
    }
    return true;
  });

  filtered.sort(function(a,b){
    const cmp = (a.date || '').localeCompare(b.date || '');
    return sortDir === 'asc' ? cmp : -cmp;
  });

  HISTORY_VIEW = filtered;

  listEl.innerHTML = filtered.map((h,i)=>{
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
          Players ${h.players.length} &nbsp;·&nbsp;
          🥇 ${win||'-'} &nbsp;·&nbsp;
          🥈 ${second||'-'}
          ${h.final && h.final.third ? ' &nbsp;·&nbsp; 🥉 '+escapeHtml(h.final.third) : ''}
        </div>
      </div>
      <span style="color:#bbb;font-size:18px;">›</span>
    </div>`;
  }).join('');

  if(countEl) countEl.textContent = filtered.length + ' records';
}

function showHistoryDetail(idx){
  const h = HISTORY_VIEW[idx];
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
      <div style="font-size:12px;color:#888;margin-bottom:14px;">${escapeHtml(h.week||'')} · ${escapeHtml(h.type||'')} · ${escapeHtml(h.set||'')} · Players ${h.players.length}</div>

      <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:16px;">
        <div style="padding:10px 16px;background:#fff9c4;border-radius:8px;text-align:center;min-width:90px;">
          <div style="font-size:18px;">🥇</div>
          <div style="font-weight:700;font-size:14px;">${escapeHtml((h.final&&h.final.win)||'-')}</div>
          <div style="font-size:11px;color:#888;">Winner +5</div>
        </div>
        <div style="padding:10px 16px;background:#f5f5f5;border-radius:8px;text-align:center;min-width:90px;">
          <div style="font-size:18px;">🥈</div>
          <div style="font-weight:700;font-size:14px;">${escapeHtml((h.final&&h.final.second)||'-')}</div>
          <div style="font-size:11px;color:#888;">Runner-up +3</div>
        </div>
        ${h.final.third?`
        <div style="padding:10px 16px;background:#fff3e0;border-radius:8px;text-align:center;min-width:90px;">
          <div style="font-size:18px;">🥉</div>
          <div style="font-weight:700;font-size:14px;">${escapeHtml([h.final&&h.final.third,h.final&&h.final.third2].filter(Boolean).join(', '))}</div>
          <div style="font-size:11px;color:#888;">Third +2</div>
        </div>`:''}
        ${h.final.lucky?`
        <div style="padding:10px 16px;background:#e8f5e9;border-radius:8px;text-align:center;min-width:90px;">
          <div style="font-size:18px;">🎁</div>
          <div style="font-weight:700;font-size:14px;">${escapeHtml(h.final.lucky||'')}</div>
          <div style="font-size:11px;color:#888;">Lucky</div>
        </div>`:''}
      </div>
    </div>

    <div class="card">
      <div class="card-title">Group results</div>
      ${(h.results||[]).length===0 ? '<div style="color:#888;font-size:13px;">No results</div>' :
        h.results.map(r=>`
        <div style="margin-bottom:14px;">
          <div style="font-size:13px;font-weight:700;margin-bottom:6px;">${r.g}조</div>
          <table style="font-size:12px;">
            <thead><tr>
              <th style="padding:4px 8px;background:#e8f5e9;border:1px solid #ddd;">Rank</th>
              <th style="padding:4px 8px;background:#e8f5e9;border:1px solid #ddd;">Name</th>
              <th style="padding:4px 8px;background:#e8f5e9;border:1px solid #ddd;">W</th>
              <th style="padding:4px 8px;background:#e8f5e9;border:1px solid #ddd;">L</th>
              <th style="padding:4px 8px;background:#e8f5e9;border:1px solid #ddd;">Pts</th>
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
      <div class="card-title">Players (${h.players.length})</div>
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

initHistoryUI();

