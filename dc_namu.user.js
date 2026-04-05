// ==UserScript==
// @name         DC & Namu Combined Stealth
// @version      4.9.6
// @description  디시(네이티브 쿠키/스토리지 원천 차단) + 나무위키(v4.9 절대 고정)
// @match        *://*.dcinside.com/*
// @match        *://*.namu.wiki/*
// @run-at       document-start
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    /* --------------------------------------------------
       PART 1: 디시인사이드 (API 원천 가로채기 절대 방어)
    -------------------------------------------------- */
    if (location.hostname.includes('dcinside.com')) {

        // 1. [절대 방어] 브라우저 네이티브 쿠키/스토리지 API 가로채기
        // 디시 스크립트가 언제 로드되든 상관없이 '차단 낙인' 자체를 브라우저에 못 쓰게 막습니다.
        try {
            const cookieDesc = Object.getOwnPropertyDescriptor(Document.prototype, 'cookie') || Object.getOwnPropertyDescriptor(HTMLDocument.prototype, 'cookie');
            if (cookieDesc && cookieDesc.configurable) {
                Object.defineProperty(document, 'cookie', {
                    get: function() { return cookieDesc.get.call(document); },
                    set: function(val) {
                        if (val && (val.includes('find_ab=ok') || val.includes('adblock_detected'))) {
                            return; // 429 페널티 쿠키 저장 완전 거부
                        }
                        cookieDesc.set.call(document, val);
                    }
                });
            }

            const originalSetItem = Storage.prototype.setItem;
            Storage.prototype.setItem = function(key, value) {
                if (key === 'adblock_detected' || key === 'find_ab' || key === 'find_ab_check') {
                    return; // 로컬스토리지 차단 낙인 거부
                }
                originalSetItem.apply(this, arguments);
            };
        } catch (e) {}

        // 2. 혹시 이미 묻어있는 기존 낙인 세척
        localStorage.removeItem('adblock_detected');
        localStorage.removeItem('find_ab');
        localStorage.removeItem('find_ab_check');
        if (document.cookie.includes('find_ab=ok')) {
            document.cookie = "find_ab=no; expires=Thu, 01 Jan 2030 00:00:00 UTC; path=/; domain=.dcinside.com";
        }

        // 3. 서버 안심용 가짜 변수
        try {
            Object.defineProperty(window, 'is_adblock', { value: false, writable: false, configurable: false });
            Object.defineProperty(window, 'adblock_chk', { value: false, writable: false, configurable: false });
            Object.defineProperty(window, 'canRunAds', { value: true, writable: false, configurable: false });
            Object.defineProperty(window, 'is_ad_block', { value: 'N', writable: false, configurable: false });
        } catch (e) {}

        // 4. 안전 압착 CSS (차단 시 깔끔한 하얀 화면 유지)
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
       PART 2: 나무위키 (v4.9 로직 - 1바이트도 수정 안 함)
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
})();
