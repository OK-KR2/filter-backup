// ==UserScript==
// @name         DC Integrated Ultimate Stealth
// @version      8.0
// @description  DC Stealth(v5.1) + Cache System(v7.6.1) + Ultimate Bypass(v1.0.0) 무수정 통합본
// @match        *://*.dcinside.com/*
// @run-at       document-start
// @grant        GM_xmlhttpRequest
// @grant        GM.xmlHttpRequest
// ==/UserScript==

(function () {
    'use strict';

    /* ==================================================
       [PART 1] DC Stealth v5.1 (즉시 실행 모듈)
       ================================================== */
    const lock = (p, v) => {
        try { Object.defineProperty(window, p, { value: v, writable: false, configurable: false }); } catch (e) {}
    };

    // 콘솔 에러 방어용 함수 선언
    if (typeof window.getCookie === 'undefined') { window.getCookie = function() { return ''; }; }
    if (typeof window.setCookie_hk_hour === 'undefined') { window.setCookie_hk_hour = function() {}; }
    
    const laundryDC = () => {
        localStorage.removeItem('adblock_detected');
        localStorage.removeItem('find_ab');
        localStorage.removeItem('find_ab_check');
        if (document.cookie.includes('find_ab=ok')) {
            document.cookie = "find_ab=no; expires=Thu, 01 Jan 2030 00:00:00 UTC; path=/; domain=.dcinside.com";
        }
    };
    laundryDC();
    
    try {
        lock('is_adblock', false); lock('adblock_chk', false); lock('canRunAds', true); lock('is_ad_block', 'N');
    } catch (e) {}

    const style = document.createElement('style');
    style.textContent = `
        #moveOverlay, #moveimg, .adv-group, .adv-groupin, .adv-grouptop, .pwlink,
        .penalty-box, .pp-box:has(.penalty-box), div[id*="ad_middle"], iframe[src*="netinsight"] {
            position: absolute !important; left: -9999px !important; top: -9999px !important;
            width: 1px !important; height: 1px !important; overflow: hidden !important; 
            opacity: 0 !important; pointer-events: none !important;
        }
    `;
    (document.head || document.documentElement).appendChild(style);

    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
        const url = typeof args[0] === 'string' ? args[0] : args[0]?.url;
        if (url && (url.includes('ajax/naverad') || url.includes('naverad'))) {
            return new Response(JSON.stringify({ ads: [] }), { status: 200 });
        }
        return originalFetch.apply(window, args);
    };
    setInterval(laundryDC, 800);


    /* ==================================================
       [타이밍 브릿지] 아래 모듈들은 DOM 로드 후 실행
       ================================================== */
    window.addEventListener('DOMContentLoaded', () => {

        /* ==============================================
           [PART 2] Cache System + Rate Limit (v7.6.1)
           ============================================== */
        (function() {
            let rateLimitUI = null;
            const updateRateLimitUI = (limit, remaining) => {
                if (!rateLimitUI) {
                    rateLimitUI = document.createElement("div");
                    rateLimitUI.style.cssText = "position: fixed; bottom: 10px; left: 10px; background: rgba(0, 0, 0, 0.6); color: #fff; padding: 4px 8px; border-radius: 4px; font-size: 11px; z-index: 99999; pointer-events: none; box-shadow: 0 1px 3px rgba(0,0,0,0.3);";
                    document.body.appendChild(rateLimitUI);
                }
                rateLimitUI.innerText = `Rate Limit: ${remaining} / ${limit}`; 
            };
            const checkRateLimit = async () => {
                try {
                    const response = await fetch(window.location.href, { method: "HEAD" });
                    const limit = response.headers.get("x-rate-limit-limit") || response.headers.get("x-ratelimit-limit"); 
                    const remaining = response.headers.get("x-rate-limit-remaining") || response.headers.get("x-ratelimit-remaining"); 
                    if (limit && remaining) { updateRateLimitUI(limit, remaining); }
                } catch (e) { console.error("Rate Limit 확인 실패", e); }
            };
            const DB_NAME = "dc_expert_db";
            const STORE_NAME = "post_cache";
            let dbInstance = null;
            const openDB = () => new Promise((resolve, reject) => {
                if (dbInstance) return resolve(dbInstance);
                const request = indexedDB.open(DB_NAME, 3);
                request.onupgradeneeded = (e) => {
                    const db = e.target.result;
                    if (db.objectStoreNames.contains(STORE_NAME)) db.deleteObjectStore(STORE_NAME);
                    db.createObjectStore(STORE_NAME, { keyPath: "url" }).createIndex("time", "time", { unique: false });
                };
                request.onsuccess = (t) => {
                    dbInstance = t.target.result;
                    resolve(dbInstance);
                };
                request.onerror = (e) => reject(e);
            });
            checkRateLimit();
            window.dcCache = { 
                getCache: async (url) => {
                    const db = await openDB();
                    return new Promise((r) => {
                        const req = db.transaction([STORE_NAME], "readonly").objectStore(STORE_NAME).get(url);
                        req.onsuccess = () => r(req.result);
                    });
                },
                setCache: async (data) => {
                    const db = await openDB();
                    checkRateLimit(); 
                    return new Promise((r) => {
                        const req = db.transaction([STORE_NAME], "readwrite").objectStore(STORE_NAME).put(data);
                        req.onsuccess = () => r(req.result);
                    });
                }
            };
        })();

        /* ==============================================
           [PART 3] Ultimate Bypass (v1.0.0)
           ============================================== */
        (function() {
            const isBlocked = document.body.innerText.includes("너무 많은 요청으로") || document.querySelector('.penalty-box-inner');
            if (!isBlocked) return;
            const urlMatch = window.location.pathname.match(/\/(board|mini)\/([^\/?]+)\/([0-9]+)/);
            if (!urlMatch) return;
            const isMini = urlMatch[1] === 'mini';
            const gallId = urlMatch[2];
            const postNo = urlMatch[3];
            document.body.innerHTML = `<div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100vh; background:#f4f4f4;"><div style="padding: 20px; background: #fff; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); text-align:center;"><h3 style="color:#d9534f; margin-bottom: 10px;">🚨 차단 감지됨</h3><p style="color:#555; font-size:14px; margin:0;">PC 위장 모드로 복구 중...</p></div></div>`;
            const fetchPCData = (url) => {
                return new Promise((resolve, reject) => {
                    const reqFunc = typeof GM_xmlhttpRequest !== 'undefined' ? GM_xmlhttpRequest : GM.xmlHttpRequest;
                    reqFunc({
                        method: "GET", url: url,
                        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36", "Referer": "https://gall.dcinside.com/" },
                        onload: (res) => resolve(res.responseText),
                        onerror: (err) => reject(err)
                    });
                });
            };
            const runBypass = async () => {
                try {
                    let pcUrl = isMini ? `https://gall.dcinside.com/mini/board/view/?id=${gallId}&no=${postNo}` : `https://gall.dcinside.com/mgallery/board/view/?id=${gallId}&no=${postNo}`;
                    let htmlStr = await fetchPCData(pcUrl);
                    if (!htmlStr.includes("title_subject") && !isMini) {
                        pcUrl = `https://gall.dcinside.com/board/view/?id=${gallId}&no=${postNo}`;
                        htmlStr = await fetchPCData(pcUrl);
                    }
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(htmlStr, "text/html");
                    const title = doc.querySelector('.title_subject')?.innerText.trim() || "제목 없음";
                    const contentEl = doc.querySelector('.write_div');
                    if (contentEl) {
                        contentEl.querySelectorAll('img').forEach(img => {
                            const realSrc = img.getAttribute('data-original') || img.getAttribute('src');
                            if (realSrc && !realSrc.includes('dcinside_icon')) {
                                img.setAttribute('src', realSrc);
                                img.style.cssText = "max-width: 100%; height: auto; display: block; margin: 15px auto;";
                            } else { img.remove(); }
                        });
                    }
                    document.body.innerHTML = `<div style="padding: 15px; background: #fff;"><h2 style="font-size: 18px; border-bottom: 1px solid #eee;">${title}</h2><div>${contentEl?.innerHTML || ""}</div><button onclick="window.history.back()">뒤로가기</button></div>`;
                } catch (err) { console.error("Bypass Error", err); }
            };
            runBypass();
        })();

    });
})();
