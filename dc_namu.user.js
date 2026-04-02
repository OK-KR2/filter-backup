// ==UserScript==
// @name         DC & Namu Combined Stealth
// @version      4.1
// @description  디시(v2.4 고정) + 나무위키(data-v- 속성 기반 원천 박멸 및 위장술 강화)
// @match        *://*.dcinside.com/*
// @match        *://*.namu.wiki/*
// @updateURL    https://raw.githubusercontent.com/OK-KR2/filter-backup/main/dc_namu.user.js
// @downloadURL  https://raw.githubusercontent.com/OK-KR2/filter-backup/main/dc_namu.user.js
// @run-at       document-start
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    const collapseNode = (node) => {
        if (!node || node.id === 'app' || node.tagName === 'BODY') return;
        node.style.setProperty('display', 'none', 'important');
        node.style.setProperty('height', '0', 'important');
        node.setAttribute('data-blocked-by-stealth', 'true');
    };

    const lock = (p, v) => {
        try { Object.defineProperty(window, p, { value: v, writable: false, configurable: false }); } catch (e) {}
    };

    /* --------------------------------------------------
       PART 1: 디시인사이드 (검증된 v2.4 로직 유지)
    -------------------------------------------------- */
    if (location.hostname.includes('dcinside.com')) {
        lock('is_adblock', false); lock('adblock_chk', false); lock('canRunAds', true); lock('is_ad_block', 'N');
        const killFloatingGaejuki = () => {
            document.querySelectorAll('div').forEach(el => {
                const style = window.getComputedStyle(el);
                if ((style.position === 'fixed' || style.position === 'sticky') && (el.innerHTML.includes('error/adblock') || el.querySelector('img[src*="gaeju"]'))) {
                    collapseNode(el); el.remove();
                }
            });
        };
        new MutationObserver(killFloatingGaejuki).observe(document.documentElement, { childList: true, subtree: true });
        window.addEventListener('scroll', killFloatingGaejuki, { passive: true });
    }

    /* --------------------------------------------------
       PART 2: 나무위키 (주민번호 data-v-aed07d7a 정밀 타격)
    -------------------------------------------------- */
    if (location.hostname.includes('namu.wiki')) {
        // 1. [초강력 CSS] 광고 전용 속성(data-v-aed07d7a)이 보이면 즉시 소멸
        const style = document.createElement('style');
        style.textContent = `
            [data-v-aed07d7a], .veta_ad_wrapper, .gn4Z21wj, .VBwhMBUe,
            div:has(> a[href*="adcr.naver.com"]),
            div:has(span:contains("파워링크")) { 
                display: none !important; height: 0px !important; visibility: hidden !important; 
            }
        `;
        (document.head || document.documentElement).appendChild(style);

        // 2. [위장술 강화] 사이트 엔진이 우리를 '동료'로 인식하게 함
        const mockAd = { loadAd: () => {}, init: () => {}, getAds: () => [], setTargeting: () => {}, display: () => {}, enableServices: () => {}, pubads: () => mockAd, addService: () => mockAd };
        window.veta = mockAd;
        window.googletag = window.googletag || mockAd;
        window.ad_block_detected = false;
        window.canRunAds = true;

        // 3. [네트워크 실시간 가로채기]
        const adKeywords = ['adcr.naver.com', 'veta.naver.com', 'securepubads', 'gpt.js'];
        const originalFetch = window.fetch;
        window.fetch = async (...args) => {
            const url = typeof args[0] === 'string' ? args[0] : args[0]?.url;
            if (url && adKeywords.some(k => url.includes(k))) {
                return new Response(JSON.stringify({ ads: [], status: "success" }), { status: 200 });
            }
            return originalFetch.apply(window, args);
        };

        // 4. [정밀 클리너] 속성 및 텍스트 기반 복합 타격
        const namuCleaner = () => {
            document.querySelectorAll('div, section').forEach(el => {
                // 소스에서 확인된 핵심 속성 및 텍스트 매칭
                const isAd = el.hasAttribute('data-v-aed07d7a') || 
                             el.innerText === "파워링크" || 
                             el.innerText === "광고등록" ||
                             el.querySelector('a[href*="adcr.naver.com"]');
                
                if (isAd && el.id !== 'app') {
                    collapseNode(el);
                }
            });
        };

        // MutationObserver: SPA 내부 이동 및 재주입 실시간 방어
        new MutationObserver(namuCleaner).observe(document.documentElement, { childList: true, subtree: true });
        
        // 0.4초 주기로 좀비 광고 박멸 (사파리 속도 대응)
        setInterval(namuCleaner, 400);
    }
})();
