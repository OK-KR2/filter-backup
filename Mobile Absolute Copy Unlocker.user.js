// ==UserScript==
// @name         Mobile Absolute Copy Unlocker 🔓
// @version      9.8
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

    // 4. iOS 26.4 리퀴드 프리즘 토스트 (가독성 보강 버전)
    function showToast() {
        if (document.getElementById('liquid-toast')) return;

        const toast = document.createElement('div');
        toast.id = 'liquid-toast';
        toast.innerHTML = '<span style="margin-right:8px; filter: drop-shadow(0 0 2px rgba(0,0,0,0.3));">🔓</span>복사 해제됨';
        
        toast.style.cssText = `
            position: fixed; 
            top: 25px; 
            left: 50%; 
            transform: translateX(-50%) scale(0.6); 
            opacity: 0;
            
            /* 1. 투명도: 다시 확 낮춰서 맑게 (0.1 수준) */
            background: rgba(255, 255, 255, 0.1); 
            
            /* 2. 가독성 핵심: 배경을 어둡게 하는 대신 '대비'와 '블러'로 승부 */
            backdrop-filter: blur(15px) saturate(180%) brightness(0.92);
            -webkit-backdrop-filter: blur(15px) saturate(180%) brightness(0.92);
            
            /* 3. 흰 배경용 치트키: 아주 연한 검정색 테두리 (이게 형태를 잡아줌) */
            border: 0.5px solid rgba(0, 0, 0, 0.08); 
            box-shadow: 
                0 8px 32px rgba(0, 0, 0, 0.15),      /* 깊이감 주는 그림자 */
                inset 0 0 0 0.5px rgba(255, 255, 255, 0.2); /* 안쪽 광택선 */
            
            color: #ffffff; 
            /* 글자 그림자는 필수: 이게 있어야 흰 배경에서 글자가 읽힘 */
            text-shadow: 0 1px 4px rgba(0,0,0,0.3);
            
            padding: 10px 24px; 
            border-radius: 60px; 
            font-size: 13px; 
            font-weight: 600;
            display: flex;
            align-items: center;
            z-index: 2147483647; 
            pointer-events: none; 
            
            transition: all 0.75s cubic-bezier(0.2, 1.4, 0.3, 1);
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

})(); // 이번엔 진짜 마감까지 확인 완료!