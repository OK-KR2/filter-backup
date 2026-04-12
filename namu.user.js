// ==UserScript==
// @name         Namu Stealth
// @version      4.9.6
// @description  나무위키 광고 및 파워링크 완벽 박멸 (깜빡임 제거)
// @match        *://*.namu.wiki/*
// @run-at       document-start
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    const collapseNode = (node) => {
        if (!node || node.id === 'app' || node.id === 'eruda' || node.tagName === 'BODY') return;
        node.style.setProperty('display', 'none', 'important');
        node.style.setProperty('height', '0', 'important');
        node.style.setProperty('margin', '0', 'important');
        node.style.setProperty('padding', '0', 'important');
        node.setAttribute('data-blocked-by-stealth', 'true');
    };

    const style = document.createElement('style');
    style.textContent = `
        [data-v-aed07d7a], .veta_ad_wrapper, .gn4Z21wj, .VBwhMBUe, ._3Dy97h7l,
        div[class*="vKJY7-f5"], div[class*="HJeR5GcT"], 
        div:has(> a[href*="adcr.naver.com"]), div[style*="#fffff6"],
        iframe[src*="doubleclick.net"] {
            display: none !important; height: 0px !important; margin: 0px !important; padding: 0px !important; opacity: 0 !important;
        }
    `;
    (document.head || document.documentElement).appendChild(style);

    const mockAd = { loadAd: () => {}, init: () => {}, getAds: () => [], setTargeting: () => {}, display: () => {}, enableServices: () => {}, pubads: () => mockAd, addService: () => mockAd };
    window.veta = window.veta || mockAd;
    window.googletag = window.googletag || mockAd;
    window.ad_block_detected = false;
    window.canRunAds = true;

    const namuCleaner = () => {
        document.querySelectorAll('div, section').forEach(el => {
            if (el.hasAttribute('data-v-aed07d7a') || el.innerText === "파워링크" || el.querySelector('a[href*="adcr.naver.com"]')) {
                const target = el.closest('div[class*="vKJY7-f5"]') || el.closest('div[class*="_"]') || el;
                if (target && target.id !== 'app' && target.id !== 'eruda') {
                    collapseNode(target);
                    if (target.parentNode) target.remove();
                }
            }
        });
    };

    new MutationObserver(namuCleaner).observe(document.documentElement, { childList: true, subtree: true });
    let fastClean = setInterval(namuCleaner, 50);
    setTimeout(() => { clearInterval(fastClean); setInterval(namuCleaner, 600); }, 3000);
})();
