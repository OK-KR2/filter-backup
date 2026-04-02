// ==UserScript==
// @name         DC & Namu Combined Stealth
// @version      4.0
// @description  디시(v2.4 고정) + 나무위키(SPA 완벽 대응 및 충돌 방지 위장술)
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
    const collapseNode = (node) => {
        if (!node || node.id === 'app' || node.tagName === 'BODY') return;
        node.style.setProperty('display', 'none', 'important');
        node.style.setProperty('height', '0', 'important');
        node.setAttribute('data-blocked-by-stealth', 'true');
    };

    /* --------------------------------------------------
       PART 1: 디시인사이드 (사용자 만족 v2.4 로직 100% 유지)
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
       PART 2: 나무위키 (v4.0 위장술 및 SPA 실시간 대응)
    -------------------------------------------------- */
    if (location.hostname.includes('namu.wiki')) {
        // 1. [정밀 위장술] 에러를 유발하지 않는 가짜 객체 주입 (화면 멈춤 방지)
        const mockAd = { loadAd: () => {}, init: () => {}, getAds: () => [], setTargeting: () => {}, display: () => {}, enableServices: () => {}, pubads: () => mockAd, addService: () => mockAd };
        
        // writable: true로 설정하여 사이트 스크립트와의 충돌(에러)을 원천 차단
        window.veta = mockAd;
        window.googletag = window.googletag || mockAd;
        window.ad_block_detected = false;
        window.canRunAds = true;

        // 2. [네트워크 필터] 로딩에 필요한 데이터는 통과, 광고만 차단
        const originalFetch = window.fetch;
        window.fetch = async (...args) => {
            const url = typeof args[0] === 'string' ? args[0] : args[0]?.url;
            if (url && (url.includes('adcr.naver.com') || url.includes('veta.naver.com') || url.includes('securepubads'))) {
                return new Response(JSON.stringify({ ads: [], status: "success" }), { status: 200 });
            }
            return originalFetch.apply(window, args);
        };

        // 3. [SPA 대응 청소기] 내부 이동 및 렌더링 시 즉각 삭제
        const namuCleaner = () => {
            // 소스 분석에서 발견된 광고 전용 데이터 속성(data-v-aed07d7a) 및 텍스트 정조준
            document.querySelectorAll('div, section').forEach(el => {
                const isAdContainer = el.getAttribute('data-v-aed07d7a') !== null || el.className.includes('veta_ad');
                const hasAdText = el.innerText === "파워링크" || el.innerText === "광고등록";
                
                if ((isAdContainer || hasAdText || el.querySelector('a[href*="adcr.naver.com"]'))) {
                    const target = el.closest('div[style*="#fffff6"]') || el.closest('div[style*="rgb(255, 255, 246)"]') || el;
                    if (target.id !== 'app') collapseNode(target);
                }
            });
        };

        // 실시간 DOM 변화 감시 (내부 검색 이동 시에도 작동)
        const namuObserver = new MutationObserver(namuCleaner);
        namuObserver.observe(document.documentElement, { childList: true, subtree: true });
        
        // URL 변화 감시 (SPA 대응)
        let lastUrl = location.href;
        setInterval(() => {
            if (lastUrl !== location.href) {
                lastUrl = location.href;
                namuCleaner();
            }
        }, 500);
        
        namuCleaner();
    }
})();
