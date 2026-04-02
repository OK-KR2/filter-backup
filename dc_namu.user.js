// ==UserScript==
// @name         DC & Namu Combined Stealth
// @version      4.4
// @description  디시(페널티 회피형 유령화) + 나무위키(v4.3 성공 로직 고정)
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
       PART 1: 디시인사이드 (페널티 회피를 위한 '유령화' 작전)
    -------------------------------------------------- */
    if (location.hostname.includes('dcinside.com')) {
        // 1. 신분 세탁 (기존 v2.4 로직 유지)
        lock('is_adblock', false); lock('adblock_chk', false); lock('canRunAds', true); lock('is_ad_block', 'N');

        const ghostingGaejuki = () => {
            document.querySelectorAll('div').forEach(el => {
                const style = window.getComputedStyle(el);
                // 개죽이 이미지나 광고 에러 레이어 감지
                if ((style.position === 'fixed' || style.position === 'sticky') && (el.innerHTML.includes('error/adblock') || el.querySelector('img[src*="gaeju"]'))) {
                    // [핵심] 삭제(remove)하지 않고 투명하게만 만듦 (서버의 '노드 삭제 감지' 우회)
                    el.style.setProperty('opacity', '0', 'important');
                    el.style.setProperty('pointer-events', 'none', 'important');
                    el.style.setProperty('visibility', 'hidden', 'important');
                    el.setAttribute('data-ghosted', 'true');
                }
            });
        };

        new MutationObserver(ghostingGaejuki).observe(document.documentElement, { childList: true, subtree: true });
        window.addEventListener('scroll', ghostingGaejuki, { passive: true });
    }

    /* --------------------------------------------------
       PART 2: 나무위키 (사용자 인증 v4.3 성공 로직 100% 고정)
    -------------------------------------------------- */
    if (location.hostname.includes('namu.wiki')) {
        // 1. [철권 CSS] 광고 공간 선제적 소멸 (v4.3 동일)
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

        // 2. [위장술] 가짜 엔진 주입 (v4.3 동일)
        const mockAd = { loadAd: () => {}, init: () => {}, getAds: () => [], setTargeting: () => {}, display: () => {}, enableServices: () => {}, pubads: () => mockAd, addService: () => mockAd };
        window.veta = window.veta || mockAd;
        window.googletag = window.googletag || mockAd;
        window.ad_block_detected = false;
        window.canRunAds = true;

        // 3. [진공 박멸] 0.1초 단위 뿌리 뽑기 (v4.3 동일)
        const namuCleaner = () => {
            document.querySelectorAll('div, section').forEach(el => {
                if (el.hasAttribute('data-v-aed07d7a') || el.innerText === "파워링크" || el.querySelector('a[href*="adcr.naver.com"]')) {
                    const target = el.closest('div[class*="_"]') || el;
                    if (target && target.id !== 'app') {
                        target.style.setProperty('display', 'none', 'important');
                        if (target.parentNode) target.remove(); // 나무위키는 과감하게 삭제
                    }
                }
            });
        };

        new MutationObserver(namuCleaner).observe(document.documentElement, { childList: true, subtree: true });
        let fastClean = setInterval(namuCleaner, 100);
        setTimeout(() => { clearInterval(fastClean); setInterval(namuCleaner, 600); }, 3000);
    }
})();
