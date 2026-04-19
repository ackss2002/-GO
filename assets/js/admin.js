// PIN은 소스코드에 저장하지 않음 — Firebase DB에 해시로 저장
var isAdminUser = false; // 오직 로그인 상태만 저장

// 페이지 로드 시 저장된 로그인 자동 복원
function autoLoginCheck(){
  if(typeof db === 'undefined') return;
  var saved = localStorage.getItem('ttgo_admin');
  if(!saved) return;
  db.ref('adminPin').once('value').then(function(snap){
    if(snap.val() && snap.val() === saved){
      isAdminUser = true;
      window.isAdminUser = true;
      updateAdminUI();
    } else {
      localStorage.removeItem('ttgo_admin');
    }
  }).catch(function(){ localStorage.removeItem('ttgo_admin'); });
}

// SHA-256 해시 생성 (Web Crypto API)
async function hashPin(pin){
  const encoded = new TextEncoder().encode(pin);
  const buf = await crypto.subtle.digest('SHA-256', encoded);
  return Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,'0')).join('');
}

function toggleAdmin(){
  if(isAdminUser){
    // 관리자 모드 해제
    isAdminUser = false;
    window.isAdminUser = false;
    localStorage.removeItem('ttgo_admin');
    updateAdminUI();
    return;
  }
  // PIN 오버레이 표시
  document.getElementById('pin-overlay').style.display='flex';
  document.getElementById('pin-input').value='';
  document.getElementById('pin-error').style.display='none';
  const hint = document.getElementById('pin-hint');
  if(hint) hint.style.display='none';
  setTimeout(()=>document.getElementById('pin-input').focus(), 100);
}

async function checkPin(){
  const val = document.getElementById('pin-input').value;
  if(!val || val.length < 4) return;

  if(typeof db === 'undefined'){
    alert('데이터베이스에 연결되지 않았습니다. 잠시 후 다시 시도하세요.');
    return;
  }

  try{
    const snap = await db.ref('adminPin').once('value');
    const storedHash = snap.val();
    const inputHash = await hashPin(val);

    if(!storedHash){
      // 최초 설정: 입력한 PIN을 해시로 저장
      await db.ref('adminPin').set(inputHash);
      isAdminUser = true;
      window.isAdminUser = true;
      localStorage.setItem('ttgo_admin', inputHash);
      document.getElementById('pin-overlay').style.display = 'none';
      updateAdminUI();
      alert('✅ 관리자 PIN이 설정되었습니다.\n앞으로 이 PIN으로 로그인하세요.');
      return;
    }

    if(inputHash === storedHash){
      isAdminUser = true;
      window.isAdminUser = true;
      localStorage.setItem('ttgo_admin', inputHash);
      document.getElementById('pin-overlay').style.display = 'none';
      updateAdminUI();
    } else {
      document.getElementById('pin-error').style.display = 'block';
      document.getElementById('pin-input').value = '';
    }
  } catch(e){
    console.error('PIN 인증 오류', e);
    alert('인증 오류: ' + e.message);
  }
}

function closePinOverlay(){
  document.getElementById('pin-overlay').style.display='none';
  isAdminUser = false;
  window.isAdminUser = false;
  updateAdminUI();
}

function updateAdminUI(){
  const adminBadge = document.getElementById('admin-badge');
  const lockBtn = document.getElementById('lock-btn');
  adminBadge.style.display = isAdminUser?'inline':'none';
  lockBtn.textContent = isAdminUser?'🔓':'🔒';
  document.body.classList.toggle('admin-mode', isAdminUser);
  // window.isAdminMode 동기화 (renderMembersAdminUI 등에서 사용)
  window.isAdminMode = isAdminUser;
  localStorage.setItem('ttgo_admin_mode', isAdminUser ? '1' : '0');
  // 선수 칩 상태 업데이트
  renderLeague();
  if(typeof renderMembersAdminUI==='function') renderMembersAdminUI(window.currentUser||'');
}

function showLockMsg(msg){
  alert(msg || '운영자 모드에서만 수정할 수 있습니다.\n🔒 버튼을 클릭하여 PIN을 입력하세요.');
}


// Q1 리그전 성적만 (교류전 제외) — PDF 승점표 기준
const Q1_SCORES = {
  '이원호':  {w:1, s:0, t:0, up:false},  // 리그승점 5 = 우승1(02/06) — 02/20복식 제외, 교류전 LG준우승 별도
  '김덕기':  {w:1, s:0, t:1, up:true},   // 리그승점 7 = 우승1(02/06)+3위1(01/16), 교류전 5pt → 총12pt 승급
  '안치국':  {w:1, s:0, t:0, up:false},  // 리그승점 5 = 우승1(03/27)
  '이미진':  {w:1, s:0, t:0, up:false},  // 리그승점 5 = 우승1(02/27)
  '이상건':  {w:0, s:0, t:2, up:false},  // 리그승점 4 = 3위2(03/13, 03/27)
  '김영서':  {w:0, s:0, t:1, up:false},  // 리그승점 2 = 3위1(02/06)
};

// Q1 리그 날짜별 입상 기록 (승점표 순서 기반 매핑)
const Q1_LEAGUE_PLACEMENTS = {
  '이원호':  [{date:'2026-02-06',r:'w'}],
  '김덕기':  [{date:'2026-01-16',r:'t'},{date:'2026-02-06',r:'w'}],
  '안치국':  [{date:'2026-03-27',r:'w'}],
  '이미진':  [{date:'2026-02-27',r:'w'}],
  '이상건':  [{date:'2026-03-13',r:'t'},{date:'2026-03-27',r:'t'}],
  '김영서':  [{date:'2026-02-06',r:'t'}],
};

// Q1 교류전 입상 성적
const Q1_EXCHANGE_SCORES = {
  '이원호':  {w:0, s:1, t:0},  // 02/10 LG 준우승
  '김덕기':  {w:1, s:0, t:0},  // 03/05 한전 우승
  '이진규':  {w:1, s:1, t:0},  // 03/18 푸르미 준우승 + 04/01 송강 우승
};

let currentRankingTab = 'total';

function switchRankingTab(tab){
  currentRankingTab = tab;
  ['q1','q2','total'].forEach(id=>{
    const btn = document.getElementById('qtab-'+id);
    if(!btn) return;
    const active = tab===id;
    btn.style.fontWeight = active?'700':'400';
    btn.style.color = active?'#e94560':'#888';
    btn.style.borderBottom = active?'2px solid #e94560':'2px solid transparent';
  });
  renderRanking();
}

