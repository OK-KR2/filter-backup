// ==UserScript==
// @name         DC & Namu Combined Stealth (Zero-Flicker)
// @version      2.1
// @description  비공개 릴레이 보호 + 디시 개죽이 방멸 + 나무위키 빈칸 없는 원천 차단
// @match        *://*.dcinside.com/*
// @match        *://*.namu.wiki/*
// @run-at       document-start
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // 1. [핵심] 광고가 들어설 '빈 공간'조차 허용하지 않는 초고속 CSS 주입
    // 페이지 로드 시작과 동시에 실행되어 "보였다 사라지는 현상"을 방지합니다.
    const style = document.createElement('style');
    style.textContent = `
        /* 나무위키 파워링크 컨테이너 완전 소거 */
        div[class*="veta-ad"], .veta_ad_wrapper, 
        div:has(a[href*="adcr.naver.com"]), 
        div:has(span:has-text("파워링크")),
        div:has-text(/^파워링크$/) {
            display: none !important;
            height: 0px !important;
            margin: 0px !important;
            padding: 0px !important;
            visibility: hidden !important;
        }
        /* 디시인사이드 광고 레이아웃 제거 */
        .ad_box, .ad_area, [id^="ad_"], .dna-group, 
        .app_banner_wrap, .media-group, .layer-bottom-popup,
        .outside-search-box, .bottom_ad_box {
            display: none !important;
            height: 0px !important;
        }
    `;
    (document.head || document.documentElement).appendChild(style);

    // 2. [디시] 개죽이(429/Adblock 감지) 신분 세탁
    if (location.hostname.includes('dcinside.com')) {
        const lock = (p, v) => {
            try { Object.defineProperty(window, p, { value: v, writable: false, configurable: false }); } catch (e) {}
        };
        lock('is_adblock', false);
        lock('adblock_chk', false);
        lock('canRunAds', true);
        lock('is_ad_block', 'N');
    }

    // 3. [나무위키] 실시간 감시 (MutationObserver)
    // 5초 뒤에 되살아나는 변종 광고가 보일 틈도 없이 즉시 삭제합니다.
    if (location.hostname.includes('namu.wiki')) {
        const observer = new MutationObserver(() => {
            document.querySelectorAll('div, section').forEach(el => {
                if (el.innerText?.includes("파워링크") || el.querySelector('a[href*="adcr.naver.com"]')) {
                    const target = el.closest('div[style*="background-color"]') || el;
                    if (target.parentNode && target.style.display !== 'none') {
                        target.style.setProperty('display', 'none', 'important');
                        target.remove();
                    }
                }
            });
        });
        observer.observe(document.documentElement, { childList: true, subtree: true });
    }
})();
