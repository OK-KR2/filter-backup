// ==UserScript==
// @name         DC & Namu Combined Stealth (Hooray804 Based)
// @version      2.0
// @description  디시 개죽이 방지 + 나무위키 5초 지연 광고 실시간 사살
// @match        *://*.dcinside.com/*
// @match        *://*.namu.wiki/*
// @updateURL    https://raw.githubusercontent.com/OK-KR2/filter-backup/refs/heads/main/dc_namu.user.js
// @downloadURL  https://raw.githubusercontent.com/OK-KR2/filter-backup/refs/heads/main/dc_namu.user.js
// @run-at       document-start
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // 1. [공통] 시각적 광고 소거 (Hooray804 CSS 기반)
    const style = document.createElement('style');
    style.textContent = `
        .ad_box, .ad_area, [id^="ad_"], .dna-group, .veta-ad,
        div:has(a[href*="adcr.naver.com"]), div:has-text("파워링크") {
            display: none !important; height: 0px !important; visibility: hidden !important;
        }
    `;
    (document.head || document.documentElement).appendChild(style);

    // 2. [디시] 개죽이(429/Adblock 감지) 우회
    if (location.hostname.includes('dcinside.com')) {
        const lock = (p, v) => Object.defineProperty(window, p, { value: v, writable: false });
        lock('is_adblock', false);
        lock('canRunAds', true);
        lock('adblock_chk', false);
        console.log("디시: 스텔스 모드 작동 중... 🫡");
    }

    // 3. [나무위키] 5초 지연 광고 실시간 암살 (CCTV 모드)
    if (location.hostname.includes('namu.wiki')) {
        const observer = new MutationObserver(() => {
            document.querySelectorAll('div, section').forEach(el => {
                if (el.innerText?.includes("파워링크") || el.querySelector('a[href*="adcr.naver.com"]')) {
                    const target = el.closest('div[style*="background-color"]') || el;
                    if (target.parentNode) target.remove();
                }
            });
        });
        observer.observe(document.documentElement, { childList: true, subtree: true });
        console.log("나무위키: 실시간 감시 중... 🎯");
    }
})();
