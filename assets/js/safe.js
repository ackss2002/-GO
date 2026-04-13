// 간단한 HTML/JS 이스케이프 유틸리티
// 문자열을 HTML/JS 컨텍스트에 안전하게 삽입하도록 도와줍니다.
(function(window){
  function escapeHtml(str){
    if(str==null) return '';
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;').replace(/'/g,"&#39;");
  }
  function jsEscape(str){
    if(str==null) return '';
    return String(str).replace(/\\/g,'\\\\').replace(/'/g,"\\'").replace(/"/g,'\\"');
  }
  window.escapeHtml = escapeHtml;
  window.jsEscape = jsEscape;
})(window);
