// ==UserScript==
// @name         DC & Namu Combined Stealth
// @version      4.8
// @description  나무위키(깜빡임 100% 원천 봉쇄) + 디시(안정화된 유배 모드)
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
        node.style.setProperty('padding', '0', 'important');
        node.setAttribute('data-blocked-by-stealth', 'true');
    };

    /* --------------------------------------------------
       PART 1: 디시인사이드 (v4.7.2 최적화 안정형 유지)
    -------------------------------------------------- */
    if (location.hostname.includes('dcinside.com')) {
        const laundryDC = () => {
            localStorage.removeItem('adblock_detected');
            localStorage.removeItem('find_ab');
            localStorage.removeItem('find_ab_check'); 
            if (document.cookie.includes('find_ab=ok')) {
                document.cookie = "find_ab=no; expires=Thu, 01 Jan 2030 00:00:00 UTC; path=/; domain=.dcinside.com";
            }
        };
        laundryDC();
        lock('is_adblock', false); lock('adblock_chk', false); lock('canRunAds', true); lock('is_ad_block', 'N');

        const style = document.createElement('style');
        style.textContent = `
            #moveOverlay, #moveimg, .adv-group, .adv-groupin, .adv-grouptop, .pwlink, 
            .pp-box:has(.penalty-box), div[id*="ad_middle"], iframe[src*="netinsight"] {
                display: block !important; position: fixed !important;
                left: -9999px !important; opacity: 0 !important; pointer-events: none !important;
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
        setInterval(() => requestAnimationFrame(laundryDC), 1000);
    }

    /* --------------------------------------------------
       PART 2: 나무위키 (v4.8 깜빡임 원천 봉쇄)
    -------------------------------------------------- */
    if (location.hostname.includes('namu.wiki')) {
        // [핵심 1] 소스 분석 기반: 모든 파워링크 최상위 컨테이너 패턴 선제적 차단
        const style = document.createElement('style');
        style.textContent = `
            /* veta 광고 및 알려진 모든 변종 껍데기 사전 차단 */
            [data-v-aed07d7a], .veta_ad_wrapper, .gn4Z21wj, .VBwhMBUe, ._3Dy97h7l,
            div[class*="vKJY7-f5"], div[class*="HJeR5GcT"], /* 이번에 새로 발견된 변종들 */
            div:has(> a[href*="adcr.naver.com"]), div[style*="#fffff6"],
            iframe[src*="doubleclick.net"] { 
                display: none !important; height: 0px !important; margin: 0px !important; padding: 0px !important; opacity: 0 !important; pointer-events: none !important;
            }
        `;
        (document.head || document.documentElement).appendChild(style);

        // [핵심 2] 엔진 자체를 더 철저하게 바보로 만들기
        const mockAd = { loadAd: () => {}, init: () => {}, getAds: () => [], setTargeting: () => {}, display: () => {}, enableServices: () => {}, pubads: () => mockAd, addService: () => mockAd };
        window.veta = window.veta || mockAd;
        window.googletag = window.googletag || mockAd;
        window.ad_block_detected = false;
        window.canRunAds = true;

        // [핵심 3] 재생성 시도 자체를 박살내는 무자비 청소기
        let cleanupTimeout;
        const namuCleaner = () => {
            document.querySelectorAll('div, section').forEach(el => {
                // 광고 텍스트나 네이버 링크가 포함된 경우
                if (el.hasAttribute('data-v-aed07d7a') || el.innerText === "파워링크" || el.querySelector('a[href*="adcr.naver.com"]')) {
                    // 가장 바깥쪽의 불규칙한 클래스 컨테이너까지 싹 다 추적해서 날림
                    const target = el.closest('div[class*="vKJY7-f5"]') || el.closest('div[class*="_"]') || el;
                    if (target && target.id !== 'app' && target.id !== 'eruda') {
                        collapseNode(target);
                        if (target.parentNode) target.remove(); 
                    }
                }
            });
        };
        
        // DOM 변화가 있을 때만 지능적으로 실행 (배터리 최적화 + 밀당 방지)
        new MutationObserver(() => {
            clearTimeout(cleanupTimeout);
            cleanupTimeout = setTimeout(namuCleaner, 20); // 찰나의 순간에 썰어버림
        }).observe(document.documentElement, { childList: true, subtree: true });
        
        // 페이지 로드 직후 혹시 모를 좀비 대비
        let fastClean = setInterval(namuCleaner, 100);
        setTimeout(() => clearInterval(fastClean), 3000);
    }
})();
