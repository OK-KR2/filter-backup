// ==UserScript==
// @name         Mobile DevTools (Source Copy Only) - iOS Safe
// @version      7.0
// @match        *://*/*
// @run-at       document-idle
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // 소스 복사 기능
    function copySource() {
        const htmlContent = document.documentElement.outerHTML;
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(htmlContent)
                .then(() => alert('✅ 전체 소스 복사 완료!'))
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
            alert('✅ 전체 소스 복사 완료! (구형)');
        } catch (err) {
            alert('❌ 복사 실패');
        }
        document.body.removeChild(ta);
    }

    // 세련된 애플 스타일 플로팅 버튼 생성
    function createButton() {
        if (document.getElementById('ios-safe-copy-btn')) return;
        if (!document.body) return;

        const btnContainer = document.createElement('div');
        btnContainer.id = 'ios-safe-copy-btn';
        
        // 아이폰 순정 앱 느낌의 반투명 블러 디자인 + 심플한 복사 아이콘(SVG)
        btnContainer.innerHTML = `
            <div style="
                position: fixed;
                bottom: 25px;
                right: 25px;
                width: 55px;
                height: 55px;
                background: rgba(0, 122, 255, 0.85);
                backdrop-filter: blur(10px);
                -webkit-backdrop-filter: blur(10px);
                color: white;
                border-radius: 50%;
                box-shadow: 0 8px 20px rgba(0, 122, 255, 0.3);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 2147483647;
                cursor: pointer;
                transition: transform 0.1s ease;
            ">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
            </div>
        `;
        
        const actualBtn = btnContainer.firstElementChild;
        
        // 아이폰 터치 씹힘 방지 및 클릭 애니메이션
        actualBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            actualBtn.style.transform = 'scale(0.85)';
            setTimeout(() => {
                actualBtn.style.transform = 'scale(1)';
                copySource();
            }, 150);
        }, { passive: false });

        actualBtn.addEventListener('click', (e) => {
            e.preventDefault();
            copySource();
        });

        document.body.appendChild(btnContainer);
    }

    // 네이버 SPA 화면 전환 완벽 방어 (1초마다 무한 부활)
    setInterval(createButton, 1000);
})();
