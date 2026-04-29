// ==UserScript==
// @name         Mobile Absolute Copy Unlocker 🔓
// @version      9.2
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

    // 4. 작동 확인용 토스트 알림 (아이폰 리퀴드 & 다이내믹 아일랜드 스타일)
    window.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            const toast = document.createElement('div');
            toast.innerHTML = '<span style="margin-right:6px;">🔓</span>복사 방지 해제';
            
            // 초기 스타일 (살짝 작고 위로 붙어있는 상태)
            toast.style.cssText = `
                position: fixed; 
                top: 15px; 
                left: 50%; 
                transform: translateX(-50%) scale(0.8); 
                opacity: 0;
                
                /* 다크 글라스 리퀴드 디자인 */
                background: rgba(10, 10, 10, 0.75); 
                backdrop-filter: blur(15px);
                -webkit-backdrop-filter: blur(15px);
                color: #fff; 
                padding: 8px 18px; 
                border-radius: 50px; /* 완전한 알약 모양 */
                font-size: 13px; 
                font-weight: 500;
                letter-spacing: -0.5px;
                display: flex;
                align-items: center;
                z-index: 2147483647; 
                pointer-events: none; 
                box-shadow: 0 10px 30px rgba(0,0,0,0.3);
                
                /* 쫀득한 애니메이션을 위한 커스텀 베지어 값 */
                transition: all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
            `;
            
            document.body.appendChild(toast);
            
            // 0.1초 뒤 실제 등장 (쫀득하게 커지며 내려옴)
            setTimeout(() => {
                toast.style.opacity = '1';
                toast.style.transform = 'translateX(-50%) scale(1) translateY(10px)';
            }, 100);
            
            // 2초 뒤 퇴장 (다시 위로 쇽 사라짐)
            setTimeout(() => {
                toast.style.opacity = '0';
                toast.style.transform = 'translateX(-50%) scale(0.7) translateY(-5px)';
            }, 2100);

            setTimeout(() => toast.remove(), 2800);
        }, 800);
    });
