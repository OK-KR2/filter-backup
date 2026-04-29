// ==UserScript==
// @name         Mobile Absolute Copy Unlocker 🔓 (YouTube 우회 버전)
// @version      9.9
// @match        *://*/*
// @run-at       document-start
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // 1. 강제 텍스트 선택 CSS 주입 (innerHTML 대신 textContent 사용!)
    function injectCSS() {
        if (document.getElementById('unlock-copy-css')) return;
        const style = document.createElement('style');
        style.id = 'unlock-copy-css';
        // 유튜브 CSP(보안) 우회를 위해 innerHTML 대신 textContent로 텍스트만 안전하게 주입
        style.textContent = `
            * {
                -webkit-user-select: text !important;
                -moz-user-select: text !important;
                -ms-user-select: text !important;
                user-select: text !important;
                -webkit-touch-callout: default !important;
            }
        `;
        (document.head || document.documentElement).appendChild(style);
    }

    // 2. 복사 방지 자바스크립트 이벤트 무력화 (이건 문제없음)
    const blockedEvents = ['contextmenu', 'selectstart', 'dragstart', 'copy', 'cut', 'paste'];
    blockedEvents.forEach(event => {
        document.addEventListener(event, function(e) {
            e.stopPropagation();
        }, true);
    });

    // 3. 네이버 등 방어막 재생성 무력화
    setInterval(injectCSS, 1000);

    // 4. iOS 리퀴드 토스트 (innerHTML 원천 제거 후 순수 조립)
    function showToast() {
        if (document.getElementById('liquid-toast')) return;
        if (!document.body) return; // body가 아직 없으면 대기

        const toast = document.createElement('div');
        toast.id = 'liquid-toast';
        
        // 아이콘 조립
        const iconSpan = document.createElement('span');
        iconSpan.textContent = '🔓';
        iconSpan.style.cssText = 'margin-right:8px; filter: drop-shadow(0 0 2px rgba(0,0,0,0.3));';
        
        // 텍스트 조립
        const textNode = document.createTextNode('복사 해제됨');
        
        // 태그에 합체 (innerHTML 없이 조립 완료)
        toast.appendChild(iconSpan);
        toast.appendChild(textNode);
        
        toast.style.cssText = `
            position: fixed; 
            top: 25px; 
            left: 50%; 
            transform: translateX(-50%) scale(0.6); 
            opacity: 0;
            background: rgba(255, 255, 255, 0.1); 
            backdrop-filter: blur(15px) saturate(180%) brightness(0.92);
            -webkit-backdrop-filter: blur(15px) saturate(180%) brightness(0.92);
            border: 0.5px solid rgba(0, 0, 0, 0.08); 
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15), inset 0 0 0 0.5px rgba(255, 255, 255, 0.2); 
            color: #ffffff; 
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
            if(toast) {
                toast.style.opacity = '1';
                toast.style.transform = 'translateX(-50%) scale(1) translateY(10px)';
            }
        }, 50);
        
        setTimeout(() => {
            if(toast) {
                toast.style.opacity = '0';
                toast.style.transform = 'translateX(-50%) scale(0.9) translateY(-10px)';
            }
        }, 2000);

        setTimeout(() => { if(toast) toast.remove(); }, 2900);
    }

    // 유튜브는 페이지 로딩이 비동기라 body가 늦게 뜰 수 있어서 감시
    if (document.readyState === 'loading') {
        window.addEventListener('DOMContentLoaded', showToast);
    } else {
        setTimeout(showToast, 300);
    }

})();
