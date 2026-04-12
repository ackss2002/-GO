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

// 광범위한 긴급 완화: DOM에 동적으로 삽입된 HTML을 감시하여 인라인 이벤트/스크립트를 제거
(function(){
  function sanitizeElement(el){
    if(!el || el.nodeType!==1) return;
    // 제거 대상 태그
    const forbidden = ['script','iframe','object','embed'];
    if(forbidden.includes(el.tagName.toLowerCase())){
      el.remove();
      return;
    }
    // 속성 필터링: on* 이벤트, javascript: 링크
    const attrs = Array.from(el.attributes||[]);
    attrs.forEach(a=>{
      const name = a.name.toLowerCase();
      const val = (a.value||'').toLowerCase();
      if(name.startsWith('on')){
        el.removeAttribute(a.name);
      } else if((name==='href' || name==='src' || name==='xlink:href') && val.startsWith('javascript:')){
        el.removeAttribute(a.name);
      }
    });
    // 재귀적으로 자식 소독
    Array.from(el.children||[]).forEach(sanitizeElement);
  }

  const mo = new MutationObserver(function(records){
    records.forEach(r=>{
      if(r.addedNodes && r.addedNodes.length){
        r.addedNodes.forEach(n=>{
          if(n.nodeType===1) sanitizeElement(n);
        });
      }
      if(r.type==='attributes' && r.target){
        sanitizeElement(r.target);
      }
    });
  });

  try{
    mo.observe(document.documentElement || document.body, {childList:true,subtree:true,attributes:true});
  }catch(e){
    // 문서가 아직 준비되지 않은 경우 DOMContentLoaded 이후 시작
    document.addEventListener('DOMContentLoaded', ()=>{
      mo.disconnect();
      mo.observe(document.documentElement || document.body, {childList:true,subtree:true,attributes:true});
    });
  }
})();
