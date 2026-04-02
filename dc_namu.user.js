// ==UserScript==
// @name         DC & Namu Combined Stealth
// @version      4.6
// @description  디시(낙인 제거 및 페널티 회피) + 나무위키(v4.3 성공 로직 고정)
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
       PART 1: 디시인사이드 (낙인 세척 및 좌표 유배)
    -------------------------------------------------- */
    if (location.hostname.includes('dcinside.com')) {
        // 1. [낙인 세척] 놈들이 심어둔 광고 차단 감지 데이터 실시간 삭제
        const cleanLaundry = () => {
            localStorage.removeItem('adblock_detected');
            localStorage.removeItem('find_ab');
            // 쿠키에서 광고 차단 감지값(find_ab) 강제 변조 (ok -> no)
            document.cookie = "find_ab=no; expires=Thu, 01 Jan 2030 00:00:00 UTC; path=/; domain=.dcinside.com";
        };
        cleanLaundry();
        
        // 2. [신분 세탁] 서버에 "광고 아주 잘 보고 있음"이라고 거짓 보고
        lock('is_adblock', false); lock('adblock_chk', false); lock('canRunAds', true); lock('is_ad_block', 'N');

        // 3. [데이터 봉쇄] 광고 차단 여부를 서버로 쏘는 통로(ajax/naverad) 가로채기
        const originalFetch = window.fetch;
        window.fetch = async (...args) => {
            const url = typeof args[0] === 'string' ? args[0] : args[0]?.url;
            if (url && url.includes('ajax/naverad')) {
                return new Response("", { status: 200 }); // 빈 응답으로 놈들을 안심시킴
            }
            return originalFetch.apply(window, args);
        };

        // 4. [좌표 유배 CSS] 개죽이를 죽이지 않고 화면 밖으로 던짐 (페널티 회피)
        const style = document.createElement('style');
        style.textContent = `
            #moveOverlay, #moveimg, .adv-group, .adv-groupin, .adv-grouptop, 
            ins.kakao_ad_area, .power-lst, .pwlink, div[class*="adv-"] {
                display: block !important; position: fixed !important;
                left: -9999px !important; top: -9999px !important;
                width: 1px !important; height: 1px !important;
                opacity: 0 !important; pointer-events: none !important;
            }
        `;
        (document.head || document.documentElement).appendChild(style);

        setInterval(cleanLaundry, 1000); // 1초마다 낙인 재검사 및 세척
    }

    /* --------------------------------------------------
       PART 2: 나무위키 (사용자 인증 v4.3 성공 로직 100% 고정)
    -------------------------------------------------- */
    if (location.hostname.includes('namu.wiki')) {
        const style = document.createElement('style');
        style.textContent = `
            [data-v-aed07d7a], .veta_ad_wrapper, .gn4Z21wj, .VBwhMBUe, ._3Dy97h7l,
            div:has(> a[href*="adcr.naver.com"]), div[style*="background-color: #fffff6"],
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
                    if (target && target.id !== 'app') {
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
