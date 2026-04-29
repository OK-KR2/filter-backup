// ==UserScript==
// @name         Mobile Absolute Copy Unlocker 🔓
// @version      9.4
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

    // 4. iOS 26.4 리퀴드 프리즘 토스트 (Adaptive Glass)
    function showToast() {
        if (document.getElementById('liquid-toast')) return;

        const toast = document.createElement('div');
        toast.id = 'liquid-toast';
        toast.innerHTML = '<span style="margin-right:8px; filter: drop-shadow(0 0 2px rgba(255,255,255,0.5));">🔓</span>복사 해제됨';
        
        toast.style.cssText = `
            position: fixed; 
            top: 25px; 
            left: 50%; 
            transform: translateX(-50%) scale(0.5); 
            opacity: 0;
            
            /* 26.4 핵심: 블랙 제거, 초고투명 리퀴드 글래스 */
            background: rgba(255, 255, 255, 0.1); 
            backdrop-filter: blur(25px) saturate(200%) brightness(1.1);
            -webkit-backdrop-filter: blur(25px) saturate(200%) brightness(1.1);
            
            /* 광택감 있는 프리즘 테두리 */
            border: 0.5px solid rgba(255, 255, 255, 0.4);
            color: #ffffff; 
            text-shadow: 0 0 10px rgba(0,0,0,0.2);
            
            padding: 10px 24px; 
            border-radius: 60px; 
            font-size: 14px; 
            font-weight: 600;
            display: flex;
            align-items: center;
            z-index: 2147483647; 
            pointer-events: none; 
            box-shadow: 0 15px 45px rgba(0,0,0,0.15), inset 0 0 10px rgba(255,255,255,0.2);
            
            /* 26.4 특유의 쫀득한 텐션 애니메이션 */
            transition: all 0.8s cubic-bezier(0.15, 1.3, 0.3, 1);
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateX(-50%) scale(1) translateY(10px)';
        }, 50);
        
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(-50%) scale(0.9) translateY(-10px)';
        }, 2000);

        setTimeout(() => toast.remove(), 2900);
    }

    if (document.readyState === 'loading') {
        window.addEventListener('DOMContentLoaded', showToast);
    } else {
        setTimeout(showToast, 300);
    }

})(); // 마감까지 깔끔하게

