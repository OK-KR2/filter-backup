// ==UserScript==
// @name         [통합] 내 전용 웹사이트 편의성 & 광고 차단팩
// @namespace    http://tampermonkey.net/
// @version      2.3
// @description  1.나무위키 광고차단 | 2.툰코 스크롤 메뉴 | 3.유튜브 PiP·백그라운드·최고화질 | 4.디시 스텔스·짧은IP·원본짤·키워드/유저차단 | 5.블로그·티스토리 복사 해제
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
// --- [공통 실행 시점 및 권한 (모든 스크립트 앱 100% 호환)] ---
// @run-at       document-start
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // =========================================================================
    // 🎛️ [통합 관리 스위치] 특정 기능만 잠시 끄려면 true를 false로 바꾸세요.
    // =========================================================================
    const ENABLE_MODULES = {
        namuwiki:     true, // 모듈 1: 나무위키 파워링크(위장 목차) 제거
        toonkor:      true, // 모듈 2: 툰코 뷰어 스크롤 메뉴 숨김/표시
        youtube:      true, // 모듈 3: 유튜브 백그라운드 재생 + 최고화질 고정 + PiP 버튼
        dcinside:     true, // 모듈 4: 디시 스텔스 + 짧은 IP 식별 + 원본 이미지 + 키워드/유저 차단창
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
    // 📦 [모듈 1] NamuWiki Powerlink Kill (Fake TOC) v8.2
    // - 작동 조건: namu.wiki 접속 시
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
                        if (text.length >= 6 && text.length <= 15 && el.classList.contains(text)) {
                            nuke(el);
                        }
                    }
                });
            };

            const scheduleScan = () => {
                if (!scanScheduled) {
                    scanScheduled = true;
                    window.requestAnimationFrame(scan);
                }
            };

            const triggerDelayedSafetyScan = () => {
                scheduleScan();
                setTimeout(scheduleScan, 500);
                setTimeout(scheduleScan, 1500);
            };

            const observer = new MutationObserver((mutations) => {
                if (mutations.some(m => m.addedNodes.length > 0)) {
                    scheduleScan();
                }
            });

            const start = () => {
                if (document.body) {
                    observer.observe(document.body, { childList: true, subtree: true });
                    triggerDelayedSafetyScan();
                } else {
                    window.requestAnimationFrame(start);
                }
            };
            start();

            window.addEventListener('popstate', triggerDelayedSafetyScan);
            window.addEventListener('load', triggerDelayedSafetyScan, { once: true });
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
    // 📦 [모듈 3] YouTube Background Play, Auto Max Quality & PiP v34.2
    // - 작동 조건: youtube.com 접속 시
    // =========================================================================
    if (ENABLE_MODULES.youtube && currentHost.includes('youtube.com')) {
        (function() {
            const YT_CONFIG = {
                autoMaxQuality: true,     // 최고 화질 자동 고정 켜기/끄기
                targetRes: 'hd2160'       // 목표 최대 화질 ('hd2160'=4K, 'hd1440'=QHD, 'hd1080'=FHD)
            };

            // [3-1] 백그라운드 재생 활성화 (document-start 시점에 즉시 상태 위장)
            try {
                Object.defineProperties(document, {
                    'hidden': { get: () => false, configurable: true },
                    'webkitHidden': { get: () => false, configurable: true },
                    'visibilityState': { get: () => 'visible', configurable: true },
                    'webkitVisibilityState': { get: () => 'visible', configurable: true }
                });
            } catch (e) {}

            const blockBgEvents = (e) => {
                e.stopImmediatePropagation();
            };
            ['visibilitychange', 'webkitvisibilitychange', 'mozvisibilitychange', 'pagehide'].forEach(evt => {
                window.addEventListener(evt, blockBgEvents, true);
                document.addEventListener(evt, blockBgEvents, true);
            });

            const keepAliveLact = () => {
                if (typeof window._lact !== 'undefined') {
                    window._lact = Date.now();
                }
            };
            ['touchstart', 'click', 'scroll', 'keydown'].forEach(evt => {
                window.addEventListener(evt, keepAliveLact, { passive: true });
            });

            // [3-2] 최고 화질(1080p 이상) 자동 고정 로직
            const setYtLocalStorageQuality = () => {
                if (!YT_CONFIG.autoMaxQuality) return;
                try {
                    const now = Date.now();
                    const qualityPayload = {
                        data: JSON.stringify({ quality: 2160, previousQuality: 1080 }),
                        expiration: now + 31536000000,
                        creation: now
                    };
                    localStorage.setItem('yt-player-quality', JSON.stringify(qualityPayload));
                } catch (e) {}
            };
            setYtLocalStorageQuality();

            const applyMaxQualityToPlayer = () => {
                if (!YT_CONFIG.autoMaxQuality) return;
                try {
                    const player = document.getElementById('movie_player') || document.querySelector('.html5-video-player');
                    if (!player || typeof player.getAvailableQualityLevels !== 'function') return;

                    const available = player.getAvailableQualityLevels();
                    if (!available || available.length === 0) return;

                    const qualityOrder = ['highres', 'hd2160', 'hd1440', 'hd1080', 'hd720', 'large', 'medium', 'small', 'tiny'];
                    const startIndex = Math.max(0, qualityOrder.indexOf(YT_CONFIG.targetRes));

                    let chosen = available[0];
                    for (let i = startIndex; i < qualityOrder.length; i++) {
                        if (available.includes(qualityOrder[i])) {
                            chosen = qualityOrder[i];
                            break;
                        }
                    }

                    if (typeof player.setPlaybackQualityRange === 'function') {
                        player.setPlaybackQualityRange(chosen, chosen);
                    }
                    if (typeof player.setPlaybackQuality === 'function') {
                        player.setPlaybackQuality(chosen);
                    }
                } catch (e) {}
            };

            let lastQualityVideoSrc = '';
            document.addEventListener('playing', (e) => {
                if (e.target && e.target.tagName === 'VIDEO') {
                    if (e.target.currentSrc !== lastQualityVideoSrc) {
                        lastQualityVideoSrc = e.target.currentSrc;
                        applyMaxQualityToPlayer();
                        setTimeout(applyMaxQualityToPlayer, 400);
                    }
                }
            }, true);


            // [3-3] /watch 전용 PiP 플로팅 버튼 및 단축키 (document-idle 시점 실행)
            runAtDocumentIdle(function() {
                let cachedVideo = null;
                let lastVideoCheckTime = 0;

                const isWatchPage = () => window.location.pathname.startsWith('/watch');

                const getActiveVideo = () => {
                    const now = Date.now();
                    if (cachedVideo && document.body.contains(cachedVideo) && (now - lastVideoCheckTime < 2000)) {
                        return cachedVideo;
                    }

                    let videos = Array.from(document.querySelectorAll('video'));
                    if (videos.length === 0) {
                        document.querySelectorAll('*').forEach(el => {
                            if (el.shadowRoot) {
                                videos.push(...el.shadowRoot.querySelectorAll('video'));
                            }
                        });
                    }

                    if (videos.length === 0) return null;

                    const mainVideo = videos.sort((a, b) => (b.clientWidth * b.clientHeight) - (a.clientWidth * a.clientHeight))[0];
                    cachedVideo = mainVideo;
                    lastVideoCheckTime = now;
                    return mainVideo;
                };

                const togglePiP = () => {
                    const v = getActiveVideo();
                    if (!v) return;

                    if (typeof v.webkitSetPresentationMode === 'function') {
                        v.webkitSetPresentationMode(v.webkitPresentationMode === 'picture-in-picture' ? 'inline' : 'picture-in-picture');
                    } else if (document.pictureInPictureElement) {
                        document.exitPictureInPicture().catch(console.error);
                    } else if (document.pictureInPictureEnabled) {
                        v.requestPictureInPicture().catch(console.error);
                    }
                };

                window.addEventListener('keydown', (e) => {
                    if (e.ctrlKey && e.key.toLowerCase() === 'p') {
                        togglePiP();
                    }
                });

                let pipCheckScheduled = false;
                const updatePipButton = () => {
                    pipCheckScheduled = false;
                    if (!document.body) return;

                    let btn = document.getElementById('force-pip-btn');

                    if (!isWatchPage()) {
                        if (btn) btn.style.setProperty('display', 'none', 'important');
                        return;
                    }

                    if (!document.querySelector('video')) return;

                    if (!btn) {
                        btn = document.createElement('button');
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
                            e.preventDefault();
                            e.stopPropagation();
                            togglePiP();
                        };
                        document.body.appendChild(btn);
                    } else {
                        btn.style.setProperty('display', 'block', 'important');
                    }
                };

                const schedulePipUpdate = () => {
                    if (!pipCheckScheduled) {
                        pipCheckScheduled = true;
                        window.requestAnimationFrame(updatePipButton);
                    }
                };

                ['yt-navigate-finish', 'yt-page-data-updated', 'state-navigateend', 'popstate'].forEach(evt => {
                    window.addEventListener(evt, () => {
                        schedulePipUpdate();
                        applyMaxQualityToPlayer();
                    });
                });

                const ytObserver = new MutationObserver((mutations) => {
                    if (mutations.some(m => m.addedNodes.length > 0)) {
                        schedulePipUpdate();
                    }
                });
                if (document.body) {
                    ytObserver.observe(document.body, { childList: true, subtree: true });
                }
                updatePipButton();
                applyMaxQualityToPlayer();
            });
        })();
    }
    // ======================= [모듈 3: 유튜브 끝] ==============================



    // =========================================================================
    // 📦 [모듈 4] Dcinside Stealth, Short IP Tagger, Original Image & Mute Manager v5.1
    // - 작동 조건: dcinside.com 접속 시
    // - v5.1 개선:
    //   1) 짧은 IP 표기: [통피], [비공개], [개인], [VPN] + 모바일 작성자 칸 잘림(overflow) 해제
    //   2) 마이너갤 말머리([?질문] 등)를 닉네임으로 오인식하던 버그 완벽 수정 (날짜 앞 칸 정확 타겟팅)
    //   3) 하단 차단 관리 모달창에 '차단 키워드 직접 입력/추가/삭제' 기능 탑재
    // =========================================================================
    if (ENABLE_MODULES.dcinside && currentHost.includes('dcinside.com')) {
        (function() {
            // ⚙️ [디시인사이드 뮤트(차단) 기본 설정 구역]
            const DC_MUTE_CONFIG = {
                confirmBeforeMute: true,  // [차단] 터치 시 확인 창 띄우기 (바로 차단하려면 false)
                autoBackOnPostMute: false,// 글 본문 상단에서 작성자 [차단] 시 자동으로 뒤로 가기 여부
                ips: [],                  // 코드 고정 차단 IP (예: ['58.120'])
                keywords: [],             // 코드 고정 차단 키워드 (예: ['카지노', '도박'])
                nicks: [],                // 코드 고정 차단 닉네임 (예: ['어그로닉'])
                categories: []            // 카테고리 통째 차단 ('통피', '비공개', 'VPN', '개인')
            };

            const STORAGE_KEY = 'dc_custom_mute_v1';

            // [하이브리드 저장소 엔진] localStorage + .dcinside.com 루트 쿠키 양방향 동기화 (ips, nicks, keywords 모두 포함)
            const normalizeData = (obj) => ({
                ips: (obj && Array.isArray(obj.ips)) ? Array.from(new Set(obj.ips)) : [],
                nicks: (obj && Array.isArray(obj.nicks)) ? Array.from(new Set(obj.nicks)) : [],
                keywords: (obj && Array.isArray(obj.keywords)) ? Array.from(new Set(obj.keywords)) : [],
                t: (obj && typeof obj.t === 'number') ? obj.t : 0
            });

            const readLocalStore = () => {
                try {
                    const raw = localStorage.getItem(STORAGE_KEY);
                    if (raw) return normalizeData(JSON.parse(raw));
                } catch (e) {}
                return null;
            };

            const readRootCookie = () => {
                try {
                    const m = document.cookie.match(new RegExp('(?:^|;\\s*)' + STORAGE_KEY + '=([^;]*)'));
                    if (m && m[1]) return normalizeData(JSON.parse(decodeURIComponent(m[1])));
                } catch (e) {}
                return null;
            };

            const writeHybridStore = (data) => {
                const payload = {
                    ips: Array.from(new Set(data.ips || [])),
                    nicks: Array.from(new Set(data.nicks || [])),
                    keywords: Array.from(new Set(data.keywords || [])),
                    t: Date.now()
                };
                const jsonStr = JSON.stringify(payload);

                try { localStorage.setItem(STORAGE_KEY, jsonStr); } catch (e) {}

                try {
                    const encoded = encodeURIComponent(jsonStr);
                    if (encoded.length < 3800) {
                        document.cookie = `${STORAGE_KEY}=${encoded}; expires=Thu, 01 Jan 2035 00:00:00 UTC; path=/; domain=.dcinside.com; SameSite=Lax`;
                    }
                } catch (e) {}

                return payload;
            };

            const loadSavedMutes = () => {
                const ls = readLocalStore();
                const ck = readRootCookie();

                if (ls && ck) {
                    if (ck.t > ls.t) {
                        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(ck)); } catch (e) {}
                        return ck;
                    } else if (ls.t > ck.t) {
                        writeHybridStore(ls);
                        return ls;
                    }
                    return ls;
                } else if (ck && !ls) {
                    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(ck)); } catch (e) {}
                    return ck;
                } else if (ls && !ck) {
                    writeHybridStore(ls);
                    return ls;
                }
                return { ips: [], nicks: [], keywords: [], t: 0 };
            };

            let dynamicMutes = loadSavedMutes();

            const addMuteItem = (type, value) => {
                if (!value) return;
                dynamicMutes = loadSavedMutes();
                if (!dynamicMutes[type].includes(value)) {
                    dynamicMutes[type].push(value);
                    dynamicMutes = writeHybridStore(dynamicMutes);
                }
            };

            const removeMuteItem = (type, value) => {
                dynamicMutes = loadSavedMutes();
                dynamicMutes[type] = dynamicMutes[type].filter(item => item !== value);
                dynamicMutes = writeHybridStore(dynamicMutes);
            };

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
                /* 모바일 글 목록에서 작성자 칸 가로 길이 제한 해제 (유동닉 차단 버튼 잘림 완벽 방지) */
                ul.gall-detail-lst ul.ginfo > li {
                    max-width: none !important;
                    overflow: visible !important;
                }
                .dc-ip-tag-span {
                    font-size: 11px;
                    opacity: 0.85;
                }
                .dc-one-touch-mute-btn {
                    display: inline-block;
                    margin-left: 3px;
                    margin-right: 2px;
                    padding: 0px 4px;
                    font-size: 10.5px !important;
                    font-weight: normal !important;
                    line-height: 1.35 !important;
                    color: #d9534f !important;
                    border: 1px solid rgba(217, 83, 79, 0.45);
                    border-radius: 3px;
                    background: rgba(217, 83, 79, 0.08);
                    cursor: pointer;
                    vertical-align: baseline;
                    user-select: none;
                }
                .dc-one-touch-mute-btn.is-muted {
                    color: #888 !important;
                    border-color: #ccc !important;
                    background: #eee !important;
                }
                #dc-mute-manage-bar {
                    text-align: center;
                    padding: 14px 10px;
                    font-size: 12px;
                }
                #dc-mute-manage-bar > button {
                    padding: 7px 14px;
                    border: 1px solid #ccc;
                    border-radius: 6px;
                    background: #f8f9fa;
                    color: #333;
                    font-size: 12px;
                    font-weight: 600;
                    cursor: pointer;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.08);
                }
                /* 차단 관리 모달 스타일 */
                #dc-mute-modal-backdrop {
                    position: fixed;
                    inset: 0;
                    background: rgba(0, 0, 0, 0.55);
                    z-index: 2147483646;
                    display: none;
                    align-items: center;
                    justify-content: center;
                    padding: 16px;
                    box-sizing: border-box;
                }
                #dc-mute-modal-backdrop.on {
                    display: flex;
                }
                #dc-mute-modal {
                    width: 100%;
                    max-width: 410px;
                    max-height: 82vh;
                    background: #fff;
                    color: #222;
                    border-radius: 12px;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.3);
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                    font-family: -apple-system, BlinkMacSystemFont, "Malgun Gothic", sans-serif;
                }
                .dc-mm-head {
                    padding: 13px 16px;
                    background: #2b303a;
                    color: #fff;
                    font-size: 14px;
                    font-weight: 700;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .dc-mm-close {
                    background: none;
                    border: 0;
                    color: #fff;
                    font-size: 18px;
                    cursor: pointer;
                    padding: 0 4px;
                }
                .dc-mm-body {
                    padding: 14px 16px;
                    overflow-y: auto;
                    flex: 1 1 auto;
                    font-size: 13px;
                }
                .dc-mm-sec-title {
                    font-weight: 700;
                    margin: 0 0 6px 0;
                    color: #444;
                    font-size: 12px;
                }
                .dc-mm-kw-row {
                    display: flex;
                    gap: 6px;
                    margin-bottom: 10px;
                }
                .dc-mm-kw-row input {
                    flex: 1 1 auto;
                    padding: 6px 10px;
                    border: 1px solid #ced4da;
                    border-radius: 6px;
                    font-size: 13px;
                    color: #222;
                    background: #fff;
                }
                .dc-mm-kw-row button {
                    flex: 0 0 auto;
                    padding: 6px 12px;
                    border: 0;
                    border-radius: 6px;
                    background: #3b5998;
                    color: #fff;
                    font-size: 12px;
                    font-weight: 600;
                    cursor: pointer;
                }
                .dc-mm-chips {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 6px;
                    margin-bottom: 14px;
                }
                .dc-mm-chip {
                    display: inline-flex;
                    align-items: center;
                    background: #f1f3f5;
                    border: 1px solid #dee2e6;
                    border-radius: 16px;
                    padding: 3px 9px;
                    font-size: 12px;
                    color: #333;
                }
                .dc-mm-chip button {
                    margin-left: 5px;
                    border: 0;
                    background: none;
                    color: #d9534f;
                    font-weight: 700;
                    font-size: 12px;
                    cursor: pointer;
                    padding: 0 2px;
                }
                .dc-mm-empty {
                    color: #999;
                    font-size: 12px;
                    margin-bottom: 14px;
                }
                .dc-mm-foot {
                    padding: 10px 12px;
                    border-top: 1px solid #eee;
                    background: #f8f9fa;
                    display: flex;
                    gap: 6px;
                    flex-wrap: wrap;
                }
                .dc-mm-foot button {
                    flex: 1 1 auto;
                    padding: 8px 6px;
                    border: 1px solid #ced4da;
                    border-radius: 6px;
                    background: #fff;
                    color: #333;
                    font-size: 12px;
                    font-weight: 600;
                    cursor: pointer;
                }
                .dc-mm-foot button.danger {
                    color: #d9534f;
                    border-color: #f5c6cb;
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

            // [4-2] 짧은 IP 식별, 원본 이미지 로드, 정확한 작성자 타겟팅 원터치 차단 & 관리 모달
            runAtDocumentEnd(() => {
                laundryDC();

                // 요청하신 짧은 표기 적용: [통피], [비공개], [VPN], [개인]
                const ipCategories = [
                    { label: "통피", ips: ["39.7", "39.119", "106.101", "106.102", "110.70", "114.200", "114.201", "117.111", "118.235", "125.188", "175.223", "175.252", "210.125", "211.36", "211.234", "211.246", "223.32", "223.33", "223.38", "223.39", "223.62"] },
                    { label: "비공개", ips: ["104.28", "172.225", "172.226", "172.227", "8.20", "8.21", "8.22", "8.23", "162.158", "188.114", "104.16", "104.17", "162.159", "172.64", "172.65", "172.66", "172.67", "172.68", "172.69", "172.70", "172.71"] },
                    { label: "VPN", ips: ["140.248", "185.123", "185.240", "185.244", "185.156", "185.212", "194.33", "194.226", "156.146", "212.102", "193.176", "89.39", "37.19", "37.120", "84.17", "103.153", "103.208", "149.28", "45.32", "207.246", "104.238", "139.180", "13.124", "13.125", "3.34", "3.35", "34.64", "35.216", "45.13", "45.14", "45.89", "192.145", "108.162", "141.101", "173.245", "198.41", "138.199", "146.70", "169.150", "217.138", "185.242", "149.34", "89.40", "152.233"] }
                ];

                const getIpLabel = (ip) => {
                    for (const category of ipCategories) {
                        if (category.ips.includes(ip)) return category.label;
                    }
                    return "개인";
                };

                const getCleanText = (el) => {
                    if (!el) return '';
                    const clone = el.cloneNode(true);
                    clone.querySelectorAll('.dc-ip-tag-span, .dc-one-touch-mute-btn, .sp-nick').forEach(n => n.remove());
                    return clone.textContent.trim();
                };

                // 모바일 글 목록(ul.ginfo)에서 말머리([?질문] 등)를 피해 실제 작성자 <li>만 정확히 찾는 함수
                const findMobileWriterLi = (ginfoUl) => {
                    if (!ginfoUl) return null;
                    const lis = Array.from(ginfoUl.children);
                    // 1순위: 고닉/반고닉 아이콘(.sp-nick)이나 유동 IP 괄호가 들어있는 li
                    for (let i = 0; i < lis.length; i++) {
                        if (lis[i].querySelector('.sp-nick') || /\(\d{1,3}\.\d{1,3}\)/.test(lis[i].textContent)) {
                            return lis[i];
                        }
                    }
                    // 2순위: 날짜/시간(03:28, 10.25, 24.10.25 등) 바로 앞 칸의 li가 무조건 작성자 칸
                    const dateIdx = lis.findIndex(li => /^(\d{2}:\d{2}|\d{2}\.\d{2}|\d{4}\.\d{2}\.\d{2})/.test(li.textContent.trim()));
                    if (dateIdx > 0) return lis[dateIdx - 1];
                    return lis[0] || null;
                };

                function tagIPs() {
                    const selectors = '.ip, .block-ip, ul.ginfo > li, .gallview-tit-box ul.ginfo2 > li:first-child';
                    document.querySelectorAll(selectors).forEach(el => {
                        if (el.dataset.ipTagged === "true") return;
                        const text = getCleanText(el);
                        const ipMatch = text.match(/\((\d{1,3}\.\d{1,3})\)/);
                        if (ipMatch && ipMatch[1]) {
                            const ip = ipMatch[1];
                            const label = getIpLabel(ip);
                            const tagSpan = document.createElement('span');
                            tagSpan.className = 'dc-ip-tag-span';
                            tagSpan.innerText = `[${label}]`;
                            el.appendChild(tagSpan);
                            el.dataset.ipTagged = "true";
                            el.dataset.rawIp = ip;
                            el.dataset.ipCategory = label;
                        }
                    });
                }

                function loadOriginalImages() {
                    const targetSelectors = '.thum-txtin img, .write_div img, .gallview_contents img';
                    document.querySelectorAll(targetSelectors).forEach(img => {
                        if (img.dataset.origLoaded === "true") return;
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

                const copyTextToClipboard = async (text) => {
                    try {
                        if (navigator.clipboard && navigator.clipboard.writeText) {
                            await navigator.clipboard.writeText(text);
                            return true;
                        }
                    } catch (e) {}
                    try {
                        const ta = document.createElement('textarea');
                        ta.value = text;
                        ta.style.cssText = 'position:fixed;left:-9999px;top:0;';
                        document.body.appendChild(ta);
                        ta.focus();
                        ta.select();
                        const ok = document.execCommand('copy');
                        ta.remove();
                        return ok;
                    } catch (e) {
                        return false;
                    }
                };

                const refreshAllMuteStates = () => {
                    document.querySelectorAll('[data-muted-hidden="true"]').forEach(el => {
                        el.style.removeProperty('display');
                        el.removeAttribute('data-muted-hidden');
                    });
                    runDcTasks();
                };

                // 차단 관리 모달창 (키워드 직접 입력 추가/삭제 + IP/닉네임 개별 해제 + 백업/복원)
                let modalBackdrop = null;
                function openMuteManagerModal() {
                    dynamicMutes = loadSavedMutes();
                    if (!modalBackdrop) {
                        modalBackdrop = document.createElement('div');
                        modalBackdrop.id = 'dc-mute-modal-backdrop';
                        modalBackdrop.innerHTML = `
                            <div id="dc-mute-modal" role="dialog" aria-label="차단 목록 관리">
                                <div class="dc-mm-head">
                                    <span>🚫 디시 차단 관리 (키워드 / IP / 닉네임)</span>
                                    <button type="button" class="dc-mm-close" aria-label="닫기">✕</button>
                                </div>
                                <div class="dc-mm-body">
                                    <div class="dc-mm-sec-title">차단 키워드 추가 (제목·댓글 포함 시 숨김, 쉼표 구분 가능)</div>
                                    <div class="dc-mm-kw-row">
                                        <input type="text" id="dc-mm-kw-input" placeholder="예: 카지노, 도박, 스포" autocomplete="off">
                                        <button type="button" id="dc-mm-kw-add-btn">+ 추가</button>
                                    </div>
                                    <div id="dc-mm-kw-list" class="dc-mm-chips"></div>

                                    <div class="dc-mm-sec-title">차단된 유동 IP (✕ 터치 시 개별 해제)</div>
                                    <div id="dc-mm-ip-list" class="dc-mm-chips"></div>

                                    <div class="dc-mm-sec-title">차단된 닉네임 (✕ 터치 시 개별 해제)</div>
                                    <div id="dc-mm-nick-list" class="dc-mm-chips"></div>
                                </div>
                                <div class="dc-mm-foot">
                                    <button type="button" id="dc-mm-copy-btn">📋 백업 복사</button>
                                    <button type="button" id="dc-mm-restore-btn">📥 복원(붙여넣기)</button>
                                    <button type="button" id="dc-mm-clear-btn" class="danger">🗑️ 전체 초기화</button>
                                </div>
                            </div>
                        `;
                        document.body.appendChild(modalBackdrop);

                        modalBackdrop.addEventListener('click', (e) => {
                            if (e.target === modalBackdrop || e.target.classList.contains('dc-mm-close')) {
                                modalBackdrop.classList.remove('on');
                            }
                        });

                        // 키워드 추가 핸들러
                        const kwInput = modalBackdrop.querySelector('#dc-mm-kw-input');
                        const handleAddKeywords = () => {
                            const raw = kwInput.value.trim();
                            if (!raw) return;
                            raw.split(',').forEach(part => {
                                const clean = part.trim();
                                if (clean) addMuteItem('keywords', clean);
                            });
                            kwInput.value = '';
                            renderModalLists();
                            refreshAllMuteStates();
                        };
                        modalBackdrop.querySelector('#dc-mm-kw-add-btn').addEventListener('click', handleAddKeywords);
                        kwInput.addEventListener('keydown', (e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddKeywords();
                            }
                        });

                        // [📋 백업 복사]
                        modalBackdrop.querySelector('#dc-mm-copy-btn').addEventListener('click', async () => {
                            dynamicMutes = loadSavedMutes();
                            const exportObj = {
                                keywords: dynamicMutes.keywords,
                                ips: dynamicMutes.ips,
                                nicks: dynamicMutes.nicks
                            };
                            const exportStr = JSON.stringify(exportObj);
                            const ok = await copyTextToClipboard(exportStr);
                            if (ok) {
                                alert(`✅ 클립보드에 차단 목록이 복사되었습니다!\n\n${exportStr}`);
                            } else {
                                prompt('아래 텍스트를 복사해 보관하세요:', exportStr);
                            }
                        });

                        // [📥 복원(붙여넣기)]
                        modalBackdrop.querySelector('#dc-mm-restore-btn').addEventListener('click', () => {
                            const input = prompt('백업해 둔 JSON 텍스트를 붙여넣으세요:\n예: {"keywords":["도박"],"ips":["39.7"],"nicks":["어그로"]}');
                            if (!input) return;
                            try {
                                const parsed = JSON.parse(input.trim());
                                dynamicMutes = loadSavedMutes();
                                if (Array.isArray(parsed.keywords)) {
                                    parsed.keywords.forEach(kw => { if (!dynamicMutes.keywords.includes(kw)) dynamicMutes.keywords.push(String(kw).trim()); });
                                }
                                if (Array.isArray(parsed.ips)) {
                                    parsed.ips.forEach(ip => { if (!dynamicMutes.ips.includes(ip)) dynamicMutes.ips.push(String(ip).trim()); });
                                }
                                if (Array.isArray(parsed.nicks)) {
                                    parsed.nicks.forEach(nk => { if (!dynamicMutes.nicks.includes(nk)) dynamicMutes.nicks.push(String(nk).trim()); });
                                }
                                dynamicMutes = writeHybridStore(dynamicMutes);
                                renderModalLists();
                                refreshAllMuteStates();
                                alert('✅ 차단 목록이 성공적으로 복원되었습니다!');
                            } catch (err) {
                                alert('❌ 올바른 백업 형식(JSON)이 아닙니다.');
                            }
                        });

                        // [🗑️ 전체 초기화]
                        modalBackdrop.querySelector('#dc-mm-clear-btn').addEventListener('click', () => {
                            if (confirm('저장된 모든 차단 목록(키워드·IP·닉네임)을 초기화하시겠습니까?')) {
                                dynamicMutes = writeHybridStore({ ips: [], nicks: [], keywords: [] });
                                renderModalLists();
                                refreshAllMuteStates();
                            }
                        });
                    }

                    renderModalLists();
                    modalBackdrop.classList.add('on');
                }

                function renderModalLists() {
                    if (!modalBackdrop) return;
                    dynamicMutes = loadSavedMutes();
                    const kwBox = modalBackdrop.querySelector('#dc-mm-kw-list');
                    const ipBox = modalBackdrop.querySelector('#dc-mm-ip-list');
                    const nickBox = modalBackdrop.querySelector('#dc-mm-nick-list');
                    kwBox.innerHTML = '';
                    ipBox.innerHTML = '';
                    nickBox.innerHTML = '';

                    if (dynamicMutes.keywords.length === 0) {
                        kwBox.innerHTML = '<span class="dc-mm-empty">등록된 차단 키워드가 없습니다.</span>';
                    } else {
                        dynamicMutes.keywords.forEach(kw => {
                            const chip = document.createElement('span');
                            chip.className = 'dc-mm-chip';
                            chip.textContent = kw;
                            const delBtn = document.createElement('button');
                            delBtn.type = 'button';
                            delBtn.textContent = '✕';
                            delBtn.onclick = () => {
                                removeMuteItem('keywords', kw);
                                renderModalLists();
                                refreshAllMuteStates();
                            };
                            chip.appendChild(delBtn);
                            kwBox.appendChild(chip);
                        });
                    }

                    if (dynamicMutes.ips.length === 0) {
                        ipBox.innerHTML = '<span class="dc-mm-empty">차단된 IP가 없습니다.</span>';
                    } else {
                        dynamicMutes.ips.forEach(ip => {
                            const chip = document.createElement('span');
                            chip.className = 'dc-mm-chip';
                            chip.textContent = `${ip}[${getIpLabel(ip)}]`;
                            const delBtn = document.createElement('button');
                            delBtn.type = 'button';
                            delBtn.textContent = '✕';
                            delBtn.onclick = () => {
                                removeMuteItem('ips', ip);
                                renderModalLists();
                                refreshAllMuteStates();
                            };
                            chip.appendChild(delBtn);
                            ipBox.appendChild(chip);
                        });
                    }

                    if (dynamicMutes.nicks.length === 0) {
                        nickBox.innerHTML = '<span class="dc-mm-empty">차단된 닉네임이 없습니다.</span>';
                    } else {
                        dynamicMutes.nicks.forEach(nk => {
                            const chip = document.createElement('span');
                            chip.className = 'dc-mm-chip';
                            chip.textContent = nk;
                            const delBtn = document.createElement('button');
                            delBtn.type = 'button';
                            delBtn.textContent = '✕';
                            delBtn.onclick = () => {
                                removeMuteItem('nicks', nk);
                                renderModalLists();
                                refreshAllMuteStates();
                            };
                            chip.appendChild(delBtn);
                            nickBox.appendChild(chip);
                        });
                    }
                }

                function updateManageBar() {
                    dynamicMutes = loadSavedMutes();
                    const totalCount = dynamicMutes.ips.length + dynamicMutes.nicks.length + dynamicMutes.keywords.length;
                    let bar = document.getElementById('dc-mute-manage-bar');
                    if (!bar && document.body) {
                        bar = document.createElement('div');
                        bar.id = 'dc-mute-manage-bar';
                        const btn = document.createElement('button');
                        btn.type = 'button';
                        btn.onclick = openMuteManagerModal;
                        bar.appendChild(btn);
                        document.body.appendChild(bar);
                    }
                    if (bar) {
                        bar.querySelector('button').textContent = `🚫 차단 관리 / 키워드 추가 (${totalCount}건 적용 중)`;
                    }
                }

                // 게시글 본문 상단(작성자 이름/IP 옆) 원터치 차단 버튼 장착
                function processPostViewHeader() {
                    const allMutedIps = [...DC_MUTE_CONFIG.ips, ...dynamicMutes.ips];
                    const allMutedNicks = [...DC_MUTE_CONFIG.nicks, ...dynamicMutes.nicks];

                    const headerTargets = document.querySelectorAll('.gallview-tit-box ul.ginfo2 > li:first-child, .gallview_head .gall_writer');

                    headerTargets.forEach(headerEl => {
                        let ip = headerEl.getAttribute('data-ip') || headerEl.dataset.rawIp || '';
                        let nick = headerEl.getAttribute('data-nick') || '';

                        const cleanText = getCleanText(headerEl);
                        if (!ip) {
                            const ipMatch = cleanText.match(/\((\d{1,3}\.\d{1,3})\)/);
                            if (ipMatch) ip = ipMatch[1];
                        }
                        if (!nick) {
                            const nickEl = headerEl.querySelector('.nickname');
                            if (nickEl) {
                                nick = nickEl.textContent.trim();
                            } else {
                                nick = cleanText.replace(/\(\d{1,3}\.\d{1,3}\).*$/, '').trim();
                            }
                        }

                        if (!ip && !nick) return;

                        const isAlreadyMuted =
                            (ip && allMutedIps.some(t => ip.startsWith(t))) ||
                            (!ip && nick && allMutedNicks.includes(nick));

                        let muteBtn = headerEl.querySelector('.dc-one-touch-mute-btn');
                        if (!muteBtn) {
                            muteBtn = document.createElement('span');
                            muteBtn.className = 'dc-one-touch-mute-btn';
                            muteBtn.addEventListener('click', (e) => {
                                e.preventDefault();
                                e.stopPropagation();

                                const currentlyMuted = muteBtn.classList.contains('is-muted');
                                if (currentlyMuted) {
                                    if (ip) removeMuteItem('ips', ip);
                                    else if (nick) removeMuteItem('nicks', nick);
                                    refreshAllMuteStates();
                                    return;
                                }

                                if (ip) {
                                    if (!DC_MUTE_CONFIG.confirmBeforeMute || confirm(`본문 작성자 유동 IP [${ip}] 유저를 차단하시겠습니까?`)) {
                                        addMuteItem('ips', ip);
                                        runDcTasks();
                                        if (DC_MUTE_CONFIG.autoBackOnPostMute) window.history.back();
                                    }
                                } else if (nick) {
                                    if (!DC_MUTE_CONFIG.confirmBeforeMute || confirm(`본문 작성자 닉네임 [${nick}] 유저를 차단하시겠습니까?`)) {
                                        addMuteItem('nicks', nick);
                                        runDcTasks();
                                        if (DC_MUTE_CONFIG.autoBackOnPostMute) window.history.back();
                                    }
                                }
                            }, false);
                            headerEl.appendChild(muteBtn);
                        }

                        if (isAlreadyMuted) {
                            muteBtn.textContent = '차단됨(해제)';
                            muteBtn.classList.add('is-muted');
                        } else {
                            muteBtn.textContent = '차단';
                            muteBtn.classList.remove('is-muted');
                        }
                    });
                }

                // 게시글 목록 및 댓글에서 정확한 작성자 추출 + 원터치 [차단] 버튼 장착 + 뮤트 실행
                function processItemsAndMute() {
                    const allMutedIps = [...DC_MUTE_CONFIG.ips, ...dynamicMutes.ips];
                    const allMutedNicks = [...DC_MUTE_CONFIG.nicks, ...dynamicMutes.nicks];
                    const allMutedKeywords = [...DC_MUTE_CONFIG.keywords, ...dynamicMutes.keywords];

                    const itemSelectors = 'ul.gall-detail-lst > li, tr.ub-content, ul.all-comment-lst > li, .cmt_list > li.ub-content, .reply_list > li.ub-content';
                    document.querySelectorAll(itemSelectors).forEach(item => {
                        const writerEl = item.querySelector('.gall_writer');
                        const ginfoUl = item.querySelector('ul.ginfo');
                        const mobileWriterLi = findMobileWriterLi(ginfoUl);

                        let ipEl = item.querySelector('.ip, .block-ip, [data-raw-ip]');
                        if (!ipEl && mobileWriterLi && /\(\d{1,3}\.\d{1,3}\)/.test(mobileWriterLi.textContent)) {
                            ipEl = mobileWriterLi;
                        }

                        // 1. IP 추출
                        let ip = (writerEl && writerEl.getAttribute('data-ip')) || (ipEl && ipEl.dataset.rawIp) || '';
                        if (!ip && ipEl) {
                            const m = getCleanText(ipEl).match(/\(?(\d{1,3}\.\d{1,3})\)?/);
                            if (m) ip = m[1];
                        }

                        // 2. 닉네임 추출 (마이너갤 말머리 완벽 제외, 실제 작성자 칸에서만 추출)
                        let nickTargetEl = item.querySelector('a.nick, .nick, .gall_writer') || mobileWriterLi;
                        let nick = (writerEl && writerEl.getAttribute('data-nick')) || '';
                        if (!nick && nickTargetEl) {
                            nick = getCleanText(nickTargetEl).replace(/\(\d{1,3}\.\d{1,3}\).*$/, '').trim();
                        }

                        // 3. 원터치 [차단] 버튼 주입
                        const btnAnchor = ipEl || nickTargetEl;
                        if (btnAnchor && !item.querySelector('.dc-one-touch-mute-btn') && (ip || nick)) {
                            const muteBtn = document.createElement('span');
                            muteBtn.className = 'dc-one-touch-mute-btn';
                            muteBtn.textContent = '차단';
                            muteBtn.addEventListener('click', (e) => {
                                e.preventDefault();
                                e.stopPropagation();

                                if (ip) {
                                    if (!DC_MUTE_CONFIG.confirmBeforeMute || confirm(`유동 IP [${ip}] 유저를 차단하시겠습니까?`)) {
                                        addMuteItem('ips', ip);
                                        runDcTasks();
                                    }
                                } else if (nick) {
                                    if (!DC_MUTE_CONFIG.confirmBeforeMute || confirm(`닉네임 [${nick}] (고닉/반고닉) 유저를 차단하시겠습니까?`)) {
                                        addMuteItem('nicks', nick);
                                        runDcTasks();
                                    }
                                }
                            }, false);
                            btnAnchor.appendChild(muteBtn);
                        }

                        // 4. 본문/제목 텍스트 추출 (말머리는 빼고 순수 글 제목·댓글 내용만 추출)
                        const textEl = item.querySelector('.subjectin, .gall_tit, .txt, .usertxt');
                        const contentText = textEl ? textEl.textContent : '';

                        // 5. 뮤트 조건 검사 (유동닉은 IP로만 판별, 고닉/반고닉은 닉네임으로 판별)
                        let shouldMute = false;
                        if (ip && allMutedIps.some(targetIp => ip.startsWith(targetIp))) {
                            shouldMute = true;
                        } else if (ip && DC_MUTE_CONFIG.categories.length > 0 && DC_MUTE_CONFIG.categories.includes(getIpLabel(ip))) {
                            shouldMute = true;
                        } else if (!ip && nick && allMutedNicks.some(targetNick => nick === targetNick)) {
                            shouldMute = true;
                        } else if (contentText && allMutedKeywords.some(kw => contentText.includes(kw))) {
                            shouldMute = true;
                        }

                        if (shouldMute) {
                            item.style.setProperty('display', 'none', 'important');
                            item.setAttribute('data-muted-hidden', 'true');
                        }
                    });
                }

                function runDcTasks() {
                    dynamicMutes = loadSavedMutes();
                    tagIPs();
                    loadOriginalImages();
                    processPostViewHeader();
                    processItemsAndMute();
                    updateManageBar();
                }

                runDcTasks();

                let dcScheduled = false;
                const dcObserver = new MutationObserver((mutations) => {
                    if (!dcScheduled && mutations.some(m => m.addedNodes.length > 0)) {
                        dcScheduled = true;
                        window.requestAnimationFrame(() => {
                            dcScheduled = false;
                            runDcTasks();
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