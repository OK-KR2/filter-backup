// ==UserScript==
// @name        Mobile DevTools (Eruda)
// @match       *://*/*
// @grant       none
// ==/UserScript==

(function () {
    // 1. 기존 Eruda 로드 (이게 맨 아래 투명 버튼으로 나옵니다)
    var script = document.createElement('script');
    script.src = "//cdn.jsdelivr.net/npm/eruda"; 
    document.body.appendChild(script);
    script.onload = function () {
        eruda.init();
    };

    // 2. 복사 전용 톱니바퀴 버튼 (딱 1개만 추가)
    var copyBtn = document.createElement('button');
    copyBtn.innerText = '⚙️'; 
    
    // Eruda 기본 버튼과 똑같은 반투명 스타일 적용 (기존 버튼 위쪽에 배치)
    copyBtn.style.cssText = 'position:fixed; bottom:70px; right:20px; z-index:999999; width:40px; height:40px; background:rgba(0, 0, 0, 0.2); color:#fff; border:none; border-radius:50%; font-size:24px; line-height:40px; text-align:center; cursor:pointer; padding:0; margin:0; backdrop-filter:blur(2px);';
    
    // 3. 버튼 클릭 시 소스 복사 기능 실행
    copyBtn.onclick = function() {
        var htmlContent = document.documentElement.outerHTML;
        
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(htmlContent).then(function() {
                alert('전체 HTML 소스가 복사되었습니다!');
            }).catch(function(err) {
                fallbackCopyTextToClipboard(htmlContent);
            });
        } else {
            fallbackCopyTextToClipboard(htmlContent);
        }
    };

    // 구형 브라우저/사파리 호환성을 위한 복사 보조 함수
    function fallbackCopyTextToClipboard(text) {
        var textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.cssText = "top:0; left:0; position:fixed; width:1px; height:1px; opacity:0;";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        try {
            var successful = document.execCommand('copy');
            if(successful) alert('전체 HTML 소스가 복사되었습니다!');
            else alert('복사 실패.');
        } catch (err) {
            alert('복사 권한이 없습니다.');
        }
        document.body.removeChild(textArea);
    }

    // 버튼을 화면에 추가
    document.body.appendChild(copyBtn);
})();
