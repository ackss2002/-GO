// PIN은 소스코드에 저장하지 않음 — Firebase DB에 해시로 저장
let isAdmin = false;

// SHA-256 해시 생성 (Web Crypto API)
async function hashPin(pin){
  const encoded = new TextEncoder().encode(pin);
  const buf = await crypto.subtle.digest('SHA-256', encoded);
  return Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,'0')).join('');
}

function toggleAdmin(){
  if(isAdmin){
    // 관리자 모드 해제
    isAdmin = false;
    window.isAdmin = false;
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

  if(!window.db){
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
      isAdmin = true;
      window.isAdmin = true;
      document.getElementById('pin-overlay').style.display = 'none';
      updateAdminUI();
      alert('✅ 관리자 PIN이 설정되었습니다.\n앞으로 이 PIN으로 로그인하세요.');
      return;
    }

    if(inputHash === storedHash){
      isAdmin = true;
      window.isAdmin = true;
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
  isAdmin = false;
  updateAdminUI();
}

function updateAdminUI(){
  const adminBadge = document.getElementById('admin-badge');
  const lockBtn = document.getElementById('lock-btn');
  adminBadge.style.display = isAdmin?'inline':'none';
  lockBtn.textContent = isAdmin?'🔓':'🔒';
  const adminBtns = document.querySelectorAll('.admin-only');
  adminBtns.forEach(btn=>{ btn.style.display = isAdmin ? 'inline-flex' : 'none'; });
  // 선수 칩 상태 업데이트
  renderLeague();
}

function showLockMsg(msg){
  alert(msg || '운영자 모드에서만 수정할 수 있습니다.\n🔒 버튼을 클릭하여 PIN을 입력하세요.');
}


const Q1_SCORES = {
  '이원호':  {w:2, s:0, t:0, pts:13, up:true},  // 13점 달성 → 4부 승급
  '김덕기':  {w:1, s:0, t:1, pts:12, up:true},  // 12점 달성 → 4부 승급
  '안치국':  {w:1, s:0, t:1, pts:7,  up:false},
  '이미진':  {w:1, s:0, t:0, pts:5,  up:false},
  '최양님':  {w:1, s:0, t:0, pts:5,  up:false},
  '이상건':  {w:0, s:0, t:2, pts:4,  up:false},
  '이진규':  {w:0, s:1, t:1, pts:5,  up:false},
  '김영서':  {w:0, s:0, t:1, pts:2,  up:false},
};

let currentQuarter = 1;

function switchQuarter(q){
  currentQuarter = q;
  // 탭 스타일
  ['1','2','all'].forEach(id=>{
    const btn = document.getElementById('qtab-'+id);
    if(!btn) return;
    const active = String(q)===String(id);
    btn.style.fontWeight = active?'700':'400';
    btn.style.color = active?'#e94560':'#888';
    btn.style.borderBottom = active?'2px solid #e94560':'2px solid transparent';
  });
  renderRanking();
}

