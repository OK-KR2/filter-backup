// ==UserScript==
// @name         DC & Namu Combined Stealth
// @version      3.6
// @description  디시(v2.4 고정) + 나무위키(사이트 마비 방지 + 광고 엔진 가짜 위장)
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
        if (!node || blocked.has(node) || node.id === 'app') return;
        blocked.add(node);
        node.style.setProperty('display', 'none', 'important');
        node.style.setProperty('height', '0', 'important');
        node.style.setProperty('margin', '0', 'important');
        node.setAttribute('data-blocked-by-script', 'true');
    };

    /* --------------------------------------------------
       PART 1: 디시인사이드 (검증된 v2.4 로직 100% 동일 유지)
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
       PART 2: 나무위키 (v3.6 엔진 무력화 및 강제 소거)
    -------------------------------------------------- */
    if (location.hostname.includes('namu.wiki')) {
        // 1. [핵심] 광고 엔진 가짜 위장 (화이트스크린 방지용)
        const mockFn = () => {};
        const mockAdObj = {
            loadAd: mockFn, init: mockFn, getAds: () => [], setTargeting: mockFn,
            display: mockFn, enableServices: mockFn, pubads: () => mockAdObj,
            addEventListener: mockFn, defineSlot: () => mockAdObj, addService: () => mockAdObj
        };

        // 객체를 삭제하지 않고, 속성만 '무반응'으로 고정
        const safeLock = (name) => {
            try {
                Object.defineProperty(window, name, {
                    get: () => mockAdObj,
                    set: () => {},
                    configurable: false
                });
            } catch (e) {}
        };
        safeLock('veta'); safeLock('googletag'); safeLock('adsbygoogle');

        // 2. [강력 CSS] 파워링크 상자 및 변종 클래스 정밀 타격
        const style = document.createElement('style');
        style.textContent = `
            div[style*="#fffff6"], div[style*="rgb(255, 255, 246)"],
            .veta_ad_wrapper, .gn4Z21wj, .VBwhMBUe, 
            div:has(a[href*="adcr.naver.com"]),
            div[class*="veta-ad"],
            iframe[src*="doubleclick.net"] { display: none !important; height: 0px !important; }
        `;
        (document.head || document.documentElement).appendChild(style);

        // 3. [시각적 박멸] MutationObserver + 고속 청소
        const namuCleaner = () => {
            document.querySelectorAll('div, section').forEach(el => {
                // 파워링크 텍스트 또는 네이버 광고 링크 포함 시 부모 노드 삭제
                if (el.innerText === "파워링크" || el.innerText === "광고등록" || el.querySelector('a[href*="adcr.naver.com"]')) {
                    const target = el.closest('div[style*="#fffff6"]') || el.closest('div[style*="rgb(255, 255, 246)"]') || el.closest('.veta_ad_wrapper') || el;
                    if (target && target.id !== 'app' && target.tagName !== 'BODY') {
                        collapseNode(target);
                    }
                }
            });
        };

        const namuObserver = new MutationObserver(namuCleaner);
        namuObserver.observe(document.documentElement, { childList: true, subtree: true });
        
        // SPA 내부 이동 시 방어선 재구축
        let lastUrl = location.href;
        setInterval(() => {
            if (location.href !== lastUrl) {
                lastUrl = location.href;
                namuCleaner();
            }
        }, 500);
    }
})();
