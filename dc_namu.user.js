// ==UserScript==
// @name         DC & Namu Combined Stealth
// @version      3.7
// @description  디시(v2.4 고정) + 나무위키(사파리 렌더링 선점 및 파워링크 즉시 소멸)
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
        node.style.setProperty('overflow', 'hidden', 'important');
        node.setAttribute('data-blocked-by-ai', 'true');
    };

    /* --------------------------------------------------
       PART 1: 디시인사이드 (사용자 만족 v2.4 로직 100% 동일 유지)
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
       PART 2: 나무위키 (v3.7 사파리 최적화 박멸 로직)
    -------------------------------------------------- */
    if (location.hostname.includes('namu.wiki')) {
        // 1. [선제 타격] 광고 상자가 들어올 '자리'를 미리 지워버리는 CSS
        const style = document.createElement('style');
        style.textContent = `
            /* 연두색 배경 광고 및 변종 클래스 정조준 */
            div[style*="#fffff6"], div[style*="rgb(255, 255, 246)"],
            div:has(> a[href*="adcr.naver.com"]),
            .veta_ad_wrapper, .gn4Z21wj, .VBwhMBUe, .veta-ad,
            div:has(span:empty):has(iframe),
            iframe[src*="doubleclick.net"] { 
                display: none !important; height: 0px !important; opacity: 0 !important; pointer-events: none !important;
            }
        `;
        (document.head || document.documentElement).appendChild(style);

        // 2. [데이터 필터] Fetch/XHR 가로채기 (NamuLink 방식 강화)
        const adKeywords = ['adcr.naver.com', 'veta.naver.com', 'securepubads', 'gpt.js'];
        const originalFetch = window.fetch;
        window.fetch = async (...args) => {
            const url = typeof args[0] === 'string' ? args[0] : args[0]?.url;
            if (url && adKeywords.some(k => url.includes(k))) {
                return new Response(JSON.stringify({ ads: [], status: "success" }), { status: 200 });
            }
            return originalFetch.apply(window, args);
        };

        // 3. [무차별 소거] 텍스트가 아닌 '구조'를 보고 솎아내기
        const namuCleaner = () => {
            // "파워링크"라는 텍스트가 조금이라도 섞인 모든 레이아웃 추적
            document.querySelectorAll('div, section, span').forEach(el => {
                if (el.innerText === "파워링크" || el.innerText === "광고등록" || (el.tagName === 'A' && el.href.includes('adcr.naver.com'))) {
                    const target = el.closest('div[style*="background-color"]') || el.closest('div[class]') || el;
                    if (target && target.id !== 'app' && !target.contains(document.querySelector('article'))) {
                        collapseNode(target);
                    }
                }
            });
        };

        // 실시간 DOM 감시 및 고속 반복 (사파리 렌더링 속도 대응)
        const namuObserver = new MutationObserver(namuCleaner);
        namuObserver.observe(document.documentElement, { childList: true, subtree: true });
        
        // 페이지 로드 직후 3초간은 0.1초 주기로 초고속 청소
        let fastClean = setInterval(namuCleaner, 100);
        setTimeout(() => {
            clearInterval(fastClean);
            setInterval(namuCleaner, 600); // 이후에는 평상시 속도로 전환
        }, 3000);
    }
})();
