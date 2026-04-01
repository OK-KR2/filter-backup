// ==UserScript==
// @name         DC & Namu Combined Stealth
// @version      3.0
// @description  디시(v2.4 고정) + 나무위키(JSON 도청 및 원천 봉쇄)
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
        if (!node || blocked.has(node)) return;
        blocked.add(node);
        node.style.setProperty('display', 'none', 'important');
        node.style.setProperty('height', '0', 'important');
        node.setAttribute('data-blocked-by-script', 'true');
    };

    /* --------------------------------------------------
       PART 1: 디시인사이드 (v2.4 로직 유지)
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
       PART 2: 나무위키 (데이터 오염 및 선제적 타격)
    -------------------------------------------------- */
    if (location.hostname.includes('namu.wiki')) {
        // 1. [데이터 도청] JSON 파싱 단계에서 광고 데이터 삭제
        const originalParse = JSON.parse;
        JSON.parse = function() {
            let data = originalParse.apply(this, arguments);
            if (data && data.ads) { data.ads = []; } // 광고 리스트 강제 비우기
            return data;
        };

        // 2. [네트워크 봉쇄] XHR/Fetch 차단
        const killAdRequest = (url) => (url.includes('adcr.naver.com') || url.includes('veta.naver.com'));
        const originalFetch = window.fetch;
        window.fetch = async (...args) => {
            if (args[0] && killAdRequest(typeof args[0] === 'string' ? args[0] : args[0].url)) {
                return new Response(JSON.stringify({ads:[]}), {status: 200});
            }
            return originalFetch.apply(window, args);
        };

        // 3. [시각적 사살] 가장 강력한 CSS 주입 (파워링크 특유 색상 타격)
        const style = document.createElement('style');
        style.textContent = `
            div[style*="background-color: rgb(253, 255, 245)"], 
            div:has(a[href*="adcr.naver.com"]),
            .veta_ad_wrapper { display: none !important; height: 0px !important; }
        `;
        (document.head || document.documentElement).appendChild(style);

        const namuCleaner = () => {
            document.querySelectorAll('div').forEach(el => {
                // "파워링크"라는 글자가 포함된 컨테이너를 찾아서 부모 레이아웃까지 삭제
                if (el.innerText === "파워링크" || el.querySelector('a[href*="adcr.naver.com"]')) {
                    const target = el.closest('div[style*="background-color"]') || el;
                    collapseNode(target);
                }
            });
        };

        const namuObserver = new MutationObserver(namuCleaner);
        namuObserver.observe(document.documentElement, { childList: true, subtree: true });
        setInterval(namuCleaner, 800); // 사파리의 지연 렌더링에 대응
    }
})();
