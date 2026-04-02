// ==UserScript==
// @name         DC & Namu Combined Stealth
// @version      3.9
// @description  디시(v2.4 고정) + 나무위키(디시식 위장술 이식 및 위아래 파워링크 박멸)
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
        const dcObserver = new MutationObserver(killFloatingGaejuki);
        dcObserver.observe(document.documentElement, { childList: true, subtree: true });
        window.addEventListener('scroll', killFloatingGaejuki, { passive: true });
    }

    /* --------------------------------------------------
       PART 2: 나무위키 (디시식 위장술 + 정밀 타격)
    -------------------------------------------------- */
    if (location.hostname.includes('namu.wiki')) {
        // 1. [위장술] 나무위키 보안팀 속이기 (디시 방식 이식)
        lock('ad_block_detected', false);
        lock('canRunAds', true);
        // veta 엔진이 살아있는 것처럼 속이되, 작동은 안 하게 설정
        if (!window.veta) {
            window.veta = { loadAd: () => {}, init: () => {}, getAds: () => [] };
        }

        // 2. [사용자 v2.4 로직] 빈 껍데기 상자 고속 판별
        function isMobileAdWrapperFast(div) {
            if (div.textContent.trim() !== '') return false;
            if (div.children.length !== 1 || div.children[0].tagName !== 'DIV') return false;
            const hasDataV = (el) => Array.from(el.attributes).some(a => a.name.startsWith('data-v-'));
            return hasDataV(div) && hasDataV(div.children[0]) && div.children[0].children.length === 0;
        }

        // 3. [네트워크 봉쇄] 광고 데이터만 '정상 빈 데이터'로 가로채기
        const adKeywords = ['adcr.naver.com', 'veta.naver.com', 'securepubads'];
        const originalFetch = window.fetch;
        window.fetch = async (...args) => {
            const url = typeof args[0] === 'string' ? args[0] : args[0]?.url;
            if (url && adKeywords.some(k => url.includes(k))) {
                return new Response(JSON.stringify({ ads: [], status: "success" }), { status: 200 });
            }
            return originalFetch.apply(window, args);
        };

        // 4. [정밀 클리너] 위아래 파워링크 및 좀비 상자 박멸
        const namuCleaner = () => {
            document.querySelectorAll('div').forEach(el => {
                // 파워링크 특유의 배경색(#fffff6)과 링크 패턴 타격
                if (el.innerText === "파워링크" || el.innerText === "광고등록" || el.querySelector('a[href*="adcr.naver.com"]')) {
                    const target = el.closest('div[style*="#fffff6"]') || el.closest('div[style*="rgb(255, 255, 246)"]') || el;
                    if (target.id !== 'app') collapseNode(target);
                }
                // 빈 광고 껍데기 판별 삭제
                if (isMobileAdWrapperFast(el)) collapseNode(el);
            });
        };

        const namuObserver = new MutationObserver(namuCleaner);
        namuObserver.observe(document.documentElement, { childList: true, subtree: true });
        
        // SPA 내부 이동 및 지연 렌더링 대응
        setInterval(namuCleaner, 700);
    }
})();
