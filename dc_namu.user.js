// ==UserScript==
// @name         DC & Namu Combined Stealth
// @version      2.4
// @description  비공개 릴레이 보호 + 디시 개죽이(날아다니는 놈 포함) 방멸 + 나무위키 원천 차단
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
    const READABLE_TEXT_REGEX = /[\p{L}\p{N}\p{P}\p{S}]/u;

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
       PART 1: 디시인사이드 (신분 세탁 + 날아다니는 개죽이 사살)
    -------------------------------------------------- */
    if (location.hostname.includes('dcinside.com')) {
        const lock = (p, v) => {
            try { Object.defineProperty(window, p, { value: v, writable: false, configurable: false }); } catch (e) {}
        };
        
        // 1. 개죽이 소환 방지용 신분 세탁
        lock('is_adblock', false);
        lock('adblock_chk', false);
        lock('canRunAds', true);
        lock('is_ad_block', 'N');

        // 2. 날아다니는(Fixed/Sticky) 개죽이 실시간 추적 및 사살
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
        console.log("디시: 스크롤 개죽이 감시 모드 가동 🫡");
    }

    /* --------------------------------------------------
       PART 2: 나무위키 (사용자 제공 고성능 원천 차단 로직)
    -------------------------------------------------- */
    if (location.hostname.includes('namu.wiki')) {
        function isMobileAdWrapperFast(div) {
            if (div.textContent.trim() !== '') return false;
            if (div.children.length !== 1 || div.children[0].tagName !== 'DIV') return false;
            const hasDataV = (el) => Array.from(el.attributes).some(a => a.name.startsWith('data-v-'));
            if (!hasDataV(div) || !hasDataV(div.children[0])) return false;
            if (div.children[0].children.length > 0) return false;
            return true;
        }

        function namuProcess(root = document) {
            // 구글 광고 컨테이너 사살
            root.querySelectorAll('iframe[id^="google_ads_iframe_"]').forEach(iframe => {
                const container = iframe.closest('div');
                if (container) collapseNode(container);
            });

            // 파워링크 및 네이버 광고 레이아웃 박멸
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
        console.log("나무위키: 원천 차단 모드 가동 🎯");
    }

})();
