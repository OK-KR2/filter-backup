// ==UserScript==
// @name         DC & Namu Combined Stealth
// @version      4.9.9 (Bypass Edition)
// @description  디시(4.9.6 절대 방어 + PC 우회 복원) + 나무위키(v4.9 고정)
// @match        *://*.dcinside.com/*
// @match        *://*.namu.wiki/*
// @run-at       document-start
// @grant        GM_xmlhttpRequest
// @grant        GM.xmlHttpRequest
// ==/UserScript==

(function () {
    'use strict';

    const lock = (p, v) => {
        try { Object.defineProperty(window, p, { value: v, writable: false, configurable: false }); } catch (e) {}
    };

    /* --------------------------------------------------
       PART 1: 디시인사이드 (네이티브 차단 방어 + PC 우회 복원)
    -------------------------------------------------- */
    if (location.hostname.includes('dcinside.com')) {

        // 1. [4.9.6] 네이티브 쿠키/스토리지 가로채기
        try {
            const cookieDesc = Object.getOwnPropertyDescriptor(Document.prototype, 'cookie') || Object.getOwnPropertyDescriptor(HTMLDocument.prototype, 'cookie');
            if (cookieDesc && cookieDesc.configurable) {
                Object.defineProperty(document, 'cookie', {
                    get: function() { return cookieDesc.get.call(document); },
                    set: function(val) {
                        if (val && (val.includes('find_ab=ok') || val.includes('adblock_detected'))) {
                            return; 
                        }
                        cookieDesc.set.call(document, val);
                    }
                });
            }

            const originalSetItem = Storage.prototype.setItem;
            Storage.prototype.setItem = function(key, value) {
                if (key === 'adblock_detected' || key === 'find_ab' || key === 'find_ab_check') {
                    return; 
                }
                originalSetItem.apply(this, arguments);
            };
        } catch (e) {}

        localStorage.removeItem('adblock_detected');
        localStorage.removeItem('find_ab');
        localStorage.removeItem('find_ab_check');
        if (document.cookie.includes('find_ab=ok')) {
            document.cookie = "find_ab=no; expires=Thu, 01 Jan 2030 00:00:00 UTC; path=/; domain=.dcinside.com";
        }

        try {
            lock('is_adblock', false); lock('adblock_chk', false); lock('canRunAds', true); lock('is_ad_block', 'N');
        } catch (e) {}

        const style = document.createElement('style');
        style.textContent = `
            #moveOverlay, #moveimg, .adv-group, .adv-groupin, .adv-grouptop, .pwlink,
            div[id*="ad_middle"], iframe[src*="netinsight"] {
                height: 0px !important; min-height: 0px !important; margin: 0px !important; padding: 0px !important;
                border: 0px !important; overflow: hidden !important; visibility: hidden !important; opacity: 0 !important;
            }
        `;
        (document.head || document.documentElement).appendChild(style);

        // 2. [추출 기능] 너무 많은 요청(429) 시 PC 버전 우회 복원
        document.addEventListener('DOMContentLoaded', async () => {
            const match = window.location.pathname.match(/\/(board|mini)\/([^\/?]+)\/([0-9]+)/);
            if (match && document.body.innerText.includes("너무 많은 요청으로")) {
                const isMini = match[1] === "mini";
                const gallId = match[2];
                const articleNo = match[3];

                document.body.innerHTML = '<div style="text-align:center; padding: 50px; font-size: 15px; color: #666; font-weight: bold;">PC 버전으로 우회 복구 중입니다... 잠시만 기다려주세요.</div>';

                try {
                    const fetchPC = (url) => new Promise((resolve, reject) => {
                        const requestMethod = typeof GM !== "undefined" && GM.xmlHttpRequest ? GM.xmlHttpRequest : GM_xmlhttpRequest;
                        requestMethod({
                            method: "GET",
                            url: url,
                            headers: {
                                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                                "Referer": "https://gall.dcinside.com/"
                            },
                            onload: (res) => resolve(res.responseText),
                            onerror: (err) => reject(err)
                        });
                    });

                    let pcUrl = `https://gall.dcinside.com/${isMini ? "mini/" : ""}board/view/?id=${gallId}&no=${articleNo}`;
                    let htmlData = await fetchPC(pcUrl);
                    let parser = new DOMParser();
                    let doc = parser.parseFromString(htmlData, "text/html");

                    if (!doc.querySelector(".title_subject") && !isMini) {
                        pcUrl = `https://gall.dcinside.com/mgallery/board/view/?id=${gallId}&no=${articleNo}`;
                        htmlData = await fetchPC(pcUrl);
                        doc = parser.parseFromString(htmlData, "text/html");
                    }

                    const title = doc.querySelector(".title_subject") ? doc.querySelector(".title_subject").innerText : "제목 없음";
                    const writerNode = doc.querySelector(".gall_writer");
                    const writer = writerNode ? writerNode.getAttribute("data-nick") : "ㅇㅇ";
                    const contentNode = doc.querySelector(".write_div");
                    const content = contentNode ? contentNode.innerHTML : "<p>본문을 파싱하지 못했습니다.</p>";

                    document.body.innerHTML = `
                        <div style="padding: 15px; background: #fff; min-height: 100vh;">
                            <button onclick="history.back()" style="padding: 8px 15px; margin-bottom: 15px; border: 1px solid #ccc; background: #f9f9f9; border-radius: 5px;">&larr; 뒤로 가기</button>
                            <h2 style="font-size: 18px; margin-bottom: 10px; border-bottom: 2px solid #ddd; padding-bottom: 10px;"><span style="color:#d9534f;">[우회 복원됨]</span> ${title}</h2>
                            <div style="font-size: 13px; color: #555; margin-bottom: 20px;">작성자: <b>${writer}</b></div>
                            <div style="font-size: 15px; line-height: 1.6; word-break: break-all;">
                                ${content}
                            </div>
                        </div>
                    `;

                    document.querySelectorAll("img").forEach(img => {
                        img.style.maxWidth = "100%";
                        img.style.height = "auto";
                    });

                } catch (e) {
                    document.body.innerHTML = `<div style="text-align:center; padding: 50px; color:#d9534f;"><strong>우회 로드에 실패했습니다.</strong><br><small>${e.message}</small></div>`;
                }
            }
        });
    }

    /* --------------------------------------------------
       PART 2: 나무위키 (v4.9 완전 고정)
    -------------------------------------------------- */
    if (location.hostname.includes('namu.wiki')) {
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
    }
})();
