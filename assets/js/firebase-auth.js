// Firebase Auth (Google Sign-in 미사용) — PIN 인증 방식으로 대체됨
// admin.js의 toggleAdmin() / checkPin() 으로 관리자 인증 처리
(function(){
  window.currentUser = null;
  window.isAdmin = false;
  // signIn/signOut stub: admin.js의 toggleAdmin()이 직접 처리하므로 불필요
  window.signIn = null;
  window.signOut = null;
})();
