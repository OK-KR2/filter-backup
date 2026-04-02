// ==UserScript==
// @name         DC & Namu Combined Stealth
// @version      4.6
// @description  디시(CSS 스텔스 유령화) + 나무위키(v4.3 성공 로직 고정)
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
       PART 1: 디시인사이드 (비침습적 CSS 스텔스 모드)
    -------------------------------------------------- */
    if (location.hostname.includes('dcinside.com')) {
        // 1. 최소한의 신분 세탁 (서버 통신용 변수만 조작)
        lock('is_adblock', false); lock('adblock_chk', false); lock('canRunAds', true); lock('is_ad_block', 'N');

        // 2. [핵심] 자바스크립트 대신 초강력 CSS 주입
        // 서버 감시 스크립트가 DOM 요소를 찾아도 '삭제'되지 않았으므로 페널티를 피합니다.
        const style = document.createElement('style');
        style.textContent = `
            #moveOverlay, #moveimg, .adv-group, .adv-groupin, .adv-grouptop, 
            ins.kakao_ad_area, .power-lst, iframe[src*="netinsight"] {
                opacity: 0 !important;
                pointer-events: none !important;
                visibility: hidden !important;
                z-index: -9999 !important;
                position: absolute !important;
                left: -9999px !important;
            }
        `;
        (document.head || document.documentElement).appendChild(style);
        
        console.log("디시: 스텔스 유령화 가동 중 🫡");
    }

    /* --------------------------------------------------
       PART 2: 나무위키 (사용자 인증 v4.3 성공 로직 100% 고정)
    -------------------------------------------------- */
    if (location.hostname.includes('namu.wiki')) {
        const style = document.createElement('style');
        style.textContent = `
            [data-v-aed07d7a], .veta_ad_wrapper, .gn4Z21wj, .VBwhMBUe, ._3Dy97h7l,
            div:has(> a[href*="adcr.naver.com"]),
            div[style*="background-color: #fffff6"],
            iframe[src*="doubleclick.net"] { 
                display: none !important; height: 0px !important; margin: 0px !important; padding: 0px !important; opacity: 0 !important; pointer-events: none !important;
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
