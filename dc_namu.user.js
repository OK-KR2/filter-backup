// ==UserScript==
// @name         DC & Namu Combined Stealth
// @version      4.7.2
// @description  나무위키+디시 (v4.7.1 안정성 유지 + 아이폰 배터리/성능 최적화)
// @match        *://*.dcinside.com/*
// @match        *://*.namu.wiki/*
// @run-at       document-start
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    const lock = (p, v) => {
        try { Object.defineProperty(window, p, { value: v, writable: false, configurable: false }); } catch (e) {}
    };

    const collapseNode = (node) => {
        if (!node || node.id === 'app' || node.id === 'eruda' || node.tagName === 'BODY') return;
        node.style.setProperty('display', 'none', 'important');
        node.style.setProperty('height', '0', 'important');
        node.style.setProperty('margin', '0', 'important');
    };

    /* PART 1: 디시인사이드 (마이크로 세척 및 유배 작전) */
    if (location.hostname.includes('dcinside.com')) {
        const laundryDC = () => {
            localStorage.removeItem('adblock_detected');
            localStorage.removeItem('find_ab');
            localStorage.removeItem('find_ab_check'); 
            if (document.cookie.includes('find_ab=ok')) {
                document.cookie = "find_ab=no; expires=Thu, 01 Jan 2030 00:00:00 UTC; path=/; domain=.dcinside.com";
            }
        };
        
        // 초기 로딩 시 즉각 실행
        laundryDC();
        lock('is_adblock', false); lock('adblock_chk', false); lock('canRunAds', true); lock('is_ad_block', 'N');

        const style = document.createElement('style');
        style.textContent = `
            #moveOverlay, #moveimg, .adv-group, .adv-groupin, .adv-grouptop, .pwlink, 
            .pp-box:has(.penalty-box), div[id*="ad_middle"], iframe[src*="netinsight"] {
                display: none !important; height: 0px !important; margin: 0px !important;
                visibility: hidden !important; opacity: 0 !important; pointer-events: none !important;
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
        
        // 무한 반복 대신 브라우저가 한가할 때만 세척 (배터리/성능 절약)
        setInterval(() => requestAnimationFrame(laundryDC), 1000);
    }

    /* PART 2: 나무위키 (v4.3 성공 로직) */
    if (location.hostname.includes('namu.wiki')) {
        const style = document.createElement('style');
        style.textContent = `[data-v-aed07d7a], .veta_ad_wrapper, .gn4Z21wj, .VBwhMBUe, ._3Dy97h7l, div:has(> a[href*="adcr.naver.com"]), div[style*="#fffff6"], iframe[src*="doubleclick.net"] { display: none !important; height: 0px !important; margin: 0px !important; opacity: 0 !important; pointer-events: none !important; }`;
        (document.head || document.documentElement).appendChild(style);

        const mockAd = { loadAd: () => {}, init: () => {}, getAds: () => [], setTargeting: () => {}, display: () => {}, enableServices: () => {}, pubads: () => mockAd, addService: () => mockAd };
        window.veta = window.veta || mockAd;
        window.googletag = window.googletag || mockAd;
        window.ad_block_detected = false;
        window.canRunAds = true;

        // MutationObserver 최적화 (중복 실행 방지용 디바운싱)
        let cleanupTimeout;
        const namuCleaner = () => {
            document.querySelectorAll('div, section').forEach(el => {
                if (el.hasAttribute('data-v-aed07d7a') || el.innerText === "파워링크" || el.querySelector('a[href*="adcr.naver.com"]')) {
                    const target = el.closest('div[class*="_"]') || el;
                    if (target && target.id !== 'app' && target.id !== 'eruda') {
                        collapseNode(target);
                        if (target.parentNode) target.remove(); 
                    }
                }
            });
        };
        
        new MutationObserver(() => {
            clearTimeout(cleanupTimeout);
            cleanupTimeout = setTimeout(namuCleaner, 50); // DOM 변화가 멈추면 한 번만 실행
        }).observe(document.documentElement, { childList: true, subtree: true });
        
        // SPA 내부 이동 대응용 가벼운 인터벌
        setInterval(() => requestAnimationFrame(namuCleaner), 1000);
    }
})();
