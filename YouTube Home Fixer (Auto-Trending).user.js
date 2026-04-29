// ==UserScript==
// @name         YouTube Home Fixer Mobile
// @version      1.2
// @description  Force redirect empty home to trending on mobile
// @author       Gemini
// @match        *://m.youtube.com/*
// @match        *://www.youtube.com/*
// @run-at       document-start
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    function bulldozerRedirect() {
        const url = window.location.href;
        const path = window.location.pathname;

        // 1. 경로가 '/' 이거나 메인 관련 주소일 때
        if (path === '/' || path === '/index.html' || path.startsWith('/?')) {
            
            // 2. 무한 루프 방지 (이미 이동했으면 중단)
            if (url.includes('redirected=true')) return;

            // 3. 특히 '검색하여 시작하기' 화면이 뜨는 메인인지 확인
            // 모바일 유튜브는 주소 뒤에 파라미터가 지저분하게 붙는 경우가 많아서 처리
            console.log('🚀 [Fixer] 빈 메인 감지! 인기 탭으로 강제 이동');
            window.location.replace('/feed/trending?redirected=true');
        }
    }

    // ★ 핵심: 모바일은 이벤트가 잘 안 먹히니 0.5초마다 주소창을 감시함 (불도저)
    setInterval(bulldozerRedirect, 500);

    // 초기 실행
    bulldozerRedirect();

})();
