// ==UserScript==
// @name         DC & Namu Combined Stealth
// @version      3.2
// @description  디시(v2.4 고정) + 나무위키(NamuLink 네트워크 봉쇄 및 GPT 무력화)
// @match        *://*.dcinside.com/*
// @match        *://*.namu.wiki/*
// @updateURL    https://raw.githubusercontent.com/OK-KR2/filter-backup/main/dc_namu.user.js
// @downloadURL  https://raw.githubusercontent.com/OK-KR2/filter-backup/main/dc_namu.user.js
// @run-at       document-start
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    const blocked = new WeakSet();
    const collapseNode = (node) => {
        if (!node || blocked.has(node)) return;
        blocked.add(node);
        node.style.setProperty('display', 'none', 'important');
        node.style.setProperty('height', '0', 'important');
        node.style.setProperty('visibility', 'hidden', 'important');
        node.setAttribute('data-blocked-by-script', 'true');
    };

    /* --------------------------------------------------
       PART 1: 디시인사이드 (검증된 v2.4 로직 유지)
    -------------------------------------------------- */
    if (location.hostname.includes('dcinside.com')) {
        const lock = (p, v) => {
            try { Object.defineProperty(window, p, { value: v, writable: false, configurable: false }); } catch (e) {}
        };
        lock('is_adblock', false); lock('adblock_chk', false); lock('canRunAds', true); lock('is_ad_block', 'N');

        const killFloatingGaejuki = () => {
            document.querySelectorAll('div').forEach(el => {
                const style = window.getComputedStyle(el);
                if ((style.position === 'fixed' || style.position === 'sticky') && (el.innerHTML.includes('error/adblock') || el.querySelector('img[src*="gaeju"]'))) {
                    collapseNode(el); el.remove();
                }
            });
        };
        const dcObserver = new MutationObserver(killFloatingGaejuki);
        dcObserver.observe(document.documentElement, { childList: true, subtree: true });
        window.addEventListener('scroll', killFloatingGaejuki, { passive: true });
    }

    /* --------------------------------------------------
       PART 2: 나무위키 (v3.2 사파리 모바일 최강 방어)
    -------------------------------------------------- */
    if (location.hostname.includes('namu.wiki')) {
        // 1. [객체 스푸핑] 광고 엔진이 정의되기 전에 가짜 객체로 선점
        const mockObj = { 
            loadAd: () => {}, init: () => {}, getAds: () => [], 
            display: () => {}, enableServices: () => {}, pubads: () => ({ setTargeting: () => {} }) 
        };
        const lockObj = (name) => {
            try { Object.defineProperty(window, name, { value: mockObj, writable: false }); } catch(e) {}
        };
        lockObj('googletag'); lockObj('veta'); lockObj('adsbygoogle');

        // 2. [네트워크 원천 봉쇄] fetch 및 XHR 가로채기 (NamuLink 방식 최적화)
        const adPatterns = [/adcr\.naver\.com/, /veta\.naver\.com/, /securepubads/, /outbrain\.com/, /doubleclick\.net/];
        const isAd = (url) => typeof url === 'string' && adPatterns.some(p => p.test(url));

        const originalFetch = window.fetch;
        window.fetch = async (...args) => {
            const url = typeof args[0] === 'string' ? args[0] : args[0]?.url;
            if (isAd(url)) return new Response(JSON.stringify({ ads: [], status: "success" }), { status: 200 });
            return originalFetch.apply(window, args);
        };

        const originalXHR = window.XMLHttpRequest.prototype.open;
        window.XMLHttpRequest.prototype.open = function(m, url) {
            if (isAd(url)) return console.log("나무위키: 변종 광고 요청(XHR) 차단 완료 🫡");
            return originalOpen.apply(this, arguments);
        };

        // 3. [시각적 청소] 선제적 CSS 주입 (색상 및 클래스 정밀 조준)
        const style = document.createElement('style');
        style.textContent = `
            /* 광고 상자 색상 및 구조적 소거 */
            div[style*="#fffff6"], div[style*="rgb(255, 255, 246)"],
            div[class*="veta-ad"], .veta_ad_wrapper, .gn4Z21wj, .VBwhMBUe,
            div:has(> div[style*="background-color: #fffff6"]) { 
                display: none !important; height: 0px !important; visibility: hidden !important; 
            }
        `;
        (document.head || document.documentElement).appendChild(style);

        const namuCleaner = () => {
            document.querySelectorAll('div, section').forEach(el => {
                // "파워링크" 또는 "광고등록" 텍스트 기반 타격
                if (el.innerText === "파워링크" || el.innerText?.includes("광고등록") || el.querySelector('a[href*="adcr.naver.com"]')) {
                    const target = el.closest('div[style*="#fffff6"]') || el.closest('div[style*="rgb(255, 255, 246)"]') || el;
                    collapseNode(target);
                    target.remove();
                }
            });
        };

        const namuObserver = new MutationObserver(namuCleaner);
        namuObserver.observe(document.documentElement, { childList: true, subtree: true });
        setInterval(namuCleaner, 400); // 사파리 모바일의 비동기 렌더링에 0.4초 주기로 대응
    }
})();
