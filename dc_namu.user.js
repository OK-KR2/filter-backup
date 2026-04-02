// ==UserScript==
// @name         DC & Namu Combined Stealth
// @version      3.3
// @description  디시(v2.4 고정) + 나무위키(본문 증발 방지 및 외과수술식 차단)
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
        if (!node || blocked.has(node) || node.id === 'app') return; // 메인 앱 컨테이너 보호
        blocked.add(node);
        node.style.setProperty('display', 'none', 'important');
        node.style.setProperty('height', '0', 'important');
        node.setAttribute('data-blocked-by-script', 'true');
    };

    /* --------------------------------------------------
       PART 1: 디시인사이드 (검증된 v2.4 로직 유지)
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
       PART 2: 나무위키 (v3.3 화이트스크린 방지 강화)
    -------------------------------------------------- */
    if (location.hostname.includes('namu.wiki')) {
        // 1. [선제 방어] 메인 구조를 건드리지 않는 정밀 CSS
        const style = document.createElement('style');
        style.textContent = `
            /* 광고 상자 특유의 클래스와 색상만 조준 (메인 #app 제외) */
            div[style*="#fffff6"], div[style*="rgb(255, 255, 246)"],
            .gn4Z21wj, .VBwhMBUe, .veta_ad_wrapper,
            iframe[src*="doubleclick.net"] { display: none !important; height: 0px !important; visibility: hidden !important; }
        `;
        (document.head || document.documentElement).appendChild(style);

        // 2. [네트워크 가로채기] 사이트 중단 없는 안전한 데이터 필터링
        const adKeywords = ['adcr.naver.com', 'veta.naver.com', 'securepubads', 'gpt.js'];
        const originalFetch = window.fetch;
        window.fetch = async (...args) => {
            const url = typeof args[0] === 'string' ? args[0] : args[0]?.url;
            if (url && adKeywords.some(k => url.includes(k))) {
                return new Response(JSON.stringify({ ads: [], status: "success" }), { status: 200 });
            }
            return originalFetch.apply(window, args);
        };

        // 3. [시각적 사살] 본문을 보호하며 광고 텍스트만 솎아내기
        const namuCleaner = () => {
            document.querySelectorAll('div, section').forEach(el => {
                // 본문 전체(#app)를 포함하지 않는 작은 단위의 광고 노드만 타격
                if (el.innerText === "파워링크" || el.innerText === "광고등록") {
                    const target = el.closest('div[style*="#fffff6"]') || el.closest('div[style*="rgb(255, 255, 246)"]') || el;
                    if (target && target.id !== 'app' && target.tagName !== 'BODY') {
                        collapseNode(target);
                    }
                }
            });
        };

        const namuObserver = new MutationObserver(namuCleaner);
        namuObserver.observe(document.documentElement, { childList: true, subtree: true });
        setInterval(namuCleaner, 600);
    }
})();
