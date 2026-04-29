// ==UserScript==
// @name         YouTube Home Fixer (No Loop)
// @version      1.3
// @description  Stop flashing and go to trending safely
// @author       Gemini
// @match        *://m.youtube.com/*
// @match        *://www.youtube.com/*
// @run-at       document-start
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    function safeRedirect() {
        const path = window.location.pathname;

        // 정확히 홈 화면('/')일 때만 작동
        if (path === '/' || path === '/index.html') {
            
            // 브라우저 세션에서 마지막 이동 시간을 꺼냄
            const lastTime = parseInt(sessionStorage.getItem('yt_home_fix_time') || '0', 10);
            const now = Date.now();

            // ★ 핵심: 리다이렉트 한 지 5초가 안 지났다면 무조건 정지! (무한 반짝임 완벽 차단)
            if (now - lastTime < 5000) return;

            console.log('🚀 빈 화면 감지! 인기 탭으로 안전하게 이동합니다.');
            
            // 이동했다는 기록을 유튜브가 못 건드리는 sessionStorage에 쾅 박아둠
            sessionStorage.setItem('yt_home_fix_time', now.toString());
            
            // 인기 탭으로 쏴버리기
            window.location.replace('/feed/trending');
        }
    }

    // 0.5초마다 주소 감시 (하지만 쿨타임 덕분에 미쳐 날뛰지 않음)
    setInterval(safeRedirect, 500);

})();
