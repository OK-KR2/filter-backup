// ==UserScript==
// @name         DC & Namu Combined Stealth
// @version      4.9.9
// @description  디시/나무위키(4.9.6 절대 고정) + 글로벌 클플 무한루프 완화 모듈
// @match        *://*.dcinside.com/*
// @match        *://*.namu.wiki/*
// @match        *://*/* // @run-at       document-start
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    /* --------------------------------------------------
       PART 1: 디시인사이드 (v4.9.6 원본 절대 고정)
    -------------------------------------------------- */
    if (location.hostname.includes('dcinside.com')) {
        try {
            const cookieDesc = Object.getOwnPropertyDescriptor(Document.prototype, 'cookie') || Object.getOwnPropertyDescriptor(HTMLDocument.prototype, 'cookie');
            if (cookieDesc && cookieDesc.configurable) {
                Object.defineProperty(document, 'cookie', {
                    get: function() { return cookieDesc.get.call(document); },
                    set: function(val) {
                        if (val && (val.includes('find_ab=ok') || val.includes('adblock_detected'))) {
                            return; 
                        }
                        cookieDesc.set.call(document, val);
                    }
                });
            }

            const originalSetItem = Storage.prototype.setItem;
            Storage.prototype.setItem = function(key, value) {
                if (key === 'adblock_detected' || key === 'find_ab' || key === 'find_ab_check') {
                    return; 
                }
                originalSetItem.apply(this, arguments);
            };
        } catch (e) {}

        localStorage.removeItem('adblock_detected');
        localStorage.removeItem('find_ab');
        localStorage.removeItem('find_ab_check');
        if (document.cookie.includes('find_ab=ok')) {
            document.cookie = "find_ab=no; expires=Thu, 01 Jan 2030 00:00:00 UTC; path=/; domain=.dcinside.com";
        }

        try {
            Object.defineProperty(window, 'is_adblock', { value: false, writable: false, configurable: false });
            Object.defineProperty(window, 'adblock_chk', { value: false, writable: false, configurable: false });
            Object.defineProperty(window, 'canRunAds', { value: true, writable: false, configurable: false });
            Object.defineProperty(window, 'is_ad_block', { value: 'N', writable: false, configurable: false });
        } catch (e) {}

        const style = document.createElement('style');
        style.textContent = `
            #moveOverlay, #moveimg, .adv-group, .adv-groupin, .adv-grouptop, .pwlink,
            .penalty-box, .pp-box:has(.penalty-box), div[id*="ad_middle"], iframe[src*="netinsight"] {
                height: 0px !important; min-height: 0px !important; margin: 0px !important; padding: 0px !important;
                border: 0px !important; overflow: hidden !important; visibility: hidden !important; opacity: 0 !important;
            }
        `;
        (document.head || document.documentElement).appendChild(style);

        const originalFetch = window.fetch;
        window.fetch = async (...args) => {
            const url = typeof args[0] === 'string' ? args[0] : args[0]?.url;
            if (url && (url.includes('ajax/naverad') || url.includes('naverad'))) {
                return new Response(JSON.stringify({ ads: [] }), { status: 200 });
            }
            return originalFetch.apply(window, args);
        };
    }

    /* --------------------------------------------------
       PART 2: 나무위키 (v4.9.6 원본 절대 고정)
    -------------------------------------------------- */
    if (location.hostname.includes('namu.wiki')) {
        const collapseNode = (node) => {
            if (!node || node.id === 'app' || node.id === 'eruda' || node.tagName === 'BODY') return;
            node.style.setProperty('display', 'none', 'important');
            node.style.setProperty('height', '0', 'important');
            node.style.setProperty('margin', '0', 'important');
            node.style.setProperty('padding', '0', 'important');
            node.setAttribute('data-blocked-by-stealth', 'true');
        };

        const style = document.createElement('style');
        style.textContent = `
            [data-v-aed07d7a], .veta_ad_wrapper, .gn4Z21wj, .VBwhMBUe, ._3Dy97h7l,
            div[class*="vKJY7-f5"], div[class*="HJeR5GcT"], 
            div:has(> a[href*="adcr.naver.com"]), div[style*="#fffff6"],
            iframe[src*="doubleclick.net"] {
                display: none !important; height: 0px !important; margin: 0px !important; padding: 0px !important; opacity: 0 !important;
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
                    const target = el.closest('div[class*="vKJY7-f5"]') || el.closest('div[class*="_"]') || el;
                    if (target && target.id !== 'app' && target.id !== 'eruda') {
                        collapseNode(target);
                        if (target.parentNode) target.remove();
                    }
                }
            });
        };

        new MutationObserver(namuCleaner).observe(document.documentElement, { childList: true, subtree: true });
        let fastClean = setInterval(namuCleaner, 50);
        setTimeout(() => { clearInterval(fastClean); setInterval(namuCleaner, 600); }, 3000);
    }

    /* --------------------------------------------------
       PART 3: 클라우드플레어 무한루프 방어막 (모든 사이트 적용)
    -------------------------------------------------- */
    (function preventCloudflareLoop() {
        // 화면이 클라우드플레어 인증창(잠시만 기다리십시오)인지 식별
        const isCloudflare = document.title.includes('사람인지 확인하십시오') || 
                             document.title.includes('잠시만 기다리십시오') || 
                             document.querySelector('script[src*="/cdn-cgi/challenge-platform"]');
        
        if (isCloudflare) {
            try {
                // 1. 애드가드를 봇으로 오해하게 만드는 브라우저 속성 숨기기
                Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
                
                // 2. 꼬여버린 세션 데이터(루프 원인) 강제 초기화
                sessionStorage.clear();
            } catch (e) {}
        }
    })();

})();
