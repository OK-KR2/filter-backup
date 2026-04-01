// ==UserScript==
// @name         DC & Namu Combined Stealth
// @version      2.7
// @description  디시(v2.4 유지) + 나무위키(NamuLink 최신 엔진 + 핵폭탄급 원천 차단)
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
    const collapseNode = (node) => {
        if (!node || blocked.has(node)) return;
        blocked.add(node);
        node.style.setProperty('display', 'none', 'important');
        node.style.setProperty('height', '0', 'important');
        node.style.setProperty('margin', '0', 'important');
        node.style.setProperty('padding', '0', 'important');
        node.setAttribute('data-blocked-by-script', 'true');
    };

    /* --------------------------------------------------
       PART 1: 디시인사이드 (사용자 만족도 최상 v2.4 로직 고정)
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
       PART 2: 나무위키 (v2.7 핵폭탄급 강화 로직)
    -------------------------------------------------- */
    if (location.hostname.includes('namu.wiki')) {
        // 1. [네트워크 봉쇄] fetch 및 XMLHttpRequest 이중 가로채기
        const adPatterns = ['adcr.naver.com', 'veta.naver.com', 'script.outbrain.com', 'doubleclick.net'];
        
        // Fetch 가로채기
        const originalFetch = window.fetch;
        window.fetch = async function(...args) {
            const url = typeof args[0] === 'string' ? args[0] : args[0]?.url;
            if (url && adPatterns.some(p => url.includes(p))) {
                return new Response(JSON.stringify({ ads: [], status: "success" }), { status: 200 });
            }
            return originalFetch.apply(this, args);
        };

        // XHR 가로채기 (네이버 veta 최신 변종 대응)
        const originalXHR = window.XMLHttpRequest.prototype.open;
        window.XMLHttpRequest.prototype.open = function(method, url) {
            if (typeof url === 'string' && adPatterns.some(p => url.includes(p))) {
                console.log("나무위키: 변종 XHR 광고 요청 차단 ☢️");
                return; 
            }
            return originalXHR.apply(this, arguments);
        };

        // 2. [엔진 무력화] window.veta 객체를 가짜(Proxy)로 교체하여 작동 불능화
        const fakeVeta = new Proxy({}, {
            get: (target, prop) => {
                if (typeof target[prop] === 'function') return () => {};
                return (prop === 'getAds') ? [] : undefined;
            }
        });
        Object.defineProperty(window, 'veta', { value: fakeVeta, writable: false });
        Object.defineProperty(window, 'ad_block_detected', { value: false, writable: false });

        // 3. [시각적 사살] MutationObserver 강화 및 레이아웃 강제 교정
        const namuCleaner = () => {
            // 파워링크 상자 및 네이버 광고 컨테이너 정밀 타격
            document.querySelectorAll('div, section, article').forEach(el => {
                if (el.innerText?.includes("파워링크") || 
                    el.querySelector('a[href*="adcr.naver.com"]') ||
                    el.className?.includes('veta') || 
                    el.id?.includes('veta')) {
                    
                    const target = el.closest('div[style*="background-color"]') || el;
                    if (target.parentNode) {
                        target.style.setProperty('display', 'none', 'important');
                        target.remove();
                    }
                }
            });
        };

        const namuObserver = new MutationObserver(namuCleaner);
        namuObserver.observe(document.documentElement, { childList: true, subtree: true });
        
        // 페이지 로드 후 끈질기게 되살아나는 놈들을 위해 주기적 청소 (1초 간격)
        setInterval(namuCleaner, 1000);
    }

})();
