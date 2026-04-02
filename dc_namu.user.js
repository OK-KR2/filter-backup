// ==UserScript==
// @name         DC & Namu Combined Stealth
// @version      4.3
// @description  디시(v2.4 고정) + 나무위키(깜빡임 방지 및 공간 완전 소멸)
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
        node.style.setProperty('margin', '0', 'important');
        node.style.setProperty('padding', '0', 'important');
        node.style.setProperty('opacity', '0', 'important');
        node.setAttribute('data-blocked-by-stealth', 'true');
    };

    const lock = (p, v) => {
        try { Object.defineProperty(window, p, { value: v, writable: false, configurable: false }); } catch (e) {}
    };

    /* --------------------------------------------------
       PART 1: 디시인사이드 (검증된 v2.4 로직 100% 동일 유지)
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
       PART 2: 나무위키 (v4.3 깜빡임 방지 및 진공 박멸)
    -------------------------------------------------- */
    if (location.hostname.includes('namu.wiki')) {
        // 1. [철권 CSS] 광고가 생기기도 전에 공간을 0으로 압축 (깜빡임 방지 핵심)
        const style = document.createElement('style');
        style.textContent = `
            /* 주민번호 data-v-aed07d7a가 붙은 모든 레이아웃 즉시 소멸 */
            [data-v-aed07d7a], .veta_ad_wrapper, .gn4Z21wj, .VBwhMBUe, ._3Dy97h7l,
            div:has(> a[href*="adcr.naver.com"]),
            div[style*="background-color: #fffff6"],
            iframe[src*="doubleclick.net"] { 
                display: none !important; height: 0px !important; margin: 0px !important; padding: 0px !important; opacity: 0 !important; pointer-events: none !important;
            }
        `;
        (document.head || document.documentElement).appendChild(style);

        // 2. [신분 세탁] "난 광고 차단 안 한다"고 계속 속임
        const mockAd = { loadAd: () => {}, init: () => {}, getAds: () => [], setTargeting: () => {}, display: () => {}, enableServices: () => {}, pubads: () => mockAd, addService: () => mockAd };
        window.veta = window.veta || mockAd;
        window.googletag = window.googletag || mockAd;
        window.ad_block_detected = false;
        window.canRunAds = true;

        // 3. [초고속 진공 청소] 0.1초 단위로 재생성 시도 자체를 박살
        const namuCleaner = () => {
            // 소스 분석 기반: 특정 속성 및 텍스트 포함 시 부모까지 소거
            document.querySelectorAll('div, section').forEach(el => {
                if (el.hasAttribute('data-v-aed07d7a') || el.innerText === "파워링크" || el.querySelector('a[href*="adcr.naver.com"]')) {
                    // 가장 바깥쪽 광고 컨테이너 찾기 (._3Dy97h7l 같은 클래스)
                    const target = el.closest('div[class*="_"]') || el;
                    if (target && target.id !== 'app') {
                        collapseNode(target);
                        if (target.parentNode) target.remove(); // 아예 뿌리(DOM)를 뽑아버림
                    }
                }
            });
        };

        // 실시간 감시 (SPA 내부 검색 및 렌더링 즉각 대응)
        new MutationObserver(namuCleaner).observe(document.documentElement, { childList: true, subtree: true });
        
        // 페이지 로드 직후 3초간은 0.1초 간격으로 '무자비 청소'
        let fastClean = setInterval(namuCleaner, 100);
        setTimeout(() => {
            clearInterval(fastClean);
            setInterval(namuCleaner, 600); // 이후엔 배터리 절약을 위해 속도 조절
        }, 3000);
    }
})();
