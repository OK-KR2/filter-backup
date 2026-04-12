// ==UserScript==
// @name         DC & Namu Combined Stealth
// @version      4.9.7
// @description  디시(와이파이 안정화 + 하얀화면 유지) + 나무위키(v4.9.6 완전 고정)
// @match        *://*.dcinside.com/*
// @match        *://*.namu.wiki/*
// @run-at       document-start
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    /* --------------------------------------------------
       [공통 유틸리티]
    -------------------------------------------------- */
    const lock = (p, v) => {
        try { Object.defineProperty(window, p, { value: v, writable: false, configurable: false }); } catch (e) {}
    };

    const collapseNode = (node) => {
        if (!node || node.id === 'app' || node.id === 'eruda' || node.tagName === 'BODY') return;
        node.style.setProperty('display', 'none', 'important');
        node.style.setProperty('height', '0', 'important');
        node.style.setProperty('margin', '0', 'important');
        node.style.setProperty('padding', '0', 'important');
        node.setAttribute('data-blocked-by-stealth', 'true');
    };

    /* --------------------------------------------------
       PART 1: 디시인사이드 (와이파이 안정화 및 스텔스)
    -------------------------------------------------- */
    if (location.hostname.includes('dcinside.com')) {
        
        // 1. 브라우저 시스템 변조 없이 조용히 기존 낙인만 세척합니다.
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

        // 2. [안전 압착] display: none 체크를 회피하기 위해 크기만 0으로 줄입니다.
        // 차단 시에도 깔끔하게 하얀 화면이 유지되도록 패널티 박스까지 포함했습니다.
        const style = document.createElement('style');
        style.textContent = `
            #moveOverlay, #moveimg, .adv-group, .adv-groupin, .adv-grouptop, .pwlink,
            .penalty-box, .pp-box:has(.penalty-box), div[id*="ad_middle"], iframe[src*="netinsight"] {
                height: 0px !important; min-height: 0px !important; margin: 0px !important; padding: 0px !important;
                border: 0px !important; overflow: hidden !important; visibility: hidden !important; opacity: 0 !important;
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
    }

    /* --------------------------------------------------
       PART 2: 나무위키 (사용자 제공 v4.9.6 엔진 완전 고정)
    -------------------------------------------------- */
    if (location.hostname.includes('namu.wiki')) {
        
        const style = document.createElement('style');
        style.textContent = `
            [data-v-aed07d7a], .veta_ad_wrapper, .gn4Z21wj, .VBwhMBUe, ._3Dy97h7l,
            div[class*="vKJY7-f5"], div[class*="HJeR5GcT"], 
            div:has(> a[href*="adcr.naver.com"]), div[style*="#fffff6"],
            iframe[src*="doubleclick.net"] {
                display: none !important; height: 0px !important; margin: 0px !important; padding: 0px !important; opacity: 0 !important;
            }
        `;
        (document.head || document.documentElement).appendChild(style);

        const mockAd = { loadAd: () => {}, init: () => {}, getAds: () => [], setTargeting: () => {}, display: () => {}, enableServices: () => {}, pubads: () => mockAd, addService: () => mockAd };
        window.veta = window.veta || mockAd;
        window.googletag = window.googletag || mockAd;
        window.ad_block_detected = false;
        window.canRunAds = true;

        const namuCleaner = () => {
            document.querySelectorAll('div, section').forEach(el => {
                if (el.hasAttribute('data-v-aed07d7a') || el.innerText === "파워링크" || el.querySelector('a[href*="adcr.naver.com"]')) {
                    const target = el.closest('div[class*="vKJY7-f5"]') || el.closest('div[class*="_"]') || el;
                    if (target && target.id !== 'app' && target.id !== 'eruda') {
                        collapseNode(target);
                        if (target.parentNode) target.remove();
                    }
                }
            });
        };

        new MutationObserver(namuCleaner).observe(document.documentElement, { childList: true, subtree: true });
        let fastClean = setInterval(namuCleaner, 50);
        setTimeout(() => { clearInterval(fastClean); setInterval(namuCleaner, 600); }, 3000);
    }
})();
