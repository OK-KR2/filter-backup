// ==UserScript==
// @name         [통합] 내 전용 웹사이트 편의성 & 광고 차단팩
// @namespace    http://tampermonkey.net/
// @version      1.3
// @description  1.나무위키 광고차단 | 2.툰코 스크롤 메뉴 | 3.유튜브 PiP | 4.디시인사이드 올인원 | 5.전 사이트 복사 해제(v10.0 최적화)
//
// --- [통합 주소 규칙 (전 사이트 복사 해제 포함)] ---
// @match        *://*/*
//
// --- [공통 실행 시점 및 권한] ---
// @run-at       document-start
// @grant        GM_xmlhttpRequest
// ==/UserScript==

(function() {
    'use strict';

    // =========================================================================
    // 🎛️ [통합 관리 스위치] 특정 기능만 잠시 끄려면 true를 false로 바꾸세요.
    // =========================================================================
    const ENABLE_MODULES = {
        namuwiki:     true, // 모듈 1: 나무위키 파워링크(위장 목차) 제거
        toonkor:      true, // 모듈 2: 툰코 뷰어 스크롤 메뉴 숨김/표시
        youtube:      true, // 모듈 3: 유튜브 전용 PiP 버튼 및 단축키(Ctrl+P)
        dcinside:     true, // 모듈 4: 디시인사이드 차단우회, IP식별, 레이트리밋/캐시
        copyUnlocker: true  // 모듈 5: 전 사이트 우클릭/드래그/복사 방지 해제 (v10.0)
    };
    // =========================================================================

    const currentHost = window.location.hostname;

    // [유틸리티 1] @run-at document-end 시점 구현 함수
    function runAtDocumentEnd(callback) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', callback, { once: true });
        } else {
            callback();
        }
    }

    // [유틸리티 2] @run-at document-idle 시점 구현 함수
    function runAtDocumentIdle(callback) {
        if (document.readyState === 'complete') {
            setTimeout(callback, 1);
        } else {
            window.addEventListener('load', () => setTimeout(callback, 1), { once: true });
        }
    }



    // =========================================================================
    // 📦 [모듈 1] NamuWiki Powerlink Kill (Fake TOC) v8.0
    // - 작동 조건: namu.wiki 접속 시
    // - 실행 시점: 즉시 (document-start)
    // =========================================================================
    if (ENABLE_MODULES.namuwiki && currentHost.includes('namu.wiki')) {
        (function() {
            const style = document.createElement('style');
            style.textContent = `
                iframe:not([src*="youtube"]):not([src*="vimeo"]) {
                    display: none !important;
                    width: 0 !important; height: 0 !important;
                    pointer-events: none !important;
                }
            `;
            if (document.documentElement) document.documentElement.appendChild(style);

            const nuke = (el) => {
                let parent = el;
                let adBox = null;
                let depth = 0;

                while (parent && depth < 7) {
                    const tag = parent.tagName ? parent.tagName.toUpperCase() : '';
                    if (tag === 'ARTICLE' || tag === 'MAIN' || tag === 'BODY' || parent.id === 'app') break;
                    if (parent.className && typeof parent.className === 'string' && parent.className.includes('wiki-inner-content')) break;

                    let textLen = parent.textContent ? parent.textContent.replace(/\s+/g, '').length : 0;
                    if (textLen > 500) break;

                    adBox = parent;
                    parent = parent.parentElement;
                    depth++;
                }

                if (adBox && adBox.innerHTML !== '') {
                    adBox.innerHTML = '';
                    adBox.style.setProperty('display', 'none', 'important');
                    adBox.style.setProperty('height', '0', 'important');
                    adBox.style.setProperty('margin', '0', 'important');
                    adBox.style.setProperty('padding', '0', 'important');
                }
            };

            const scan = () => {
                document.querySelectorAll('a[href^="#s-"]').forEach(a => {
                    const text = a.textContent.trim();
                    if (!text) return;
                    if (/^[\d.]+$/.test(text)) return;
                    if (/^\[\d+\]$/.test(text)) return;
                    if (a.classList.contains('wiki-link-internal')) return;
                    nuke(a);
                });

                document.querySelectorAll('div, span').forEach(el => {
                    if (el.childNodes.length === 1 && el.firstChild.nodeType === Node.TEXT_NODE) {
                        const text = el.textContent.trim();
                        if (text.length >= 6 && text.length <= 15) {
                            if (el.classList.contains(text)) {
                                nuke(el);
                            }
                        }
                    }
                });
            };

            const observer = new MutationObserver(() => { scan(); });
            const start = () => {
                if (document.body) {
                    observer.observe(document.body, { childList: true, subtree: true });
                    scan();
                } else {
                    requestAnimationFrame(start);
                }
            };
            start();
            setInterval(scan, 300);
        })();
    }
    // ======================= [모듈 1: 나무위키 끝] ============================



    // =========================================================================
    // 📦 [모듈 2] 툰코(Toonkor) 뷰어 스크롤 메뉴 숨김/표시 v1.1
    // - 작동 조건: toonkor 도메인 접속 시
    // - 실행 시점: 페이지 요소 로드 완료 후 (document-end)
    // =========================================================================
    if (ENABLE_MODULES.toonkor && /toonkor/i.test(currentHost)) {
        runAtDocumentEnd(function() {
            const CONFIG = {
                hideSensitivity: 20,      // 아래로 스크롤 시 숨김 예민감도 (px)
                showSensitivity: 40,      // 위로 스크롤 시 표시 예민감도 (px)
                topAlwaysShowOffset: 80,  // 최상단 항상 표시 영역 (px)
                disableTouchToggle: false // 기존 화면 터치 토글 비활성화 여부
            };

            const isViewerPage = document.getElementById('toon_img') || document.querySelector('.bottom-navbar');
            if (!isViewerPage) return;

            if (CONFIG.disableTouchToggle && window.jQuery) {
                window.jQuery('.contents').off('click');
            }

            let isMenuVisible = true;

            function setMenuVisibility(show) {
                const epPanel = document.getElementById('tk-ep-panel');
                if (!show && epPanel && epPanel.classList.contains('on')) {
                    return;
                }

                const $ = window.jQuery;
                const currentY = window.pageYOffset || document.documentElement.scrollTop || 0;

                if ($) {
                    if (!show) {
                        if (currentY > 100) $('.at-navbar').hide();
                        $('.btn-resource').hide();
                        $('.bottom-navbar').hide();
                        $('#asideMenu').hide();
                    } else {
                        $('.at-navbar').show();
                        $('.btn-resource').show();
                        $('.bottom-navbar').show();
                        $('#asideMenu').show();
                    }
                } else {
                    const displayVal = show ? '' : 'none';
                    document.querySelectorAll('.bottom-navbar, .btn-resource, .at-navbar, #asideMenu').forEach(el => {
                        el.style.display = displayVal;
                    });
                }

                isMenuVisible = show;
                if (typeof window._show_menu !== 'undefined') {
                    window._show_menu = show;
                }
            }

            const contentsEl = document.querySelector('.contents');
            if (contentsEl && !CONFIG.disableTouchToggle) {
                contentsEl.addEventListener('click', function() {
                    setTimeout(() => {
                        if (typeof window._show_menu !== 'undefined') {
                            isMenuVisible = window._show_menu;
                        }
                    }, 10);
                });
            }

            let lastScrollY = window.pageYOffset || document.documentElement.scrollTop || 0;
            let accumulatedDown = 0;
            let accumulatedUp = 0;
            let ticking = false;

            function onScrollUpdate() {
                ticking = false;
                const currentY = window.pageYOffset || document.documentElement.scrollTop || 0;
                const maxScrollY = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight) - window.innerHeight;

                if (currentY < 0 || (maxScrollY > 0 && currentY > maxScrollY)) {
                    lastScrollY = Math.max(0, Math.min(currentY, maxScrollY));
                    return;
                }

                if (currentY <= CONFIG.topAlwaysShowOffset) {
                    if (!isMenuVisible) setMenuVisibility(true);
                    accumulatedDown = 0;
                    accumulatedUp = 0;
                    lastScrollY = currentY;
                    return;
                }

                const delta = currentY - lastScrollY;
                if (delta > 0) {
                    accumulatedDown += delta;
                    accumulatedUp = 0;
                    if (isMenuVisible && accumulatedDown >= CONFIG.hideSensitivity) {
                        setMenuVisibility(false);
                        accumulatedDown = 0;
                    }
                } else if (delta < 0) {
                    accumulatedUp += Math.abs(delta);
                    accumulatedDown = 0;
                    if (!isMenuVisible && accumulatedUp >= CONFIG.showSensitivity) {
                        setMenuVisibility(true);
                        accumulatedUp = 0;
                    }
                }
                lastScrollY = currentY;
            }

            window.addEventListener('scroll', function() {
                if (!ticking) {
                    ticking = true;
                    window.requestAnimationFrame(onScrollUpdate);
                }
            }, { passive: true });
        });
    }
    // ======================== [모듈 2: 툰코 끝] ===============================



    // =========================================================================
    // 📦 [모듈 3] YouTube PiP Only v31.0
    // - 작동 조건: youtube.com 접속 시
    // - 실행 시점: 페이지 완전히 로드 후 (document-idle)
    // =========================================================================
    if (ENABLE_MODULES.youtube && currentHost.includes('youtube.com')) {
        runAtDocumentIdle(function() {
            let cachedVideo = null;
            let lastVideoCheckTime = 0;

            const getActiveVideo = () => {
                const now = Date.now();
                if (cachedVideo && document.body.contains(cachedVideo) && (now - lastVideoCheckTime < 2000)) {
                    return cachedVideo;
                }

                let videos = Array.from(document.querySelectorAll('video'));
                document.querySelectorAll('*').forEach(el => {
                    if (el.shadowRoot) {
                        videos.push(...el.shadowRoot.querySelectorAll('video'));
                    }
                });

                if (videos.length === 0) return null;

                const mainVideo = videos.sort((a, b) => (b.clientWidth * b.clientHeight) - (a.clientWidth * a.clientHeight))[0];
                cachedVideo = mainVideo;
                lastVideoCheckTime = now;
                return mainVideo;
            };

            window.addEventListener('keydown', (e) => {
                if (e.ctrlKey && e.key.toLowerCase() === 'p') {
                    const video = getActiveVideo();
                    if (video) {
                        if (typeof video.webkitSetPresentationMode === 'function') {
                            video.webkitSetPresentationMode(video.webkitPresentationMode === 'picture-in-picture' ? 'inline' : 'picture-in-picture');
                        } else if (document.pictureInPictureElement) {
                            document.exitPictureInPicture();
                        } else {
                            video.requestPictureInPicture().catch(console.error);
                        }
                    }
                }
            });

            const addPipButton = () => {
                const video = getActiveVideo();
                if (!video || !document.body || document.getElementById('force-pip-btn')) return;

                const btn = document.createElement('button');
                btn.id = 'force-pip-btn';
                btn.innerText = 'PiP 모드';
                btn.style.cssText = `
                    position: fixed !important; bottom: 80px !important; right: 20px !important;
                    z-index: 2147483647 !important; padding: 12px 18px !important;
                    background: rgba(220, 38, 38, 0.9) !important; color: white !important;
                    border: 1px solid rgba(255, 255, 255, 0.3) !important; border-radius: 10px !important;
                    cursor: pointer !important; font-weight: bold !important; font-size: 14px !important;
                    backdrop-filter: blur(8px) !important; -webkit-backdrop-filter: blur(8px) !important;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.5) !important; display: block !important;
                `;

                btn.onclick = (e) => {
                    e.preventDefault(); e.stopPropagation();
                    const v = getActiveVideo();
                    if (!v) return;

                    if (typeof v.webkitSetPresentationMode === 'function') {
                        v.webkitSetPresentationMode(v.webkitPresentationMode === 'picture-in-picture' ? 'inline' : 'picture-in-picture');
                    } else if (document.pictureInPictureEnabled) {
                        document.pictureInPictureElement ? document.exitPictureInPicture() : v.requestPictureInPicture();
                    }
                };
                document.body.appendChild(btn);
            };

            setInterval(addPipButton, 1500);
            window.addEventListener('yt-navigate-finish', addPipButton);
        });
    }
    // ======================= [모듈 3: 유튜브 끝] ==============================



    // =========================================================================
    // 📦 [모듈 4] Dcinside All-in-One Ultimate Pack (Stable Rev.) v2.1
    // - 작동 조건: dcinside.com 접속 시 (document-start 및 DOMContentLoaded 복합 적용)
    // =========================================================================
    if (ENABLE_MODULES.dcinside && currentHost.includes('dcinside.com')) {
        (function() {
            const lock = (p, v) => { try { Object.defineProperty(window, p, { value: v, writable: false, configurable: false }); } catch (e) {} };
            if (typeof window.getCookie === 'undefined') window.getCookie = () => '';
            if (typeof window.setCookie_hk_hour === 'undefined') window.setCookie_hk_hour = () => {};

            const laundryDC = () => {
                localStorage.removeItem('adblock_detected'); localStorage.removeItem('find_ab'); localStorage.removeItem('find_ab_check');
                if (document.cookie.includes('find_ab=ok')) document.cookie = "find_ab=no; expires=Thu, 01 Jan 2030 00:00:00 UTC; path=/; domain=.dcinside.com";
            };
            laundryDC();
            try { lock('is_adblock', false); lock('adblock_chk', false); lock('canRunAds', true); lock('is_ad_block', 'N'); } catch (e) {}

            const dcStyle = document.createElement('style');
            dcStyle.textContent = `
                #moveOverlay, #moveimg, .adv-group, .adv-groupin, .adv-grouptop, .pwlink,
                .penalty-box, .pp-box:has(.penalty-box), div[id*="ad_middle"], iframe[src*="netinsight"] {
                    position: absolute !important; left: -9999px !important; top: -9999px !important;
                    width: 1px !important; height: 1px !important; overflow: hidden !important; 
                    opacity: 0 !important; pointer-events: none !important;
                }
            `;
            (document.head || document.documentElement).appendChild(dcStyle);

            const originalFetch = window.fetch;
            window.fetch = async (...args) => {
                const url = typeof args[0] === 'string' ? args[0] : args[0]?.url;
                if (url && (url.includes('ajax/naverad') || url.includes('naverad'))) return new Response(JSON.stringify({ ads: [] }), { status: 200 });
                return originalFetch.apply(window, args);
            };
            setInterval(laundryDC, 800);

            runAtDocumentEnd(() => {
                const isBlocked = document.body.innerText.includes("너무 많은 요청으로") || document.querySelector('.penalty-box-inner');

                if (isBlocked) {
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
                    return;
                }

                const ipCategories = [
                    { label: "통피", ips: ["39.7", "39.119", "106.101", "106.102", "110.70", "114.200", "114.201", "117.111", "118.235", "125.188", "175.223", "175.252", "210.125", "211.36", "211.234", "211.246", "223.32", "223.33", "223.38", "223.39", "223.62"] },
                    { label: "비공개/WARP", ips: ["104.28", "172.225", "172.226", "172.227", "8.20", "8.21", "8.22", "8.23", "162.158", "188.114", "104.16", "104.17", "162.159", "172.64", "172.65", "172.66", "172.67", "172.68", "172.69", "172.70", "172.71"] },
                    { label: "VPN/우회", ips: ["140.248", "185.123", "185.240", "185.244", "185.156", "185.212", "194.33", "194.226", "156.146", "212.102", "193.176", "89.39", "37.19", "37.120", "84.17", "103.153", "103.208", "149.28", "45.32", "207.246", "104.238", "139.180", "13.124", "13.125", "3.34", "3.35", "34.64", "35.216", "45.13", "45.14", "45.89", "192.145", "108.162", "141.101", "173.245", "198.41", "138.199", "146.70", "169.150", "217.138", "185.242", "149.34", "89.40", "152.233" ] }
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
                const dcObserver = new MutationObserver((mutations) => {
                    if(mutations.some(m => m.addedNodes.length > 0)) tagIPs();
                });
                dcObserver.observe(document.body, { childList: true, subtree: true });

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
            });
        })();
    }
    // ====================== [모듈 4: 디시인사이드 끝] ==========================



    // =========================================================================
    // 📦 [모듈 5] Mobile Absolute Copy Unlocker 🔓 v10.0 (최적화 버전)
    // - 작동 조건: 모든 사이트 (*://*/*)
    // - 실행 시점: 즉시 (document-start) + MutationObserver 감시
    // =========================================================================
    if (ENABLE_MODULES.copyUnlocker) {
        (function() {
            // 1. 강제 텍스트 선택 CSS 주입 (innerHTML 대신 textContent 사용)
            function injectCSS() {
                const root = document.head || document.documentElement;
                if (!root || document.getElementById('unlock-copy-css')) return;
                const style = document.createElement('style');
                style.id = 'unlock-copy-css';
                style.textContent = `
                    * {
                        -webkit-user-select: text !important;
                        -moz-user-select: text !important;
                        -ms-user-select: text !important;
                        user-select: text !important;
                        -webkit-touch-callout: default !important;
                    }
                `;
                root.appendChild(style);
            }

            // 2. 복사 방지 자바스크립트 이벤트 무력화
            const blockedEvents = ['contextmenu', 'selectstart', 'dragstart', 'copy', 'cut', 'paste'];
            blockedEvents.forEach(event => {
                document.addEventListener(event, function(e) {
                    e.stopPropagation();
                }, true);
            });

            // 3. [최적화] setInterval(1초 주기 연산) 제거 -> 즉시 주입 및 태그 삭제 시에만 반응
            injectCSS();
            const cssObserver = new MutationObserver(() => {
                if (!document.getElementById('unlock-copy-css')) injectCSS();
            });
            if (document.documentElement) {
                cssObserver.observe(document.documentElement, { childList: true });
            }
            window.addEventListener('DOMContentLoaded', () => {
                injectCSS();
                if (document.head) cssObserver.observe(document.head, { childList: true });
            }, { once: true });

            // 4. iOS 리퀴드 토스트 (최상위 프레임에서만 1회 표시)
            function showToast() {
                if (window.top !== window.self) return; // iframe 내부 중복 실행 방지
                if (document.getElementById('liquid-toast')) return;
                if (!document.body) return;

                const toast = document.createElement('div');
                toast.id = 'liquid-toast';

                const iconSpan = document.createElement('span');
                iconSpan.textContent = '🔓';
                iconSpan.style.cssText = 'margin-right:8px; filter: drop-shadow(0 0 2px rgba(0,0,0,0.3));';

                const textNode = document.createTextNode('복사 해제됨');

                toast.appendChild(iconSpan);
                toast.appendChild(textNode);

                toast.style.cssText = `
                    position: fixed; 
                    top: 25px; 
                    left: 50%; 
                    transform: translateX(-50%) scale(0.6); 
                    opacity: 0;
                    background: rgba(255, 255, 255, 0.1); 
                    backdrop-filter: blur(15px) saturate(180%) brightness(0.92);
                    -webkit-backdrop-filter: blur(15px) saturate(180%) brightness(0.92);
                    border: 0.5px solid rgba(0, 0, 0, 0.08); 
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15), inset 0 0 0 0.5px rgba(255, 255, 255, 0.2); 
                    color: #ffffff; 
                    text-shadow: 0 1px 4px rgba(0,0,0,0.3);
                    padding: 10px 24px; 
                    border-radius: 60px; 
                    font-size: 13px; 
                    font-weight: 600;
                    display: flex;
                    align-items: center;
                    z-index: 2147483647; 
                    pointer-events: none; 
                    transition: all 0.75s cubic-bezier(0.2, 1.4, 0.3, 1);
                `;

                document.body.appendChild(toast);

                setTimeout(() => {
                    if (toast) {
                        toast.style.opacity = '1';
                        toast.style.transform = 'translateX(-50%) scale(1) translateY(10px)';
                    }
                }, 50);

                setTimeout(() => {
                    if (toast) {
                        toast.style.opacity = '0';
                        toast.style.transform = 'translateX(-50%) scale(0.9) translateY(-10px)';
                    }
                }, 2000);

                setTimeout(() => { if (toast) toast.remove(); }, 2900);
            }

            if (document.readyState === 'loading') {
                window.addEventListener('DOMContentLoaded', showToast, { once: true });
            } else {
                setTimeout(showToast, 300);
            }
        })();
    }
    // ====================== [모듈 5: 복사 해제 끝] ============================

})();