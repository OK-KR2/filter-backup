// ==UserScript==
// @name         DC & Namu Combined Stealth
// @version      4.5
// @description  나무위키(v4.3 성공로직 고정) + 디시(페널티 완전 회피형 좌표 격리)
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
       PART 1: 디시인사이드 (물리적 삭제 금지 -> '좌표 격리'로 페널티 완전 회피)
    -------------------------------------------------- */
    if (location.hostname.includes('dcinside.com')) {
        // 1. 신분 세탁 (서버에 광고가 노출되고 있다고 안심시킴)
        lock('is_adblock', false); lock('adblock_chk', false); lock('canRunAds', true); lock('is_ad_block', 'N');

        // 2. [핵심] 초강력 좌표 격리 CSS
        // 요소를 삭제(remove)하면 서버가 즉시 알아채고 페널티(429)를 먹입니다.
        // 대신 존재는 하되, 화면 밖(-9999px)으로 던져버려서 서버는 속이고 사용자 눈엔 안 보이게 합니다.
        const style = document.createElement('style');
        style.textContent = `
            #moveOverlay, #moveimg, .adv-group, .adv-groupin, .adv-grouptop, 
            ins.kakao_ad_area, .power-lst, iframe[src*="netinsight"], .pwlink,
            div[class*="adv-"] {
                display: block !important;
                position: fixed !important;
                left: -9999px !important;
                top: -9999px !important;
                width: 1px !important;
                height: 1px !important;
                opacity: 0 !important;
                pointer-events: none !important;
                z-index: -9999 !important;
            }
        `;
        (document.head || document.documentElement).appendChild(style);

        const dcStealth = () => {
            document.querySelectorAll('#moveOverlay, #moveimg, .adv-group').forEach(el => {
                el.style.setProperty('left', '-9999px', 'important');
                el.style.setProperty('opacity', '0', 'important');
                el.style.setProperty('pointer-events', 'none', 'important');
            });
        };
        new MutationObserver(dcStealth).observe(document.documentElement, { childList: true, subtree: true });
    }

    /* --------------------------------------------------
       PART 2: 나무위키 (사용자 인증 v4.3 성공 로직 100% 동일 유지)
    -------------------------------------------------- */
    if (location.hostname.includes('namu.wiki')) {
        // [선제적 CSS] 사용자님이 만족하신 공간 소멸 방식 그대로
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

        // [신분 세탁] v4.3의 가짜 엔진
        const mockAd = { loadAd: () => {}, init: () => {}, getAds: () => [], setTargeting: () => {}, display: () => {}, enableServices: () => {}, pubads: () => mockAd, addService: () => mockAd };
        window.veta = window.veta || mockAd;
        window.googletag = window.googletag || mockAd;
        window.ad_block_detected = false;
        window.canRunAds = true;

        // [물리적 박멸] v4.3의 remove() 로직
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
