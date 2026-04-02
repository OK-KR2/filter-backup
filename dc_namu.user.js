// ==UserScript==
// @name         DC & Namu Combined Stealth
// @version      3.1
// @description  디시(v2.4 유지) + 나무위키(신규 색상 코드 및 구글 GPT 차단)
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
        node.setAttribute('data-blocked-by-script', 'true');
    };

    /* --------------------------------------------------
       PART 1: 디시인사이드 (v2.4 로직 100% 동일 유지)
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
       PART 2: 나무위키 (v3.1 신규 색상 및 GPT 대응)
    -------------------------------------------------- */
    if (location.hostname.includes('namu.wiki')) {
        // 1. [강력 CSS] 보내주신 소스의 #fffff6 색상을 정조준
        const style = document.createElement('style');
        style.textContent = `
            div[style*="#fffff6"], 
            div[style*="rgb(255, 255, 246)"],
            div[class*="veta-ad"],
            iframe[src*="doubleclick.net"],
            iframe[id*="google_ads"] { display: none !important; height: 0px !important; visibility: hidden !important; }
        `;
        (document.head || document.documentElement).appendChild(style);

        // 2. [네트워크 봉쇄] 구글 gpt.js 및 네이버 veta 원천 차단 (XHR 포함)
        const adKeywords = ['gpt.js', 'securepubads', 'adcr.naver.com', 'veta.naver.com'];

        const originalFetch = window.fetch;
        window.fetch = async (...args) => {
            const url = typeof args[0] === 'string' ? args[0] : args[0]?.url;
            if (url && adKeywords.some(k => url.includes(k))) {
                return new Response(JSON.stringify({ads:[]}), {status: 200});
            }
            return originalFetch.apply(window, args);
        };

        const originalXHR = window.XMLHttpRequest.prototype.open;
        window.XMLHttpRequest.prototype.open = function(m, url) {
            if (typeof url === 'string' && adKeywords.some(k => url.includes(k))) return;
            return originalOpen.apply(this, arguments);
        };

        // 3. [시각적 사살] "파워링크" 텍스트 기반 즉각 삭제
        const namuCleaner = () => {
            document.querySelectorAll('div').forEach(el => {
                if (el.innerText === "파워링크" || el.innerText?.includes("광고등록") || el.querySelector('a[href*="adcr.naver.com"]')) {
                    const target = el.closest('div[style*="#fffff6"]') || el.closest('div[style*="rgb(255, 255, 246)"]') || el;
                    collapseNode(target);
                    target.remove();
                }
            });
        };

        const namuObserver = new MutationObserver(namuCleaner);
        namuObserver.observe(document.documentElement, { childList: true, subtree: true });
        setInterval(namuCleaner, 500);
    }
})();
