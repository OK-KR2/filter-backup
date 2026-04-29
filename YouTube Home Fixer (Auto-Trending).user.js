// ==UserScript==
// @name         YouTube Home Fixer (Auto-Trending)
// @version      1.0
// @match        *://m.youtube.com/*
// @match        *://www.youtube.com/*
// @run-at       document-start
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // 메인 피드인지 확인하는 함수
    function checkAndRedirect() {
        const path = window.location.pathname;
        
        // 경로가 딱 '/' 이거나 '/index.html'인 경우 (즉, 메인 페이지)
        if (path === '/' || path === '/index.html') {
            console.log('빈 메인 대신 인기 급상승으로 이동함!');
            
            // 뒤로가기 꼬이지 않게 replace로 이동
            // '/feed/trending'이 가장 볼거리가 많음
            window.location.replace('/feed/trending');
        }
    }

    // 1. 처음 진입할 때 체크
    checkAndRedirect();

    // 2. 유튜브는 SPA(앱처럼 작동)라서 페이지 이동을 감시해야 함
    window.addEventListener('yt-navigate-start', checkAndRedirect);
    window.addEventListener('popstate', checkAndRedirect);

})();
