// ==UserScript==
// @name         DC & Namu Combined Stealth
// @version      3.5
// @description  디시(v2.4 고정) + 나무위키(위아래 파워링크 원천 차단 및 레이아웃 강제 교정)
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
        if (!node || blocked.has(node) || node.id === 'app' || node.tagName === 'BODY') return;
        blocked.add(node);
        node.style.setProperty('display', 'none', 'important');
        node.style.setProperty('height', '0', 'important');
        node.style.setProperty('margin', '0', 'important');
        node.style.setProperty('padding', '0', 'important');
        node.setAttribute('data-blocked-by-script', 'true');
    };

    /* --------------------------------------------------
       PART 1: 디시인사이드 (검증된 v2.4 로직 100% 유지)
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
       PART 2: 나무위키 (v3.5 위아래 파워링크 완전 박멸)
    -------------------------------------------------- */
    if (location.hostname.includes('namu.wiki')) {
        // 1. [초고속 CSS] 광고 상자의 부모 구조까지 미리 투명화
        const style = document.createElement('style');
        style.textContent = `
            /* 파워링크 특유의 배경색과 구조 조준 */
            div[style*="#fffff6"], div[style*="rgb(255, 255, 246)"],
            .veta_ad_wrapper, .gn4Z21wj, .VBwhMBUe, 
            div:has(a[href*="adcr.naver.com"]),
            div:has(span:contains("파워링크")),
            iframe[src*="doubleclick.net"] { display: none !important; height: 0px !important; }
        `;
        (document.head || document.documentElement).appendChild(style);

        // 2. [네트워크 봉쇄] NamuLink 방식 Fetch/XHR 이중 가로채기
        const adKeywords = ['adcr.naver.com', 'veta.naver.com', 'securepubads', 'gpt.js'];
        const originalFetch = window.fetch;
        window.fetch = async (...args) => {
            const url = typeof args[0] === 'string' ? args[0] : args[0]?.url;
            if (url && adKeywords.some(k => url.includes(k))) {
                return new Response(JSON.stringify({ ads: [], status: "success" }), { status: 200 });
            }
            return originalFetch.apply(window, args);
        };

        // 3. [구조적 정밀 타격] 위/아래 광고 박스 강제 소거
        const namuCleaner = () => {
            // A. 파워링크 텍스트 기반 추적
            document.querySelectorAll('div, section, span').forEach(el => {
                const text = el.innerText || "";
                if (text === "파워링크" || text === "광고등록" || el.querySelector('a[href*="adcr.naver.com"]')) {
                    // 광고 텍스트를 포함한 가장 가까운 '연두색 배경' div를 찾아 삭제
                    const target = el.closest('div[style*="#fffff6"]') || el.closest('div[style*="rgb(255, 255, 246)"]') || el.closest('.veta_ad_wrapper') || el;
                    if (target && target.id !== 'app') collapseNode(target);
                }
            });

            // B. 빈 껍데기 상자(data-v-) 고속 삭제 (v2.4 로직 이식)
            document.querySelectorAll('div[data-v-]').forEach(div => {
                if (div.textContent.trim() === '' && div.children.length === 1 && div.children[0].tagName === 'DIV') {
                    collapseNode(div);
                }
            });
        };

        // 내부 이동(SPA) 및 실시간 DOM 감시
        const namuObserver = new MutationObserver(namuCleaner);
        namuObserver.observe(document.documentElement, { childList: true, subtree: true });
        setInterval(namuCleaner, 500); // 0.5초 간격으로 좀비 광고 체크
    }
})();
