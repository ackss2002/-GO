// ── 1분기 출석 하드코딩 ──
const Q1_LEAGUE_DATES = ['2026-01-09','2026-01-16','2026-01-23','2026-02-06','2026-02-13','2026-02-20','2026-02-27','2026-03-13','2026-03-20','2026-03-27'];
const Q1_EXCHANGE_DATES = ['2026-02-10','2026-03-05','2026-03-18'];
const Q1_EXCHANGE_TEAMS = ['LG','한전','푸르미'];

const Q1_LEAGUE_ATT = {
  '이원호':  [1,1,1,1,1,1,1,1,0,0],
  '곽동석':  [0,0,0,0,0,0,0,1,1,1],
  '김동수':  [0,0,0,1,1,0,0,1,1,0],
  '김영서':  [0,0,0,0,0,0,0,0,1,1],
  '김조영':  [0,1,0,1,0,1,1,1,1,0],
  '김현종':  [0,0,1,0,0,0,0,0,1,0],
  '신문섭':  [0,0,0,0,0,0,0,1,1,0],
  '안경식':  [1,1,1,1,1,1,1,1,0,0],
  '안치국':  [1,1,1,1,1,1,1,1,1,1],
  '양선한':  [0,0,1,0,0,0,0,1,1,0],
  '이상건':  [1,1,1,1,1,1,1,1,1,0],
  '이진규':  [0,0,0,0,0,0,1,0,0,1],
  '한철호':  [0,0,0,1,0,0,1,1,0,0],
  '전인석':  [0,0,0,0,0,0,0,1,1,0],
  '정헌모':  [1,1,1,1,1,1,1,1,1,0],
  '정희남':  [1,1,0,1,1,0,1,1,1,0],
  '김영란':  [0,0,1,0,0,0,0,1,1,0],
  '최양님':  [0,0,0,1,0,0,0,1,1,0],
  '변현진':  [0,0,0,0,0,0,0,1,1,0],
  '이미진':  [1,1,1,1,1,1,1,1,1,1],
  '정영아':  [1,1,0,1,0,1,1,1,1,0],
  '김옥란':  [1,0,1,0,1,1,0,1,1,0],
  '이봄희':  [1,1,1,1,1,1,1,1,1,1],
  '조경숙':  [0,0,0,0,0,0,0,1,1,0],
  '김덕기':  [1,1,1,1,1,1,1,1,1,0],
  '이운희':  [0,0,0,0,0,0,0,1,1,0],
};

const Q1_EXCHANGE_ATT = {
  '이원호':  [1,1,1],
  '김동수':  [1,0,0],
  '김영서':  [0,1,0],
  '김조영':  [0,0,1],
  '김현종':  [0,1,0],
  '안경식':  [0,1,1],
  '안치국':  [1,1,1],
  '이상건':  [1,1,1],
  '이진규':  [1,0,0],
  '전인석':  [1,0,0],
  '정헌모':  [1,1,1],
  '정희남':  [1,1,1],
  '김영란':  [0,1,0],
  '이미진':  [1,1,1],
  '정영아':  [1,1,1],
  '김옥란':  [1,1,0],
  '이봄희':  [1,1,1],
  '조경숙':  [0,1,0],
  '김덕기':  [1,1,1],
  '이운희':  [0,0,1],
};

let currentAttQuarter = 1;

function switchAttQuarter(q){
  currentAttQuarter = q;
  ['1','2'].forEach(id=>{
    const btn = document.getElementById('atab-'+id);
    if(!btn) return;
    const active = String(q)===id;
    btn.style.fontWeight = active?'700':'400';
    btn.style.color = active?'#e94560':'#888';
    btn.style.borderBottom = active?'2px solid #e94560':'2px solid transparent';
  });
  document.getElementById('att-q1').style.display = q===1?'block':'none';
  document.getElementById('att-q2').style.display = q===2?'block':'none';
  if(q===1) renderQ1Attendance();
  if(q===2) renderAttendance();
}

