// ==UserScript==
// @name         DC & Namu Combined Stealth
// @version      4.5
// @description  디시(페널티 회피형 개죽이 유령화) + 나무위키(v4.3 박멸 로직 고정)
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
       PART 1: 디시인사이드 (물리적 삭제 금지 -> '유령화'로 페널티 회피)
    -------------------------------------------------- */
    if (location.hostname.includes('dcinside.com')) {
        // 1. 신분 세탁
        lock('is_adblock', false); lock('adblock_chk', false); lock('canRunAds', true); lock('is_ad_block', 'N');

        const ghostingProcess = () => {
            // 소스에서 확인된 '날아다니는 개죽이' ID 및 광고 레이아웃 타격
            const targets = document.querySelectorAll('#moveOverlay, #moveimg, .adv-group, ins.kakao_ad_area');
            
            targets.forEach(el => {
                if (el.getAttribute('data-ghosted') === 'true') return;
                
                // [핵심] 요소를 삭제하지 않고 시각적으로만 소멸시킴 (서버 감시 우회)
                el.style.setProperty('opacity', '0', 'important');
                el.style.setProperty('pointer-events', 'none', 'important');
                el.style.setProperty('visibility', 'hidden', 'important');
                el.style.setProperty('height', '0px', 'important');
                el.setAttribute('data-ghosted', 'true');
            });

            // 스크롤 시 나타나는 fixed 개죽이 추가 감시
            document.querySelectorAll('div').forEach(el => {
                const style = window.getComputedStyle(el);
                if ((style.position === 'fixed' || style.position === 'sticky') && 
                    (el.innerHTML.includes('error/adblock') || el.querySelector('img[src*="moveimg"]') || el.querySelector('img[src*="gaeju"]'))) {
                    el.style.setProperty('opacity', '0', 'important');
                    el.style.setProperty('pointer-events', 'none', 'important');
                }
            });
        };

        new MutationObserver(ghostingProcess).observe(document.documentElement, { childList: true, subtree: true });
        window.addEventListener('scroll', ghostingProcess, { passive: true });
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
