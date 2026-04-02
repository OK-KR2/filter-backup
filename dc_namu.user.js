// ==UserScript==
// @name         DC & Namu Combined Stealth
// @version      4.8
// @description  나무위키(v4.3 성공로직 고정) + 디시(429 페널티 강제 해제 및 신분 세탁)
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

    /* --------------------------------------------------
       PART 1: 디시인사이드 (낙인 완전 소각 및 429 탈출)
    -------------------------------------------------- */
    if (location.hostname.includes('dcinside.com')) {
        // 1. [강력 세척] LocalStorage에 박힌 첩자(191)와 모든 낙인 즉시 제거
        const dcLaundering = () => {
            // 사용자님 스샷에 찍힌 그놈(191)을 포함해 싹 지웁니다.
            localStorage.clear(); 
            sessionStorage.clear();
            
            // 쿠키 낙인(ok)을 '청정 상태(no)'로 덮어쓰기
            document.cookie = "find_ab=no; expires=Thu, 01 Jan 2030 00:00:00 UTC; path=/; domain=.dcinside.com";
            document.cookie = "adblock_detected=0; expires=Thu, 01 Jan 2030 00:00:00 UTC; path=/; domain=.dcinside.com";
        };
        dcLaundering();
        
        // 2. 신분 세탁 고정
        lock('is_adblock', false); lock('adblock_chk', false); lock('canRunAds', true); lock('is_ad_block', 'N');

        // 3. [유배 CSS] 개죽이와 페널티 박스를 화면 밖으로 격격리 (삭제 X)
        const style = document.createElement('style');
        style.textContent = `
            #moveOverlay, #moveimg, .adv-group, .pwlink, .penalty-box, .pp-box {
                display: block !important; position: fixed !important;
                left: -9999px !important; opacity: 0 !important; pointer-events: none !important;
            }
        `;
        (document.head || document.documentElement).appendChild(style);

        // 4. 광고 서버 통신은 '정상 완료'된 것처럼 가로채기
        const originalFetch = window.fetch;
        window.fetch = async (...args) => {
            const url = typeof args[0] === 'string' ? args[0] : args[0]?.url;
            if (url && (url.includes('ajax/naverad') || url.includes('naverad'))) {
                return new Response(JSON.stringify({ ads: [], status: "success" }), { status: 200 });
            }
            return originalFetch.apply(window, args);
        };
        
        setInterval(dcLaundering, 500); // 0.5초마다 낙인 재검사
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
                    const target = el.closest('div[class*="_"]') || el;
                    if (target && target.id !== 'app' && target.id !== 'eruda') {
                        target.style.setProperty('display', 'none', 'important');
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
