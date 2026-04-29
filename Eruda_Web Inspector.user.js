// ==UserScript==
// @name         Mobile DevTools (Only Copy Button)
// @version      3.0
// @match        *://*/*
// @run-at       document-start
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // 소스 복사 핵심 기능
    function copySource() {
        const htmlContent = document.documentElement.outerHTML;
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(htmlContent)
                .then(() => alert('✅ 전체 소스가 복사되었습니다!'))
                .catch(() => fallbackCopy(htmlContent));
        } else {
            fallbackCopy(htmlContent);
        }
    }

    function fallbackCopy(text) {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed"; ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        try {
            document.execCommand('copy');
            alert('✅ 전체 소스가 복사되었습니다! (구형 방식)');
        } catch (err) {
            alert('❌ 복사 실패: ' + err);
        }
        document.body.removeChild(ta);
    }

    // 파란색 플로팅 버튼 생성
    function createZombieButton() {
        // 이미 버튼이 있으면 패스 (중복 생성 방지)
        if (document.getElementById('zombie-copy-btn')) return;
        
        // body가 아직 로딩 안 됐으면 대기
        if (!document.body && !document.documentElement) return;

        const btn = document.createElement('button');
        btn.id = 'zombie-copy-btn';
        btn.innerHTML = '📄<br>소스<br>복사';
        btn.style.cssText = `
            position: fixed !important;
            bottom: 30px !important;
            right: 20px !important;
            width: 65px !important;
            height: 65px !important;
            background-color: #007AFF !important;
            color: white !important;
            border: none !important;
            border-radius: 50% !important;
            font-size: 14px !important;
            font-weight: bold !important;
            box-shadow: 0 4px 10px rgba(0,0,0,0.4) !important;
            z-index: 2147483647 !important; /* 무조건 최상위 */
            cursor: pointer !important;
            line-height: 1.3 !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: center !important;
            align-items: center !important;
        `;
        
        // 터치 및 클릭 이벤트 모두 대응 (아이폰 씹힘 방지)
        btn.addEventListener('click', copySource);
        btn.addEventListener('touchend', (e) => {
            e.preventDefault(); // 기본 터치 동작 막고
            copySource();       // 바로 복사 실행
        });

        // 네이버가 화면을 갈아치워도 살아남게 최상위 노드에 붙임
        const targetElement = document.body || document.documentElement;
        targetElement.appendChild(btn);
    }

    // 0.5초마다 네이버가 버튼을 지웠는지 감시하고, 지웠으면 즉시 부활시킴
    setInterval(createZombieButton, 500);

})();
