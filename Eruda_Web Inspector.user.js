// ==UserScript==
// @name        Mobile DevTools (Eruda) + Copy HTML
// @match       *://*/*
// @grant       none
// ==/UserScript==

(function () {
    // 1. 기존 Eruda 로드
    var script = document.createElement('script');
    script.src = "//cdn.jsdelivr.net/npm/eruda"; 
    document.body.appendChild(script);
    script.onload = function () {
        eruda.init();
    };

    // 2. 화면에 떠있는 복사 버튼 만들기
    var copyBtn = document.createElement('button');
    copyBtn.innerText = '전체 소스 복사';
    // 버튼 디자인 및 위치 (화면 왼쪽 아래)
    copyBtn.style.cssText = 'position:fixed; bottom:20px; left:20px; z-index:999999; padding:10px 15px; background:#007AFF; color:white; border:none; border-radius:8px; font-weight:bold; box-shadow: 0 4px 6px rgba(0,0,0,0.3); cursor:pointer; font-size:14px;';
    
    // 3. 버튼 클릭 시 복사 기능 실행
    copyBtn.onclick = function() {
        var htmlContent = document.documentElement.outerHTML;
        
        // 최신 클립보드 API 시도
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(htmlContent).then(function() {
                alert('전체 HTML 소스가 복사되었습니다!');
            }).catch(function(err) {
                fallbackCopyTextToClipboard(htmlContent);
            });
        } else {
            // 클립보드 API를 지원하지 않는 환경일 경우
            fallbackCopyTextToClipboard(htmlContent);
        }
    };

    // 구형 브라우저/사파리 호환성을 위한 복사 보조 함수
    function fallbackCopyTextToClipboard(text) {
        var textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.top = "0";
        textArea.style.left = "0";
        textArea.style.position = "fixed";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        try {
            var successful = document.execCommand('copy');
            var msg = successful ? '성공' : '실패';
            if(successful) alert('전체 HTML 소스가 복사되었습니다!');
            else alert('복사 실패. 콘솔을 확인해주세요.');
        } catch (err) {
            alert('복사 권한이 없습니다.');
        }
        document.body.removeChild(textArea);
    }

    // 버튼을 화면에 추가
    document.body.appendChild(copyBtn);
})();
