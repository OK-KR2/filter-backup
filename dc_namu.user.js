// ==UserScript==
// @name         DC & Namu Combined Stealth
// @version      3.4
// @description  디시(v2.4 고정) + 나무위키(내부 검색 이동 대응 및 하단 로딩 정상화)
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
       PART 2: 나무위키 (v3.4 내부 이동 대응 및 로딩 정상화)
    -------------------------------------------------- */
    if (location.hostname.includes('namu.wiki')) {
        // 1. [선제적 CSS] 하단 영역(#app 이후)은 건드리지 않고 본문 내 광고만 타격
        const style = document.createElement('style');
        style.textContent = `
            div[style*="#fffff6"], div[style*="rgb(255, 255, 246)"],
            .gn4Z21wj, .VBwhMBUe, .veta_ad_wrapper { display: none !important; }
        `;
        (document.head || document.documentElement).appendChild(style);

        // 2. [네트워크 가로채기] 광고 데이터만 선별적으로 차단 (사이트 기능 보호)
        const adKeywords = ['adcr.naver.com', 'veta.naver.com', 'securepubads'];
        const originalFetch = window.fetch;
        window.fetch = async (...args) => {
            const url = typeof args[0] === 'string' ? args[0] : args[0]?.url;
            if (url && adKeywords.some(k => url.includes(k))) {
                return new Response(JSON.stringify({ ads: [], status: "success" }), { status: 200 });
            }
            return originalFetch.apply(window, args);
        };

        // 3. [정밀 청소기] 내부 검색/이동 시에도 작동하도록 실시간 감시 강화
        const namuCleaner = () => {
            // 본문 내 광고 텍스트 및 레이아웃 박멸
            document.querySelectorAll('div, section').forEach(el => {
                if (el.innerText === "파워링크" || el.innerText === "광고등록") {
                    const target = el.closest('div[style*="#fffff6"]') || el.closest('div[style*="rgb(255, 255, 246)"]') || el;
                    // 메인 레이아웃 파괴 방지 및 본문 내 요소만 타격
                    if (target && target.id !== 'app' && target.tagName !== 'BODY') {
                        collapseNode(target);
                    }
                }
            });
        };

        // 내부 이동(검색 등) 감지를 위한 URL 변화 모니터링
        let lastUrl = location.href;
        const urlObserver = new MutationObserver(() => {
            if (location.href !== lastUrl) {
                lastUrl = location.href;
                console.log("나무위키: 내부 이동 감지 - 방어선 재설정 🎯");
                setTimeout(namuCleaner, 200); // 이동 후 렌더링 타이밍 대기
            }
        });
        urlObserver.observe(document, { subtree: true, childList: true });

        // 실시간 DOM 변화 감시 및 주기적 청소
        const namuObserver = new MutationObserver(namuCleaner);
        namuObserver.observe(document.documentElement, { childList: true, subtree: true });
        setInterval(namuCleaner, 700);
    }
})();
