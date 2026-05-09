// 간단한 HTML/JS 이스케이프 유틸리티
// 문자열을 HTML/JS 컨텍스트에 안전하게 삽입하도록 도와줍니다.
(function(window){
  // 운영자 체크를 안전한 시점에 바인딩
  // 운영자 목록은 초기 로드 시점에 전역으로 사용됩니다.
  try{
    const ADMINS = ["이미진", "안치국"];
    function isAdmin(userName){ return ADMINS.includes(userName); }
    if(typeof window !== 'undefined' && typeof window.isAdmin !== 'function'){
      window.isAdmin = isAdmin;
    }
  }catch(e){ console.error('safe.js admin bind error', e); }

  function escapeHtml(str){
    if(str==null) return '';
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;').replace(/'/g,"&#39;");
  }
  function jsEscape(str){
    if(str==null) return '';
    return String(str).replace(/\\/g,'\\\\').replace(/'/g,"\\'").replace(/"/g,'\\"');
  }

  // 안전한 JSON 파싱 및 스토리지 접근
  function safeJsonParse(text, fallback){
    if(text==null || text==='') return fallback;
    try{ return JSON.parse(text); }catch(e){ return fallback; }
  }
  function safeStorageGet(key, fallback){
    try{ return safeJsonParse(localStorage.getItem(key), fallback); }catch(e){ return fallback; }
  }
  function safeStorageSet(key, value){
    try{ localStorage.setItem(key, JSON.stringify(value)); return true; }catch(e){ return false; }
  }
  window.escapeHtml = escapeHtml;
  window.jsEscape = jsEscape;
  window.safeJsonParse = safeJsonParse;
  window.safeStorageGet = safeStorageGet;
  window.safeStorageSet = safeStorageSet;
})(window);
