// ==UserScript==
// @name         DC & Namu Combined Stealth
// @version      2.8
// @description  디시(v2.4 유지) + 나무위키(접속 오류 수정 및 NamuLink 엔진 이식)
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
    const blocked = new WeakSet();
    function collapseNode(node) {
        if (!node || blocked.has(node)) return;
        blocked.add(node);
        node.style.setProperty('display', 'none', 'important');
        node.style.setProperty('height', '0', 'important');
        node.style.setProperty('margin', '0', 'important');
        node.style.setProperty('padding', '0', 'important');
        node.setAttribute('data-blocked-by-script', 'true');
    }

    /* --------------------------------------------------
       PART 1: 디시인사이드 (사용자 요청에 따라 v2.4 로직 100% 동일 유지)
    -------------------------------------------------- */
    if (location.hostname.includes('dcinside.com')) {
        const lock = (p, v) => {
            try { Object.defineProperty(window, p, { value: v, writable: false, configurable: false }); } catch (e) {}
        };
        
        lock('is_adblock', false);
        lock('adblock_chk', false);
        lock('canRunAds', true);
        lock('is_ad_block', 'N');

        const killFloatingGaejuki = () => {
            document.querySelectorAll('div').forEach(el => {
                const style = window.getComputedStyle(el);
                if (style.position === 'fixed' || style.position === 'sticky') {
                    if (el.innerHTML.includes('error/adblock') || el.querySelector('img[src*="gaeju"]')) {
                        collapseNode(el);
                        el.remove();
                    }
                }
            });
        };

        const dcObserver = new MutationObserver(killFloatingGaejuki);
        dcObserver.observe(document.documentElement, { childList: true, subtree: true });
        window.addEventListener('scroll', killFloatingGaejuki, { passive: true });
    }

    /* --------------------------------------------------
       PART 2: 나무위키 (접속 오류 해결 및 NamuLink 엔진 이식)
    -------------------------------------------------- */
    if (location.hostname.includes('namu.wiki')) {
        // 1. [NamuLink 엔진] fetch 가로채기 - 사이트 충돌 방지를 위해 안전하게 구현
        const originalFetch = window.fetch;
        window.fetch = async function(...args) {
            try {
                const url = typeof args[0] === 'string' ? args[0] : args[0]?.url;
                if (url && (url.includes('adcr.naver.com') || url.includes('veta.naver.com'))) {
                    return new Response(JSON.stringify({ ads: [], status: "success" }), { 
                        status: 200,
                        headers: { 'Content-Type': 'application/json' }
                    });
                }
            } catch (e) {}
            return originalFetch.apply(this, args);
        };

        // 2. [사용자 제공 로직] 빈 껍데기 상자 고속 판별 (v2.4 원본 로직)
        function isMobileAdWrapperFast(div) {
            if (div.textContent.trim() !== '') return false;
            if (div.children.length !== 1 || div.children[0].tagName !== 'DIV') return false;
            const hasDataV = (el) => Array.from(el.attributes).some(a => a.name.startsWith('data-v-'));
            if (!hasDataV(div) || !hasDataV(div.children[0])) return false;
            if (div.children[0].children.length > 0) return false;
            return true;
        }

        function namuProcess(root = document) {
            root.querySelectorAll('iframe[id^="google_ads_iframe_"]').forEach(iframe => {
                const container = iframe.closest('div');
                if (container) collapseNode(container);
            });
            root.querySelectorAll('div').forEach(el => {
                if (el.innerText?.includes("파워링크") || el.querySelector('a[href*="adcr.naver.com"]')) {
                    const target = el.closest('div[style*="background-color"]') || el;
                    collapseNode(target);
                }
            });
        }

        const namuObserver = new MutationObserver(mutations => {
            for (const m of mutations) {
                for (const node of m.addedNodes) {
                    if (node.nodeType === 1) {
                        if (node.tagName === 'DIV' && isMobileAdWrapperFast(node)) {
                            collapseNode(node);
                        }
                        if (node.querySelector) {
                            node.querySelectorAll('div').forEach(child => {
                                if (isMobileAdWrapperFast(child)) collapseNode(child);
                            });
                        }
                    }
                }
            }
            namuProcess();
        });

        namuObserver.observe(document.documentElement, { childList: true, subtree: true });
        namuProcess();
    }

})();
