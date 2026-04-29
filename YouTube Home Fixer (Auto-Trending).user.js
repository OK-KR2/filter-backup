// ==UserScript==
// @name         YouTube Home to Trending Fixer (SPA 대응)
// @namespace    http://tampermonkey.net/
// @version      2.0
// @description  유튜브 홈 화면 접속 시 인기 급상승으로 즉시 납치
// @author       Gemini
// @match        *://*.youtube.com/*
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';

    // 목적지 설정 (인기 급상승 탭)
    const targetUrl = '/feed/trending';

    // 홈 화면인지 확인하고 쏴버리는 함수
    const redirectIfHome = () => {
        if (window.location.pathname === '/' || window.location.pathname === '/index') {
            window.location.replace(targetUrl);
        }
    };

    // 1. 처음 페이지가 로드될 때 낚아채기
    redirectIfHome();

    // 2. 유튜브 내부에서 클릭으로 홈버튼 눌렀을 때 (SPA 라우팅) 낚아채기
    window.addEventListener('yt-navigate-finish', redirectIfHome);
})();
