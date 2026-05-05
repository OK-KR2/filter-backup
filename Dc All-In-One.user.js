// ==UserScript==
// @name         Dcinside All-in-One Ultimate Pack (Stable Rev.)
// @version      2.0
// @description  Bypass + Stealth + IP 식별 + Cache/Rate Limit (실행 타이밍 및 충돌 완벽 해결)
// @match        *://*.dcinside.com/*
// @run-at       document-start
// @grant        GM_xmlhttpRequest
// ==/UserScript==

(function() {
    'use strict';

    /* ==========================================
       [1] 스텔스 & 콘솔 에러 방어 로직
       - 반드시 document-start 시점에 최우선 실행되어야 함
       ========================================== */
    const lock = (p, v) => { try { Object.defineProperty(window, p, { value: v, writable: false, configurable: false }); } catch (e) {} };
    if (typeof window.getCookie === 'undefined') window.getCookie = () => '';
    if (typeof window.setCookie_hk_hour === 'undefined') window.setCookie_hk_hour = () => {};
    
    const laundryDC = () => {
        localStorage.removeItem('adblock_detected'); localStorage.removeItem('find_ab'); localStorage.removeItem('find_ab_check');
        if (document.cookie.includes('find_ab=ok')) document.cookie = "find_ab=no; expires=Thu, 01 Jan 2030 00:00:00 UTC; path=/; domain=.dcinside.com";
    };
    laundryDC();
    try { lock('is_adblock', false); lock('adblock_chk', false); lock('canRunAds', true); lock('is_ad_block', 'N'); } catch (e) {}

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
        if (url && (url.includes('ajax/naverad') || url.includes('naverad'))) return new Response(JSON.stringify({ ads: [] }), { status: 200 });
        return originalFetch.apply(window, args);
    };
    setInterval(laundryDC, 800);


    /* ==========================================
       [2] DOM 의존성 로직 (HTML 로딩 완료 후 실행)
       - Bypass, IP 식별기, Cache 시스템
       ========================================== */
    window.addEventListener('DOMContentLoaded', () => {

        // --- 2-1. 차단 우회 및 복구 (최우선 판별) ---
        const isBlocked = document.body.innerText.includes("너무 많은 요청으로") || document.querySelector('.penalty-box-inner');
        
        if (isBlocked) {
            // 차단 시: Bypass 로직만 실행하고 스크립트 강제 종료 (IP, Cache 실행 안 함)
            const urlMatch = window.location.pathname.match(/\/(board|mini)\/([^\/?]+)\/([0-9]+)/);
            if (!urlMatch) return;

            const isMini = urlMatch[1] === 'mini'; const gallId = urlMatch[2]; const postNo = urlMatch[3];

            document.body.innerHTML = `
                <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100vh; background:#f4f4f4;">
                    <div style="padding: 20px; background: #fff; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); text-align:center;">
                        <h3 style="color:#d9534f; margin-bottom: 10px;">🚨 차단 감지됨</h3>
                        <p style="color:#555; font-size:14px; margin:0;">PC 위장 모드로 게시글과 이미지를 복구 중입니다...</p>
                    </div>
                </div>
            `;

            const fetchPCData = (url) => new Promise((resolve, reject) => {
                GM_xmlhttpRequest({
                    method: "GET", url: url,
                    headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36", "Referer": "https://gall.dcinside.com/" },
                    onload: (res) => resolve(res.responseText), onerror: (err) => reject(err)
                });
            });

            const runBypass = async () => {
                try {
                    let htmlStr = ""; let pcUrl = "";
                    if (isMini) { pcUrl = `https://gall.dcinside.com/mini/board/view/?id=${gallId}&no=${postNo}`; htmlStr = await fetchPCData(pcUrl); }
                    else {
                        pcUrl = `https://gall.dcinside.com/mgallery/board/view/?id=${gallId}&no=${postNo}`; htmlStr = await fetchPCData(pcUrl);
                        if (!htmlStr.includes("title_subject")) { pcUrl = `https://gall.dcinside.com/board/view/?id=${gallId}&no=${postNo}`; htmlStr = await fetchPCData(pcUrl); }
                    }

                    const doc = new DOMParser().parseFromString(htmlStr, "text/html");
                    const titleEl = doc.querySelector('.title_subject');
                    if (!titleEl) throw new Error("게시글이 삭제되었거나 잘못된 접근입니다.");

                    const contentEl = doc.querySelector('.write_div');
                    if (contentEl) {
                        contentEl.querySelectorAll('script, style, iframe, .adv-groupno').forEach(el => el.remove());
                        contentEl.querySelectorAll('img').forEach(img => {
                            const realSrc = img.getAttribute('data-original') || img.getAttribute('src');
                            if (realSrc && !realSrc.includes('dcinside_icon')) {
                                img.setAttribute('src', realSrc); img.style.cssText = "max-width: 100%; height: auto; display: block; margin: 15px auto; border-radius: 4px;";
                                img.removeAttribute('onclick'); img.removeAttribute('onload'); img.removeAttribute('class');
                            } else img.remove();
                        });
                    }

                    document.body.innerHTML = `
                        <div style="max-width: 800px; margin: 0 auto; background: #fff; min-height: 100vh;">
                            <div style="padding: 15px; border-bottom: 1px solid #eee; background: #f8f9fa;">
                                <span style="display:inline-block; padding:3px 8px; background:#d9534f; color:#fff; font-size:12px; border-radius:3px; font-weight:bold; margin-bottom:8px;">PC 우회 복구됨</span>
                                <h2 style="margin: 0; font-size: 18px;">${titleEl.innerText.trim()}</h2>
                            </div>
                            <div style="padding: 20px 15px; font-size: 15px; line-height: 1.6; word-break: break-all;">
                                ${contentEl ? contentEl.innerHTML : "<p>본문 없음</p>"}
                            </div>
                            <div style="padding: 20px; text-align: center; border-top: 1px solid #eee;">
                                <button onclick="window.history.back()" style="padding: 10px 20px; background: #3b5998; color: #fff; border: none; border-radius: 5px;">← 뒤로 가기</button>
                            </div>
                        </div>
                    `;
                } catch (err) {
                    document.body.innerHTML = `<div style="padding: 30px; text-align: center; color: #d9534f;"><h3>❌ 복구 실패</h3><p>${err.message}</p></div>`;
                }
            };
            runBypass();
            return; // ★ 차단되었을 경우 아래 코드는 무시하고 종료
        }


        // --- 2-2. IP 식별 로직 (정상 페이지일 때만 실행) ---
        const ipCategories = [
            { label: "통피", ips: ["39.7", "39.119", "106.101", "106.102", "110.70", "114.200", "114.201", "117.111", "118.235", "125.188", "175.223", "175.252", "210.125", "211.36", "211.234", "211.246", "223.32", "223.33", "223.38", "223.39", "223.62"] },
            { label: "비공개/WARP", ips: ["104.28", "172.225", "172.226", "172.227", "8.20", "8.21", "8.22", "8.23", "162.158", "188.114", "104.16", "104.17"] },
            { label: "VPN/우회", ips: ["140.248", "185.123", "185.240", "185.244", "185.156", "185.212", "194.33", "194.226", "156.146", "212.102", "193.176", "89.39", "37.19", "37.120", "84.17", "103.153", "103.208", "149.28", "45.32", "207.246", "104.238", "139.180", "13.124", "13.125", "3.34", "3.35", "34.64", "35.216", "45.13", "45.14", "45.89", "192.145", "108.162", "141.101", "173.245", "198.41", "138.199", "146.70", "169.150", "217.138", "185.242", "149.34", "89.40"] }
        ];

        function tagIPs() {
            document.querySelectorAll('.ip').forEach(el => {
                if (el.dataset.ipTagged === "true") return;
                const text = el.textContent;
                const ipMatch = text.match(/\((\d{1,3}\.\d{1,3})\)/);
                if (ipMatch && ipMatch[1]) {
                    const ip = ipMatch[1]; let label = "개인/기타";
                    for (const category of ipCategories) {
                        if (category.ips.includes(ip)) { label = category.label; break; }
                    }
                    const tagSpan = document.createElement('span'); tagSpan.innerText = ` [${label}]`;
                    el.appendChild(tagSpan); el.dataset.ipTagged = "true";
                }
            });
        }
        tagIPs();
        const observer = new MutationObserver((mutations) => {
            if(mutations.some(m => m.addedNodes.length > 0)) tagIPs();
        });
        observer.observe(document.body, { childList: true, subtree: true });


        // --- 2-3. Cache System & Rate Limit ---
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
                if (limit && remaining) updateRateLimitUI(limit, remaining);
            } catch (e) {}
        };

        const DB_NAME = "dc_expert_db"; const STORE_NAME = "post_cache"; let dbInstance = null;
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
                if (Math.random() < 0.05) cleanOldCache(dbInstance);
                resolve(dbInstance);
            };
            request.onerror = (e) => reject(e);
        });

        const cleanOldCache = (db) => {
            const transaction = db.transaction([STORE_NAME], "readwrite");
            const store = transaction.objectStore(STORE_NAME);
            const index = store.index("time");
            const twentyFourHoursAgo = Date.now() - 86400000;
            const range = IDBKeyRange.upperBound(twentyFourHoursAgo);
            index.openCursor(range).onsuccess = (e) => {
                const cursor = e.target.result;
                if (cursor) { store.delete(cursor.primaryKey); cursor.continue(); }
            };
        };

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
                const db = await openDB(); checkRateLimit(); 
                return new Promise((r) => {
                    const req = db.transaction([STORE_NAME], "readwrite").objectStore(STORE_NAME).put(data);
                    req.onsuccess = () => r(req.result);
                });
            }
        };

    }); // DOMContentLoaded 종료 지점

})();
