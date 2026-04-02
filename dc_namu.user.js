// ==UserScript==
// @name         DC & Namu Combined Stealth
// @version      3.8
// @description  디시(v2.4 고정) + 나무위키(v3.4 기반 로딩 복구 및 위아래 파워링크 박멸)
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
       PART 2: 나무위키 (v3.8 로딩 복구 및 정밀 타격)
    -------------------------------------------------- */
    if (location.hostname.includes('namu.wiki')) {
        // 1. [사용자 v2.4 로직] 빈 껍데기 상자 고속 판별 함수 (이게 제일 정확함)
        function isMobileAdWrapperFast(div) {
            if (div.textContent.trim() !== '') return false;
            if (div.children.length !== 1 || div.children[0].tagName !== 'DIV') return false;
            const hasDataV = (el) => Array.from(el.attributes).some(a => a.name.startsWith('data-v-'));
            return hasDataV(div) && hasDataV(div.children[0]) && div.children[0].children.length === 0;
        }

        // 2. [정밀 클리너] 로딩을 방해하지 않고 광고만 삭제
        const namuProcess = () => {
            document.querySelectorAll('div').forEach(el => {
                // 상단/하단 파워링크 특유의 배경색과 텍스트 타격
                if (el.innerText === "파워링크" || el.innerText === "광고등록" || el.querySelector('a[href*="adcr.naver.com"]')) {
                    const target = el.closest('div[style*="#fffff6"]') || el.closest('div[style*="rgb(255, 255, 246)"]') || el;
                    if (target.id !== 'app') collapseNode(target);
                }
                // 빈 광고 껍데기 삭제
                if (isMobileAdWrapperFast(el)) {
                    collapseNode(el);
                }
            });
        };

        // 3. [로딩 보호 감시] 사이트 기능(하단 로딩)은 살리면서 본문 광고만 추적
        const namuObserver = new MutationObserver((mutations) => {
            mutations.forEach(m => {
                m.addedNodes.forEach(node => {
                    if (node.nodeType === 1) {
                        if (isMobileAdWrapperFast(node)) collapseNode(node);
                        // 내부 이동 시 발생하는 본문 업데이트 대응
                        if (node.innerText?.includes("파워링크")) namuProcess();
                    }
                });
            });
            namuProcess();
        });

        namuObserver.observe(document.documentElement, { childList: true, subtree: true });
        
        // 4. [네트워크 안전 필터] 광고 데이터만 걸러내고 나머지는 통과
        const originalFetch = window.fetch;
        window.fetch = async (...args) => {
            const url = typeof args[0] === 'string' ? args[0] : args[0]?.url;
            if (url && (url.includes('adcr.naver.com') || url.includes('veta.naver.com'))) {
                return new Response(JSON.stringify({ ads: [], status: "success" }), { status: 200 });
            }
            return originalFetch.apply(window, args);
        };

        setInterval(namuProcess, 800); // 주기적 체크로 좀비 광고 대응
    }
})();
