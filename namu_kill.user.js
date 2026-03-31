// @version      1.0
// @updateURL    https://raw.githubusercontent.com/OK-KR2/filter-backup/refs/heads/main/dc_stealth.user.js
// @downloadURL  https://raw.githubusercontent.com/OK-KR2/filter-backup/refs/heads/main/dc_stealth.user.js


// ==UserScript==
// @name        NamuWiki Ad-Slayer (Single-Script Mode)
// @description 애드가드 설정 없이 스크립트 하나로 나무위키 파워링크를 완전 박멸합니다.
// @match       *://*.namu.wiki/*
// @run-at      document-start
// @grant       none
// ==/UserScript==

(function() {
    'use strict';

    // 1. [CSS 주입] 스크립트 내부에서 가리기 명령까지 수행 (애드가드 역할 대신)
    const injectStyle = () => {
        const style = document.createElement('style');
        style.textContent = `
            div:has-text("파워링크"), div:has-text("광고등록"),
            div[class*="veta-ad"], .veta_ad_wrapper,
            iframe[src*="adcr.naver.com"],
            div:has(a[href*="adcr.naver.com"]) {
                display: none !important;
                height: 0px !important;
                visibility: hidden !important;
                pointer-events: none !important;
            }
        `;
        (document.head || document.documentElement).appendChild(style);
    };
    injectStyle();

    // 2. [공장 장악] 광고 요소가 생성되는 순간 가로채기
    const originalCreateElement = document.createElement;
    document.createElement = function(tagName) {
        const el = originalCreateElement.call(document, tagName);
        if (tagName.toLowerCase() === 'div') {
            // 나무위키 광고 스크립트가 자주 사용하는 클래스 감지
            const observer = new MutationObserver(() => {
                if (el.className.includes('veta-ad') || el.innerHTML.includes('adcr.naver.com')) {
                    el.style.display = 'none';
                    el.remove();
                }
            });
            observer.observe(el, { attributes: true, childList: true });
        }
        return el;
    };

    // 3. [뇌 정지] 네이버 광고 객체(veta) 원천 봉쇄
    const noop = () => {};
    Object.defineProperty(window, 'veta', {
        get: () => ({ loadAd: noop, init: noop, getAds: () => [] }),
        set: () => {},
        configurable: false
    });

    // 4. [상시 감시] 5초 뒤에 생기는 텍스트까지 실시간 소거
    const mainObserver = new MutationObserver(() => {
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
        let node;
        while(node = walker.nextNode()) {
            if (node.nodeValue.includes("파워링크") || node.nodeValue.includes("광고등록")) {
                const target = node.parentElement.closest('div') || node.parentElement;
                if (target && target.style.display !== 'none') {
                    target.style.setProperty('display', 'none', 'important');
                    target.remove();
                }
            }
        }
    });

    // 페이지 로드 즉시 감시 시작
    const run = () => {
        if (document.body) {
            mainObserver.observe(document.body, { childList: true, subtree: true });
        } else {
            setTimeout(run, 10);
        }
    };
    run();

    console.log("나무위키: 단독 스텔스 모드 가동 중... 🎯");
})();