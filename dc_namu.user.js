// ==UserScript==
// @name         DC & Namu Combined Stealth
// @version      3.6
// @description  디시(v2.4 고정) + 나무위키(하단 로딩 정상화 및 SPA 내부 이동 완벽 대응)
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
       PART 2: 나무위키 (v3.6 하단 로딩 살리기 + SPA 이동 대응)
    -------------------------------------------------- */
    if (location.hostname.includes('namu.wiki')) {
        // 1. [CSS 선제 차단] 본문(#app) 외부의 광고 컨테이너만 조준
        const style = document.createElement('style');
        style.textContent = `
            div[style*="#fffff6"], div[style*="rgb(255, 255, 246)"],
            .veta_ad_wrapper, .gn4Z21wj, .VBwhMBUe,
            div:has(> a[href*="adcr.naver.com"]),
            iframe[src*="doubleclick.net"] { display: none !important; height: 0px !important; }
        `;
        (document.head || document.documentElement).appendChild(style);

        // 2. [네트워크 가로채기] 광고 데이터만 빈 값으로 응답
        const adKeywords = ['adcr.naver.com', 'veta.naver.com', 'securepubads', 'gpt.js'];
        const originalFetch = window.fetch;
        window.fetch = async (...args) => {
            const url = typeof args[0] === 'string' ? args[0] : args[0]?.url;
            if (url && adKeywords.some(k => url.includes(k))) {
                return new Response(JSON.stringify({ ads: [], status: "success" }), { status: 200 });
            }
            return originalFetch.apply(window, args);
        };

        // 3. [외과수술식 청소] 하단 데이터를 보존하며 광고 텍스트만 제거
        const namuSurgicalCleaner = () => {
            document.querySelectorAll('div, section, span').forEach(el => {
                // "파워링크" 또는 "광고등록" 텍스트가 명확히 적힌 컨테이너만 타격
                if (el.innerText === "파워링크" || el.innerText === "광고등록") {
                    const target = el.closest('div[style*="#fffff6"]') || el.closest('div[style*="rgb(255, 255, 246)"]') || el.closest('.veta_ad_wrapper') || el;
                    // 메인 레이아웃(#app)이나 전체 페이지(BODY)가 아니면 삭제
                    if (target && target.id !== 'app' && target.tagName !== 'BODY') {
                        collapseNode(target);
                    }
                }
            });
        };

        // 내부 검색 및 페이지 이동(SPA) 감지
        let lastPath = location.pathname;
        const spaObserver = new MutationObserver(() => {
            if (location.pathname !== lastPath) {
                lastPath = location.pathname;
                console.log("나무위키: 내부 이동 감지 - 방어선 즉시 재가동 🎯");
                setTimeout(namuSurgicalCleaner, 100); 
                setTimeout(namuSurgicalCleaner, 500); // 렌더링 지연 대응
            }
        });
        spaObserver.observe(document.body, { childList: true, subtree: true });

        // 실시간 감시 및 주기적 청소 (데이터 로딩을 위해 간격 조정)
        const namuObserver = new MutationObserver(namuSurgicalCleaner);
        namuObserver.observe(document.documentElement, { childList: true, subtree: true });
        setInterval(namuSurgicalCleaner, 800);
    }
})();
