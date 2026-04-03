// ==UserScript==
// @name         DC & Namu Combined Stealth
// @version      4.7.1
// @description  나무위키(v4.3 성공로직 고정) + 디시(낙인 추가 소각 및 페널티 회피)
// @match        *://*.dcinside.com/*
// @match        *://*.namu.wiki/*
// @updateURL    https://raw.githubusercontent.com/OK-KR2/filter-backup/main/dc_namu.user.js
// @downloadURL  https://raw.githubusercontent.com/OK-KR2/filter-backup/main/dc_namu.user.js
// @run-at       document-start
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    const lock = (p, v) => {
        try { Object.defineProperty(window, p, { value: v, writable: false, configurable: false }); } catch (e) {}
    };

    /* [공통 유틸리티] 공간 압축 */
    const collapseNode = (node) => {
        if (!node || node.id === 'app' || node.id === 'eruda' || node.tagName === 'BODY') return;
        node.style.setProperty('display', 'none', 'important');
        node.style.setProperty('height', '0', 'important');
        node.style.setProperty('margin', '0', 'important');
        node.setAttribute('data-blocked-by-stealth', 'true');
    };

    /* --------------------------------------------------
       PART 1: 디시인사이드 (마이크로 세척 및 유배 작전)
    -------------------------------------------------- */
    if (location.hostname.includes('dcinside.com')) {
        const laundryDC = () => {
            // [마이크로 패치] 놈들이 숨겨둔 모든 감지 변수 소각
            localStorage.removeItem('adblock_detected');
            localStorage.removeItem('find_ab');
            localStorage.removeItem('find_ab_check'); // 추가된 감시망
            
            if (document.cookie.includes('find_ab=ok')) {
                document.cookie = "find_ab=no; expires=Thu, 01 Jan 2030 00:00:00 UTC; path=/; domain=.dcinside.com";
            }
        };
        laundryDC();
        lock('is_adblock', false); lock('adblock_chk', false); lock('canRunAds', true); lock('is_ad_block', 'N');

        // [유배 CSS] 삭제 대신 위치 이동으로 페널티 회피
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
        setInterval(laundryDC, 800);
    }

    /* --------------------------------------------------
       PART 2: 나무위키 (사용자 인증 v4.3 성공 로직 100% 고정)
    -------------------------------------------------- */
    if (location.hostname.includes('namu.wiki')) {
        const style = document.createElement('style');
        style.textContent = `
            [data-v-aed07d7a], .veta_ad_wrapper, .gn4Z21wj, .VBwhMBUe, ._3Dy97h7l,
            div:has(> a[href*="adcr.naver.com"]), div[style*="#fffff6"],
            iframe[src*="doubleclick.net"] { 
                display: none !important; height: 0px !important; margin: 0px !important; opacity: 0 !important;
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
                    const target = el.closest('div[class*="_"]') || el;
                    if (target && target.id !== 'app' && target.id !== 'eruda') {
                        collapseNode(target);
                        if (target.parentNode) target.remove(); 
                    }
                }
            });
        };
        new MutationObserver(namuCleaner).observe(document.documentElement, { childList: true, subtree: true });
        let fastClean = setInterval(namuCleaner, 100);
        setTimeout(() => { clearInterval(fastClean); setInterval(namuCleaner, 600); }, 3000);
    }
})();
