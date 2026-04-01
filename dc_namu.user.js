// ==UserScript==
// @name         DC & Namu Combined Stealth
// @version      2.9
// @description  디시(v2.4 유지) + 나무위키(XHR/Fetch 이중 가로채기 및 사파리 최적화)
// @match        *://*.dcinside.com/*
// @match        *://*.namu.wiki/*
// @updateURL    https://raw.githubusercontent.com/OK-KR2/filter-backup/main/dc_namu.user.js
// @downloadURL  https://raw.githubusercontent.com/OK-KR2/filter-backup/main/dc_namu.user.js
// @run-at       document-start
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    /* [공통 유틸리티] */
    const blocked = new WeakSet();
    function collapseNode(node) {
        if (!node || blocked.has(node)) return;
        blocked.add(node);
        node.style.setProperty('display', 'none', 'important');
        node.style.setProperty('height', '0', 'important');
        node.style.setProperty('margin', '0', 'important');
        node.style.setProperty('padding', '0', 'important');
        node.setAttribute('data-blocked-by-script', 'true');
    }

    /* --------------------------------------------------
       PART 1: 디시인사이드 (사용자 만족 v2.4 로직 100% 동일 유지)
    -------------------------------------------------- */
    if (location.hostname.includes('dcinside.com')) {
        const lock = (p, v) => {
            try { Object.defineProperty(window, p, { value: v, writable: false, configurable: false }); } catch (e) {}
        };
        lock('is_adblock', false);
        lock('adblock_chk', false);
        lock('canRunAds', true);
        lock('is_ad_block', 'N');

        const killFloatingGaejuki = () => {
            document.querySelectorAll('div').forEach(el => {
                const style = window.getComputedStyle(el);
                if (style.position === 'fixed' || style.position === 'sticky') {
                    if (el.innerHTML.includes('error/adblock') || el.querySelector('img[src*="gaeju"]')) {
                        collapseNode(el);
                        el.remove();
                    }
                }
            });
        };
        const dcObserver = new MutationObserver(killFloatingGaejuki);
        dcObserver.observe(document.documentElement, { childList: true, subtree: true });
        window.addEventListener('scroll', killFloatingGaejuki, { passive: true });
    }

    /* --------------------------------------------------
       PART 2: 나무위키 (사파리 모바일 전용 강화 엔진)
    -------------------------------------------------- */
    if (location.hostname.includes('namu.wiki')) {
        // 1. [선제적 방어] 광고 상자가 그려지기 전 CSS로 원천 차단
        const style = document.createElement('style');
        style.textContent = `
            div[class*="veta-ad"], .veta_ad_wrapper, 
            div:has(a[href*="adcr.naver.com"]),
            div[style*="background-color: rgb(253, 255, 245)"] { 
                display: none !important; height: 0px !important; 
            }
        `;
        (document.head || document.documentElement).appendChild(style);

        // 2. [네트워크 이중 봉쇄] Fetch + XMLHttpRequest 가로채기
        const adKeywords = ['adcr.naver.com', 'veta.naver.com', 'veta-ad', 'powerlink'];

        // Fetch 가로채기
        const originalFetch = window.fetch;
        window.fetch = async function(...args) {
            const url = typeof args[0] === 'string' ? args[0] : args[0]?.url;
            if (url && adKeywords.some(k => url.includes(k))) {
                return new Response(JSON.stringify({ ads: [], status: "success" }), { status: 200 });
            }
            return originalFetch.apply(this, args);
        };

        // XMLHttpRequest 가로채기 (사파리 모바일 대응 핵심)
        const originalOpen = XMLHttpRequest.prototype.open;
        XMLHttpRequest.prototype.open = function(method, url) {
            if (typeof url === 'string' && adKeywords.some(k => url.includes(k))) {
                console.log("나무위키: XHR 광고 요청 차단 성공 🎯");
                return; 
            }
            return originalOpen.apply(this, arguments);
        };

        // 3. [시각적 사살] MutationObserver + 고속 정리
        const namuProcess = () => {
            document.querySelectorAll('div').forEach(el => {
                if (el.innerText?.includes("파워링크") || el.querySelector('a[href*="adcr.naver.com"]')) {
                    const target = el.closest('div[style*="background-color"]') || el;
                    collapseNode(target);
                }
            });
        };

        const namuObserver = new MutationObserver(namuProcess);
        namuObserver.observe(document.documentElement, { childList: true, subtree: true });
        setInterval(namuProcess, 500); // 사파리의 유동적 렌더링 대응을 위해 0.5초 주기로 체크
    }

})();
