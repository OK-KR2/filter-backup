// ==UserScript==
// @name         Mobile Absolute Copy Unlocker 🔓
// @version      9.1
// @match        *://*/*
// @run-at       document-start
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // 1. 강제 텍스트 선택 CSS 주입 (아이폰 핵심)
    function injectCSS() {
        if (document.getElementById('unlock-copy-css')) return;
        const style = document.createElement('style');
        style.id = 'unlock-copy-css';
        // !important로 네이버가 걸어둔 드래그 방지 스타일을 강제로 짓눌러버림
        style.innerHTML = `
            * {
                -webkit-user-select: text !important;
                -moz-user-select: text !important;
                -ms-user-select: text !important;
                user-select: text !important;
                -webkit-touch-callout: default !important; /* 아이폰 꾹 누르기(돋보기/메뉴) 허용 */
            }
        `;
        (document.head || document.documentElement).appendChild(style);
    }

    // 2. 복사 방지 자바스크립트 이벤트 무력화
    // 사이트가 "복사 안돼! 드래그 안돼!" 라고 소리치는 걸 중간에서 입틀막 해버림
    const blockedEvents = ['contextmenu', 'selectstart', 'dragstart', 'copy', 'cut', 'paste'];
    blockedEvents.forEach(event => {
        document.addEventListener(event, function(e) {
            e.stopPropagation(); // 이벤트 길막 (상위로 못 올라가게)
        }, true); // true(캡처링) : 사이트가 눈치채기 전에 제일 먼저 가로챔
    });

    // 3. 네이버 블로그의 끈질긴 화면 전환 방어 (1초마다 방어막 재생성)
    setInterval(injectCSS, 1000);

    // 4. 작동 확인용 토스트 알림 (거추장스러운 버튼 없이 깔끔하게 떴다 사라짐)
    window.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            const toast = document.createElement('div');
            toast.innerHTML = '🔓 복사 방지 해제!';
            toast.style.cssText = `
                position: fixed; 
                top: 20px; 
                left: 50%; 
                transform: translateX(-50%); 
                background: rgba(40, 200, 80, 0.9); 
                color: white; 
                padding: 10px 20px; 
                border-radius: 20px; 
                font-weight: bold; 
                font-size: 14px; 
                z-index: 2147483647; 
                pointer-events: none; 
                box-shadow: 0 4px 10px rgba(0,0,0,0.2); 
                transition: opacity 0.5s;
            `;
            document.body.appendChild(toast);
            
            // 2초 뒤에 스르륵 사라짐
            setTimeout(() => toast.style.opacity = '0', 2000);
            setTimeout(() => toast.remove(), 2500);
        }, 1000); // 페이지 로딩되고 1초 뒤에 알림 띄움
    });
})();
