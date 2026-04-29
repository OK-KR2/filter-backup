// ==UserScript==
// @name         YouTube Home Fixer (개무식한 불도저 버전)
// @version      5.0
// @match        *://*.youtube.com/*
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';

    const target = '/feed/trending';
    let isRedirecting = false; // 중복 납치 방지용

    // 홈 화면이면 멱살 잡고 끌고 가는 함수
    const bulldozer = () => {
        if (!isRedirecting && (location.pathname === '/' || location.pathname === '/index')) {
            isRedirecting = true;
            location.replace(target);
        }
    };

    // 1. 처음 접속 시 즉시 확인
    bulldozer();

    // 2. 유튜브 SPA 이동 이벤트 (window가 아니라 document에서 잡아야 안 씹힘!)
    document.addEventListener('yt-navigate-start', function(e) {
        if (e.detail && (e.detail.url === '/' || e.detail.url.startsWith('/?'))) {
            isRedirecting = true;
            location.replace(target);
        }
    });
    
    document.addEventListener('yt-navigate-finish', bulldozer);

    // 3. 이벤트 감지고 나발이고 다 뚫렸을 때를 대비한 0.5초 단위 감시카메라
    setInterval(bulldozer, 500);
})();
