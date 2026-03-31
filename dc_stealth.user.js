// ==UserScript==
// @name        DCInside Stealth-Slayer (Single-Script)
// @description 애드가드 설정 없이 스크립트 하나로 디시 광고와 개죽이를 동시에 잡습니다.
// @match       *://*.dcinside.com/*
// @run-at      document-start
// @grant       none
// ==/UserScript==

(function() {
    'use strict';

    // 1. [CSS 주입] 광고 박스 시각적 소거 (애드가드 역할 대신 수행)
    const injectStyle = () => {
        const style = document.createElement('style');
        style.textContent = `
            .ad_box, .ad_area, .dna-group, [id^="ad_"], 
            .app_banner_wrap, .media-group, .layer-bottom-popup, 
            .outside-search-box, .bottom_ad_box, .trend.cont {
                display: none !important;
                height: 0px !important;
                visibility: hidden !important;
            }
        `;
        (document.head || document.documentElement).appendChild(style);
    };
    injectStyle();

    // 2. [신분 세탁] 디시 보안팀이 체크하는 모든 변수를 '정상'으로 강제 고정
    const lock = (prop, val) => {
        try {
            Object.defineProperty(window, prop, {
                value: val,
                writable: false,
                configurable: false
            });
        } catch (e) {}
    };

    lock('is_adblock', false);
    lock('adblock_chk', false);
    lock('canRunAds', true);
    lock('is_ad_block', 'N');

    // 3. [리다이렉트 방지] '너무 많은 요청(429)'이나 '개죽이' 페이지 이동 시도 차단
    const originalLocation = window.location.replace;
    window.location.replace = function(url) {
        if (url.includes('too_many_request') || url.includes('error/adblock')) {
            console.log("디시: 개죽이 리다이렉트 시도를 차단했습니다. 🎯");
            return; 
        }
        return originalLocation.apply(this, arguments);
    };

    // 4. [감지 스크립트 사살] ad_check.js 등 보안 스크립트 실행 방해
    window.addEventListener('beforescriptexecute', function(e) {
        if (e.target.src.includes('ad_check.js') || e.target.text.includes('is_adblock')) {
            e.preventDefault();
            e.stopPropagation();
        }
    }, true);

    console.log("디시: 단독 스텔스 모드 가동 중... 비공개 릴레이 사수! 🫡");
})();
