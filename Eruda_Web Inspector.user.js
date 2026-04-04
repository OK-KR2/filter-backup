// ==UserScript==
// @name        Mobile DevTools (Eruda) + Stacked Gear UI
// @match       *://*/*
// @grant       none
// ==/UserScript==

(function () {
    // 1. Eruda 로드 (단, Eruda의 기본 native 버튼은 CSS로 숨겨버립니다.)
    var style = document.createElement('style');
    style.innerHTML = '.eruda-entry { display: none !important; }'; // Eruda 기본 버튼 숨김
    document.head.appendChild(style);

    var script = document.createElement('script');
    script.src = "//cdn.jsdelivr.net/npm/eruda"; 
    document.body.appendChild(script);
    script.onload = function () {
        eruda.init();
    };

    // 공통 버튼 스타일 (Eruda 디자인과 동일)
    var baseBtnStyle = 'width:40px; height:40px; background:#444; color:#aaa; border:none; border-radius:50%; font-size:24px; text-align:center; line-height:40px; box-shadow: 0 4px 6px rgba(0,0,0,0.5); cursor:pointer; font-weight:lighter; opacity: 0.9; padding:0; margin:0; position:fixed; right:20px; z-index:999999;';

    // 2. Eruda 열기 버튼 (기존 기능)
    var openErudaBtn = document.createElement('button');
    openErudaBtn.innerText = '⚙️'; // 설정 톱니
    openErudaBtn.style.cssText = baseBtnStyle + ' bottom: 80px;'; // 위치 수정
    
    openErudaBtn.onclick = function() {
        if (eruda) eruda.show();
    };

    // 3. '복사 전용' 톱니바퀴 버튼 (새 기능)
    var copySourceBtn = document.createElement('button');
    copySourceBtn.innerText = '⚙️'; // (똑같은 아이콘을 사용)
    copySourceBtn.style.cssText = baseBtnStyle + ' bottom: 20px;'; // open 버튼 위에 배치
    
    copySourceBtn.onclick = function() {
        var htmlContent = document.documentElement.outerHTML;
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(htmlContent).then(function() {
                alert('전체 HTML 소스가 복사되었습니다!');
            }).catch(function(err) { fallbackCopyTextToClipboard(htmlContent); });
        } else { fallbackCopyTextToClipboard(htmlContent); }
    };

    // 복사 보조 함수 (동일)
    function fallbackCopyTextToClipboard(text) {
        var textArea = document.createElement("textarea"); textArea.value = text; textArea.style.cssText = "top:0; left:0; position:fixed; width:1px; height:1px; opacity:0;";
        document.body.appendChild(textArea); textArea.focus(); textArea.select();
        try { document.execCommand('copy'); alert('전체 HTML 소스가 복사되었습니다!'); }
        catch (err) { alert('복사 실패.'); } document.body.removeChild(textArea);
    }

    // 두 버튼을 화면에 추가
    document.body.appendChild(openErudaBtn);
    document.body.appendChild(copySourceBtn);
})();
