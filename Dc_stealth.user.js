// ==UserScript==
// @name         DC Stealth
// @version      5.1
// @description  디시인사이드 광고 차단 및 429 차단 방지 (에러 해결형)
// @match        *://*.dcinside.com/*
// @run-at       document-start
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    const lock = (p, v) => {
        try { Object.defineProperty(window, p, { value: v, writable: false, configurable: false }); } catch (e) {}
    };

    // [에러 방어] 콘솔 충돌을 일으키는 함수 미리 주입
    if (typeof window.getCookie === 'undefined') {
        window.getCookie = function() { return ''; };
    }
    if (typeof window.setCookie_hk_hour === 'undefined') {
        window.setCookie_hk_hour = function() {};
    }

    const laundryDC = () => {
        localStorage.removeItem('adblock_detected');
        localStorage.removeItem('find_ab');
        localStorage.removeItem('find_ab_check');
        if (document.cookie.includes('find_ab=ok')) {
            document.cookie = "find_ab=no; expires=Thu, 01 Jan 2030 00:00:00 UTC; path=/; domain=.dcinside.com";
        }
    };

    laundryDC();

    try {
        lock('is_adblock', false); 
        lock('adblock_chk', false); 
        lock('canRunAds', true); 
        lock('is_ad_block', 'N');
    } catch (e) {}

    // 오프스크린 기법: 광고를 투명하게 만들어 화면 밖(-9999px)으로 유기
    const style = document.createElement('style');
    style.textContent = `
        #moveOverlay, #moveimg, .adv-group, .adv-groupin, .adv-grouptop, .pwlink,
        .penalty-box, .pp-box:has(.penalty-box), div[id*="ad_middle"], iframe[src*="netinsight"] {
            position: absolute !important; 
            left: -9999px !important; 
            top: -9999px !important;
            width: 1px !important; 
            height: 1px !important; 
            overflow: hidden !important; 
            opacity: 0 !important; 
            pointer-events: none !important;
        }
    `;
    (document.head || document.documentElement).appendChild(style);

    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
        const url = typeof args[0] === 'string' ? args[0] : args[0]?.url;
        if (url && (url.includes('ajax/naverad') || url.includes('naverad'))) {
            return new Response(JSON.stringify({ ads: [] }), { status: 200 });
        }
        return originalFetch.apply(window, args);
    };

    setInterval(laundryDC, 800);
})();
