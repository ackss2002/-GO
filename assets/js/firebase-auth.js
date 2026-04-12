// Firebase Auth client scaffold: Google sign-in + admin UID check
(function(){
  if(typeof firebase === 'undefined' || !firebase.auth){
    console.warn('Firebase Auth SDK not loaded.');
    return;
  }
  const auth = firebase.auth();

  // Sign in with Google popup
  window.signIn = function(){
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider).catch(err=>{
      console.error('Sign-in error', err);
      alert('로그인 실패: ' + (err && err.message ? err.message : err));
    });
  };

  window.signOut = function(){
    auth.signOut().catch(err=>console.error('Sign-out failed',err));
  };

  function createAuthControls(){
    const lockBtn = document.getElementById('lock-btn');
    if(!lockBtn || lockBtn.parentNode.querySelector('#auth-btn')) return;
    const authBtn = document.createElement('button');
    authBtn.id = 'auth-btn';
    authBtn.style.cssText = 'margin-left:8px;padding:6px 10px;border-radius:8px;border:1px solid #ddd;background:white;cursor:pointer;font-size:13px;';
    authBtn.onclick = ()=>{ if(window.currentUser) window.signOut(); else window.signIn(); };
    lockBtn.parentNode.insertBefore(authBtn, lockBtn.nextSibling);
  }

  function updateAuthUI(user, adminFlag){
    const authBtn = document.getElementById('auth-btn');
    const adminBadge = document.getElementById('admin-badge');
    if(authBtn){
      authBtn.textContent = user ? ('Sign out (' + (user.displayName||user.email||'user') + ')') : 'Sign in';
    }
    if(adminBadge){
      adminBadge.style.display = adminFlag ? 'inline' : 'none';
    }
    const adminBtns = document.querySelectorAll('.admin-only');
    adminBtns.forEach(btn=>{ btn.style.display = adminFlag ? 'inline-flex' : 'none'; });
    const lockBtn = document.getElementById('lock-btn');
    if(lockBtn) lockBtn.textContent = adminFlag ? '🔓' : '🔒';
  }

  async function checkAdmin(uid){
    try{
      if(!window.db) return false;
      const snap = await db.ref('admins/' + uid).once('value');
      return !!snap.val();
    }catch(e){
      console.error('admin lookup failed', e);
      return false;
    }
  }

  auth.onAuthStateChanged(async user => {
    window.currentUser = user;
    if(user){
      const isAdminFlag = await checkAdmin(user.uid);
      // set global isAdmin used by admin.js
      window.isAdmin = !!isAdminFlag;
      updateAuthUI(user, window.isAdmin);
      if(typeof updateAdminUI === 'function') updateAdminUI();
    } else {
      window.isAdmin = false;
      updateAuthUI(null, false);
      if(typeof updateAdminUI === 'function') updateAdminUI();
    }
  });

  document.addEventListener('DOMContentLoaded', createAuthControls);
})();