function renderQ1Attendance(){
  const members = MEMBERS.map(m=>m.name);
  const thStyle = 'padding:6px 6px;border:1px solid #bbb;text-align:center;min-width:48px;font-size:11px;';
  const nameTh = 'background:#1a1a2e;color:white;padding:6px 10px;border:1px solid #555;text-align:left;min-width:80px;';

  // 날짜 통합 정렬 (금요리그=green, 교류전=orange)
  const allDates = [
    {d:'2026-01-09', type:'l'},
    {d:'2026-01-16', type:'l'},
    {d:'2026-01-23', type:'l'},
    {d:'2026-02-06', type:'l'},
    {d:'2026-02-10', type:'e', team:'LG'},
    {d:'2026-02-13', type:'l'},
    {d:'2026-02-20', type:'l'},
    {d:'2026-02-27', type:'l'},
    {d:'2026-03-05', type:'e', team:'한전'},
    {d:'2026-03-13', type:'l'},
    {d:'2026-03-18', type:'e', team:'푸르미'},
    {d:'2026-03-20', type:'l'},
    {d:'2026-03-27', type:'l'},
  ];

  // 헤더
  document.getElementById('att-q1-head').innerHTML = `<tr>
    <th style="background:#1a1a2e;color:white;padding:6px 8px;border:1px solid #555;text-align:center;min-width:36px;">순위</th>
    <th style="${nameTh}">이름</th>
    ${allDates.map(({d,type,team})=>{
      const bg = type==='l'?'background:#e8f5e9;color:#1b5e20;':'background:#fff3e0;color:#e65100;';
      const label = team ? `${d.slice(5)}<br><span style="font-size:10px;">(${team})</span>` : d.slice(5);
      return `<th style="${bg}${thStyle}">${label}</th>`;
    }).join('')}
    <th style="background:#fff9c4;padding:6px 8px;border:1px solid #bbb;text-align:center;min-width:46px;font-weight:700;">합계</th>
  </tr>`;

  // 데이터
  const rows = members.map(name=>{
    const lRow = Q1_LEAGUE_ATT[name]||[];
    const eRow = Q1_EXCHANGE_ATT[name]||[];
    // 날짜별 출석 매핑
    const attMap = {
      '2026-01-09':lRow[0],'2026-01-16':lRow[1],'2026-01-23':lRow[2],
      '2026-02-06':lRow[3],'2026-02-13':lRow[4],'2026-02-20':lRow[5],
      '2026-02-27':lRow[6],'2026-03-13':lRow[7],'2026-03-20':lRow[8],'2026-03-27':lRow[9],
      '2026-02-10':eRow[0],'2026-03-05':eRow[1],'2026-03-18':eRow[2],
    };
    const total = Object.values(attMap).filter(v=>v).length;
    return {name, attMap, total};
  }).filter(r=>r.total>0).sort((a,b)=>b.total-a.total);

  let rank=1;
  document.getElementById('att-q1-body').innerHTML = rows.map((r,i)=>{
    if(i>0 && r.total<rows[i-1].total) rank=i+1;
    const rankBg = rank===1?'background:#ffd700;color:#1a1a2e;font-size:15px;':(rank===2?'background:#aaa;color:white;':(rank===3?'background:#cd7f32;color:white;':'background:#f5f5f5;'));
    return `<tr>
      <td style="text-align:center;padding:6px;border:1px solid #bbb;font-weight:700;${rankBg}">${rank}</td>
      <td style="padding:6px 10px;border:1px solid #bbb;font-weight:700;">${r.name}</td>
      ${allDates.map(({d,type})=>{
        const v = r.attMap[d];
        const bg = v?(type==='l'?'#e8f5e9':'#fff3e0'):'white';
        return `<td style="border:1px solid #bbb;text-align:center;padding:4px;background:${bg};">${v?'●':''}</td>`;
      }).join('')}
      <td style="border:1px solid #bbb;text-align:center;font-weight:900;font-size:14px;background:#fff9c4;">${r.total}</td>
    </tr>`;
  }).join('');
}

function getAttendance(){
  try{ return JSON.parse(localStorage.getItem('ttgo_attendance')||'{"dates":[],"records":{}}'); }catch(e){ return {dates:[],records:{}}; }
}
function saveAttendance(data){
  localStorage.setItem('ttgo_attendance', JSON.stringify(data));
  if(typeof db !== 'undefined') db.ref('ttgo_attendance').set(data);
}

function addAttendanceDate(){
  const d = document.getElementById('att-date').value;
  if(!d){ alert('날짜를 선택하세요.'); return; }
  const att = getAttendance();
  if(att.dates.includes(d)){ alert('이미 추가된 날짜입니다.'); return; }
  att.dates.push(d);
  att.dates.sort();
  saveAttendance(att);
  renderAttendance();
}

function toggleAttendance(name, date){
  const att = getAttendance();
  if(!att.records[name]) att.records[name]={};
  att.records[name][date] = !att.records[name][date];
  saveAttendance(att);
  renderAttendance();
}

function removeAttendanceDate(date){
  if(!confirm(date+' 날짜를 삭제할까요?')) return;
  const att = getAttendance();
  att.dates = att.dates.filter(d=>d!==date);
  saveAttendance(att);
  renderAttendance();
}

function renderAttendance(){
  const att = getAttendance();
  const dates = att.dates;
  const members = MEMBERS.map(m=>m.name);
  document.getElementById('att-head').innerHTML = `<tr>
    <th style="background:#1a1a2e;color:white;padding:6px 8px;border:1px solid #555;text-align:center;min-width:36px;">순위</th>
    <th style="background:#1a1a2e;color:white;padding:6px 10px;border:1px solid #555;text-align:left;min-width:80px;">이름</th>
    ${dates.map(d=>`<th style="background:#e3f2fd;color:#1a1a2e;padding:6px 8px;border:1px solid #bbb;text-align:center;min-width:70px;font-size:11px;">
      ${d.slice(5)}<br><small onclick="removeAttendanceDate('${d}')" style="color:#e94560;cursor:pointer;font-size:10px;">✕</small>
    </th>`).join('')}
    <th style="background:#fff9c4;padding:6px 8px;border:1px solid #bbb;text-align:center;min-width:50px;">합계</th>
  </tr>`;

  const rows = members.map(name=>{
    const rec = att.records[name]||{};
    const total = dates.filter(d=>rec[d]).length;
    return {name, rec, total};
  }).filter(r=>r.total>0).sort((a,b)=>b.total-a.total);

  let rank=1;
  document.getElementById('att-body').innerHTML = rows.map((r,i)=>{
    if(i>0 && r.total<rows[i-1].total) rank=i+1;
    const rankBg = rank===1?'background:#ffd700;':(rank===2?'background:#c0c0c0;':(rank===3?'background:#cd7f32;color:white;':''));
    return `<tr>
      <td style="text-align:center;padding:6px;border:1px solid #bbb;font-weight:700;${rankBg}">${rank}</td>
      <td style="padding:6px 10px;border:1px solid #bbb;font-weight:700;">${r.name}</td>
      ${dates.map(d=>`<td style="border:1px solid #bbb;text-align:center;cursor:pointer;padding:4px;background:${r.rec[d]?'#e8f5e9':'white'};"
        onclick="toggleAttendance('${r.name}','${d}')">${r.rec[d]?'●':''}</td>`).join('')}
      <td style="border:1px solid #bbb;text-align:center;font-weight:900;font-size:14px;background:#fff9c4;">${r.total}</td>
    </tr>`;
  }).join('');
}
