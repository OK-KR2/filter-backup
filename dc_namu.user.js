// ==UserScript==
// @name         DC & Namu Combined (Nuclear Version 2.3)
// @version      2.3
// @description  신규 MutationObserver 로직 + 디시 개죽이 방멸 스텔스
// @match        *://*.dcinside.com/*
// @match        *://*.namu.wiki/*
// @updateURL    https://raw.githubusercontent.com/OK-KR2/filter-backup/main/dc_namu.user.js
// @downloadURL  https://raw.githubusercontent.com/OK-KR2/filter-backup/main/dc_namu.user.js
// @run-at       document-start
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    /* [Part 1] 디시인사이드 전용 신분 세탁 (개죽이 방멸) */
    if (location.hostname.includes('dcinside.com')) {
        const lock = (p, v) => {
            try { Object.defineProperty(window, p, { value: v, writable: false, configurable: false }); } catch (e) {}
        };
        lock('is_adblock', false);
        lock('adblock_chk', false);
        lock('canRunAds', true);
        lock('is_ad_block', 'N');
        console.log("디시: 스텔스 신분 세탁 완료 🫡");
    }

    /* [Part 2] 가져오신 고성능 광고 제거 로직 (나무위키 타격) */
    const blocked = new WeakSet();
    const READABLE_TEXT_REGEX = /[\p{L}\p{N}\p{P}\p{S}]/u;

    function hasReadableText(node) {
        if (!node) return false;
        if (node.matches?.('input, textarea')) return READABLE_TEXT_REGEX.test(node.value || '');
        const text = node.textContent;
        return text ? READABLE_TEXT_REGEX.test(text) : false;
    }

    function collapseNode(node) {
        if (!node || blocked.has(node)) return;
        blocked.add(node);
        node.style.setProperty('display', 'none', 'important');
        node.style.setProperty('height', '0', 'important');
        node.style.setProperty('margin', '0', 'important');
        node.style.setProperty('padding', '0', 'important');
        node.setAttribute('data-blocked-by-script', 'true');
    }

    function removeClean(target) {
        if (!target || blocked.has(target)) return;
        collapseNode(target);
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                if (target.isConnected) target.remove();
            });
        });
    }

    function isMobileAdWrapperFast(div) {
        if (div.textContent.trim() !== '') return false;
        if (div.children.length !== 1 || div.children[0].tagName !== 'DIV') return false;
        const hasDataV = (el) => Array.from(el.attributes).some(a => a.name.startsWith('data-v-'));
        if (!hasDataV(div) || !hasDataV(div.children[0])) return false;
        if (div.children[0].children.length > 0) return false;
        return true;
    }

    function process(root = document) {
        root.querySelectorAll('iframe[id^="google_ads_iframe_"]').forEach(iframe => {
            const adContainer = iframe.closest('div');
            if (adContainer) removeClean(adContainer);
        });

        root.querySelectorAll('table').forEach(table => {
            if (!table.querySelector('a[href^="#s-"]')) return;
            // 테이블 광고 제거 로직 간소화
            collapseNode(table);
        });

        // 나무위키 파워링크 텍스트 기반 타격 추가
        root.querySelectorAll('div').forEach(el => {
            if (el.innerText?.includes("파워링크") || el.querySelector('a[href*="adcr.naver.com"]')) {
                const target = el.closest('div[style*="background-color"]') || el;
                removeClean(target);
            }
        });
    }

    let timer = null;
    function queueProcess() {
        clearTimeout(timer);
        timer = setTimeout(() => process(), 50);
    }

    new MutationObserver(mutations => {
        let shouldQueue = false;
        for (const m of mutations) {
            for (const node of m.addedNodes) {
                if (node.nodeType === 1) {
                    if (node.tagName === 'IFRAME' && node.id.startsWith('google_ads_iframe_')) {
                        const container = node.closest('div');
                        if (container) collapseNode(container);
                    }
                    if (node.tagName === 'DIV' && isMobileAdWrapperFast(node)) {
                        collapseNode(node);
                    }
                    shouldQueue = true;
                }
            }
        }
        if (shouldQueue) queueProcess();
    }).observe(document.documentElement, { childList: true, subtree: true });

    process();
})();
