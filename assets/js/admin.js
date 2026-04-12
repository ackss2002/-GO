// ADMIN PIN intentionally left blank for security. Do not hardcode sensitive PINs in client-side code.
// For production, use server-side authentication (Firebase Auth / Cloud Functions).
const ADMIN_PIN = '';
if(!ADMIN_PIN) console.warn('ADMIN_PIN is not set. Admin actions require proper server-side auth.');
let isAdmin = false;

function toggleAdmin(){
  if(isAdmin){
    // 로그아웃(관리자 모드 해제)
    isAdmin = false;
    updateAdminUI();
    return;
  }
  // Firebase Auth가 있으면 로그인 흐름으로 위임
  if(window.signIn){
    window.signIn();
    return;
  }
  // 폴백: 기존 PIN 오버레이 표시
  document.getElementById('pin-overlay').style.display='flex';
  document.getElementById('pin-input').value='';
  document.getElementById('pin-error').style.display='none';
  setTimeout(()=>document.getElementById('pin-input').focus(), 100);
}

function checkPin(){
  const val = document.getElementById('pin-input').value;
  if(!ADMIN_PIN){
    // PIN not configured — inform operator and close overlay
    alert('관리자 PIN이 설정되어 있지 않습니다. 운영자 기능은 서버 인증으로 대체하세요.');
    document.getElementById('pin-overlay').style.display='none';
    return;
  }
  if(val === ADMIN_PIN){
    isAdmin = true;
    document.getElementById('pin-overlay').style.display='none';
    updateAdminUI();
  } else if(val.length===4){
    document.getElementById('pin-error').style.display='block';
    document.getElementById('pin-input').value='';
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

