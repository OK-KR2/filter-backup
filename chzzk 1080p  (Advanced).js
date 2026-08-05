// ==UserScript==
// @name         chzzk 1080p  (Advanced)
// @version      2.1
// @description  User-Agent 및 최신 Client-Hints(UA-CH)까지 Mac 환경으로 완벽히 위장합니다.
// @match        https://chzzk.naver.com/*
// @match        https://*.naver.com/*
// @run-at       document-start
// @grant        none
// ==UserScript==

(function () {
    'use strict';

    const macUserAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15';
    const macPlatform = 'MacIntel';

    try {
        // 1. 구형 User-Agent 및 Platform 위장
        Object.defineProperty(navigator, 'userAgent', { get: () => macUserAgent, configurable: true });
        Object.defineProperty(navigator, 'platform', { get: () => macPlatform, configurable: true });

        // 2. 최신 브라우저의 Client-Hints(userAgentData) 완벽 위장 (치지직 패치 방어용)
        if (navigator.userAgentData) {
            Object.defineProperty(navigator, 'userAgentData', {
                get: () => ({
                    brands: [
                        { brand: "Not A(Brand", version: "99" },
                        { brand: "Safari", version: "17" },
                        { brand: "Apple", version: "17" }
                    ],
                    mobile: false,
                    platform: "macOS"
                }),
                configurable: true
            });
        }

        console.log('[Chzzk Grid Bypass] macOS 환경(Client-Hints 포함)으로 완벽히 위장되었습니다.');
    } catch (e) {
        console.error('[Chzzk Grid Bypass] 스크립트 적용 중 오류 발생:', e);
    }
})();
