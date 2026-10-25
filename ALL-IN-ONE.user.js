// ==UserScript==
// @name         [통합] 내 전용 웹사이트 편의성 & 광고 차단팩
// @namespace    http://tampermonkey.net/
// @version      1.7
// @description  1.나무위키 광고차단(최적화) | 2.툰코 스크롤 메뉴 | 3.유튜브 PiP | 4.디시 스텔스·IP식별·원본이미지 | 5.블로그·티스토리 복사 해제
//
// --- [1. 나무위키 주소 규칙] ---
// @match        *://namu.wiki/*
//
// --- [2. 툰코 주소 규칙] ---
// @match        *://*.toonkor*/*
// @match        *://toonkor*/*
// @include      /^https?:\/\/(www\.)?toonkor[0-9]*\.[a-z]+\/.*$/
//
// --- [3. 유튜브 주소 규칙] ---
// @match        *://*.youtube.com/*
//
// --- [4. 디시인사이드 주소 규칙] ---
// @match        *://*.dcinside.com/*
//
// --- [5. 복사 해제(네이버 블로그 & 티스토리) 주소 규칙] ---
// @match        *://blog.naver.com/*
// @match        *://*.blog.naver.com/*
// @match        *://*.tistory.com/*
//
// --- [공통 실행 시점 및 권한] ---
// @run-at       document-start
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // =========================================================================
    // 🎛️ [통합 관리 스위치] 특정 기능만 잠시 끄려면 true를 false로 바꾸세요.
    // =========================================================================
    const ENABLE_MODULES = {
        namuwiki:     true, // 모듈 1: 나무위키 파워링크(위장 목차) 제거 (배터리 최적화)
        toonkor:      true, // 모듈 2: 툰코 뷰어 스크롤 메뉴 숨김/표시
        youtube:      true, // 모듈 3: 유튜브 전용 PiP 버튼 및 단축키(Ctrl+P)
        dcinside:     true, // 모듈 4: 디시 스텔스 & 실시간 IP 식별 & 원본 이미지 자동 로드
        copyUnlocker: true  // 모듈 5: 네이버 블로그 & 티스토리 복사 방지 해제 (무소음)
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
    // 📦 [모듈 1] NamuWiki Powerlink Kill (Fake TOC) v8.1 (배터리 최적화 버전)
    // - 작동 조건: namu.wiki 접속 시
    // - 개선 사항: 0.3초 무한 setInterval 제거 -> DOM 변화 시에만 프레임 단위로 1회 스캔
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

            let scanScheduled = false;
            const scan = () => {
                scanScheduled = false;

                // [패턴 1] 가짜 앵커 추적 (실제 목차 번호 완벽 보호)
                document.querySelectorAll('a[href^="#s-"]').forEach(a => {
                    const text = a.textContent.trim();
                    if (!text) return;
                    if (/^[\d.]+$/.test(text)) return;
                    if (/^\[\d+\]$/.test(text)) return;
                    if (a.classList.contains('wiki-link-internal')) return;
                    nuke(a);
                });

                // [패턴 2] 허니팟(워터마크) 텍스트 추적
                document.querySelectorAll('div, span').forEach(el => {
                    if (el.childNodes.length === 1 && el.firstChild.nodeType === Node.TEXT_NODE) {
                        const text = el.textContent.trim();
                        if (text.length >= 6 && text.length <= 15 && el.classList.contains(text)) {
                            nuke(el);
                        }
                    }
                });
            };

            // DOM에 실제 추가된 노드가 있을 때만 화면 주사율(rAF)에 맞춰 1회 실행 (무한 타이머 제거)
            const scheduleScan = () => {
                if (!scanScheduled) {
                    scanScheduled = true;
                    window.requestAnimationFrame(scan);
                }
            };

            const observer = new MutationObserver((mutations) => {
                if (mutations.some(m => m.addedNodes.length > 0)) {
                    scheduleScan();
                }
            });

            const start = () => {
                if (document.body) {
                    observer.observe(document.body, { childList: true, subtree: true });
                    scan();
                } else {
                    window.requestAnimationFrame(start);
                }
            };
            start();
        })();
    }
    // ======================= [모듈 1: 나무위키 끝] ============================



    // =========================================================================
    // 📦 [모듈 2] 툰코(Toonkor) 뷰어 스크롤 메뉴 숨김/표시 v1.1
    // - 작동 조건: toonkor 도메인 접속 시
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
    // 📦 [모듈 4] Dcinside Stealth, IP Tagger & Original Image Loader v3.1
    // - 작동 조건: dcinside.com 접속 시
    // - 포함 기능: 애드블록 감지 무력화 + 실시간 IP 식별 + 모바일/PC 원본 이미지 즉시 로드
    // =========================================================================
    if (ENABLE_MODULES.dcinside && currentHost.includes('dcinside.com')) {
        (function() {
            // [4-1] 스텔스 & 애드블록 감지 무력화 (document-start 즉시 실행)
            const lock = (p, v) => {
                try { Object.defineProperty(window, p, { value: v, writable: false, configurable: false }); } catch (e) {}
            };
            if (typeof window.getCookie === 'undefined') window.getCookie = () => '';
            if (typeof window.setCookie_hk_hour === 'undefined') window.setCookie_hk_hour = () => {};

            const laundryDC = () => {
                try {
                    localStorage.removeItem('adblock_detected');
                    localStorage.removeItem('find_ab');
                    localStorage.removeItem('find_ab_check');
                    if (document.cookie.includes('find_ab=ok')) {
                        document.cookie = "find_ab=no; expires=Thu, 01 Jan 2030 00:00:00 UTC; path=/; domain=.dcinside.com";
                    }
                } catch (e) {}
            };
            laundryDC();
            lock('is_adblock', false);
            lock('adblock_chk', false);
            lock('canRunAds', true);
            lock('is_ad_block', 'N');

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
                if (url && (url.includes('ajax/naverad') || url.includes('naverad'))) {
                    return new Response(JSON.stringify({ ads: [] }), { status: 200 });
                }
                return originalFetch.apply(window, args);
            };

            // [4-2] 실시간 IP 식별 & 본문 원본 이미지 즉시 로드 (DOM 로드 완료 후 실행)
            runAtDocumentEnd(() => {
                laundryDC();

                const ipCategories = [
                    { label: "통피", ips: ["39.7", "39.119", "106.101", "106.102", "110.70", "114.200", "114.201", "117.111", "118.235", "125.188", "175.223", "175.252", "210.125", "211.36", "211.234", "211.246", "223.32", "223.33", "223.38", "223.39", "223.62"] },
                    { label: "비공개/WARP", ips: ["104.28", "172.225", "172.226", "172.227", "8.20", "8.21", "8.22", "8.23", "162.158", "188.114", "104.16", "104.17", "162.159", "172.64", "172.65", "172.66", "172.67", "172.68", "172.69", "172.70", "172.71"] },
                    { label: "VPN/우회", ips: ["140.248", "185.123", "185.240", "185.244", "185.156", "185.212", "194.33", "194.226", "156.146", "212.102", "193.176", "89.39", "37.19", "37.120", "84.17", "103.153", "103.208", "149.28", "45.32", "207.246", "104.238", "139.180", "13.124", "13.125", "3.34", "3.35", "34.64", "35.216", "45.13", "45.14", "45.89", "192.145", "108.162", "141.101", "173.245", "198.41", "138.199", "146.70", "169.150", "217.138", "185.242", "149.34", "89.40", "152.233"] }
                ];

                function tagIPs() {
                    document.querySelectorAll('.ip').forEach(el => {
                        if (el.dataset.ipTagged === "true") return;
                        const text = el.textContent;
                        const ipMatch = text.match(/\((\d{1,3}\.\d{1,3})\)/);
                        if (ipMatch && ipMatch[1]) {
                            const ip = ipMatch[1];
                            let label = "개인/기타";
                            for (const category of ipCategories) {
                                if (category.ips.includes(ip)) {
                                    label = category.label;
                                    break;
                                }
                            }
                            const tagSpan = document.createElement('span');
                            tagSpan.innerText = ` [${label}]`;
                            el.appendChild(tagSpan);
                            el.dataset.ipTagged = "true";
                        }
                    });
                }

                // 본문 내 지연 로딩(data-original) 이미지를 즉시 원본 소스로 강제 전환
                function loadOriginalImages() {
                    const targetSelectors = '.thum-txtin img, .write_div img, .gallview_contents img';
                    document.querySelectorAll(targetSelectors).forEach(img => {
                        if (img.dataset.origLoaded === "true") return;
                        // 디시콘 및 기본 아이콘은 제외
                        if (img.classList.contains('written_dccon') || (img.src && img.src.includes('dcinside_icon'))) return;

                        const realSrc = img.getAttribute('data-original') || img.getAttribute('data-src');
                        if (realSrc) {
                            img.src = realSrc;
                            img.removeAttribute('data-original');
                            img.removeAttribute('data-src');
                            img.classList.remove('lazy');
                        }
                        img.loading = 'eager';
                        img.dataset.origLoaded = "true";
                    });
                }

                tagIPs();
                loadOriginalImages();

                let dcScheduled = false;
                const dcObserver = new MutationObserver((mutations) => {
                    if (!dcScheduled && mutations.some(m => m.addedNodes.length > 0)) {
                        dcScheduled = true;
                        window.requestAnimationFrame(() => {
                            dcScheduled = false;
                            tagIPs();
                            loadOriginalImages();
                        });
                    }
                });
                if (document.body) {
                    dcObserver.observe(document.body, { childList: true, subtree: true });
                }
            });
        })();
    }
    // ====================== [모듈 4: 디시인사이드 끝] ==========================



    // =========================================================================
    // 📦 [모듈 5] Mobile Absolute Copy Unlocker 🔓 v10.1 (무소음 · 경량화 버전)
    // - 작동 조건: 네이버 블로그(blog.naver.com) & 티스토리(tistory.com) 접속 시
    // =========================================================================
    const isCopyUnlockTarget = currentHost.includes('blog.naver.com') || currentHost.includes('tistory.com');

    if (ENABLE_MODULES.copyUnlocker && isCopyUnlockTarget) {
        (function() {
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

            const blockedEvents = ['contextmenu', 'selectstart', 'dragstart', 'copy', 'cut', 'paste'];
            blockedEvents.forEach(event => {
                document.addEventListener(event, function(e) {
                    e.stopPropagation();
                }, true);
            });

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
        })();
    }
    // ====================== [모듈 5: 복사 해제 끝] ============================

})();