// ==UserScript==
// @name         Mobile Absolute Copy Unlocker 🔓
// @version      9.5
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

    // 4. iOS 26.4 리퀴드 프리즘 (어떤 배경에서도 가독성 쩌는 버전)
    function showToast() {
        if (document.getElementById('liquid-toast')) return;

        const toast = document.createElement('div');
        toast.id = 'liquid-toast';
        toast.innerHTML = '<span style="margin-right:8px; filter: drop-shadow(0 0 2px rgba(255,255,255,0.4));">🔓</span>복사 해제';
        
        toast.style.cssText = `
            position: fixed; 
            top: 25px; 
            left: 50%; 
            transform: translateX(-50%) scale(0.6); 
            opacity: 0;
            
            /* 핵심: 배경이 흰색일 때를 대비해 brightness를 0.8로 낮춤 (유리 뒤가 살짝 어두워짐) */
            background: rgba(255, 255, 255, 0.05); 
            backdrop-filter: blur(25px) saturate(200%) brightness(0.85) contrast(1.1);
            -webkit-backdrop-filter: blur(25px) saturate(200%) brightness(0.85) contrast(1.1);
            
            /* 테두리에 아주 미세한 어두운 선을 섞어서 흰 배경에서 경계선 확보 */
            border: 0.5px solid rgba(0, 0, 0, 0.15);
            outline: 0.5px solid rgba(255, 255, 255, 0.2); /* 이중 테두리로 입체감 극대화 */
            
            color: #ffffff; 
            /* 글자 뒤에 미세한 그림자를 깔아서 흰 배경에서도 글자가 읽히게 함 */
            text-shadow: 0 1px 4px rgba(0,0,0,0.4);
            
            padding: 9px 22px; 
            border-radius: 60px; 
            font-size: 13px; 
            font-weight: 600;
            display: flex;
            align-items: center;
            z-index: 2147483647; 
            pointer-events: none; 
            
            /* 그림자를 더 깊고 부드럽게 깔아서 공중 부양 느낌 강화 */
            box-shadow: 0 12px 40px rgba(0,0,0,0.25), inset 0 0 15px rgba(255,255,255,0.05);
            
            transition: all 0.75s cubic-bezier(0.2, 1.4, 0.3, 1);
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateX(-50%) scale(1) translateY(12px)';
        }, 50);
        
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(-50%) scale(0.8) translateY(-5px)';
        }, 2200);

        setTimeout(() => toast.remove(), 3000);
    }

})(); // 마감까지 깔끔하게
