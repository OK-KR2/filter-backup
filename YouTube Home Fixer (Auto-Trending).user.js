// ==UserScript==
// @name         YouTube Home Fixer (발작 없는 찐막 클린 버전)
// @version      6.0
// @match        *://m.youtube.com/*
// @match        *://www.youtube.com/*
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';

    const goTrending = () => {
        // 현재 주소가 정확히 홈('/')일 때만 인기 탭으로 보냄
        if (window.location.pathname === '/') {
            window.location.replace('/feed/trending');
        }
    };

    // 1. 처음 주소창에 유튜브 치고 들어왔을 때 딱 한 번 실행
    goTrending();

    // 2. 유튜브 앱 내부에서 화면 전환이 '완전히 끝났을 때' 확인 (발작 방지)
    window.addEventListener('yt-navigate-finish', goTrending);

    // 3. 모바일 하단 '홈' 버튼 눌렀을 때 발작 없이 바로 인기 탭으로 쏘기
    window.addEventListener('click', function(e) {
        // 하단바 홈 버튼이나 상단 로고 클릭 감지
        const homeBtn = e.target.closest('a[href="/"], ytm-pivot-bar-item-renderer[tabindex="0"]');
        if (homeBtn && window.location.pathname !== '/feed/trending') {
            e.preventDefault();  // 홈으로 가는 원래 동작 컷
            e.stopPropagation(); // 꼬임 방지
            window.location.href = '/feed/trending'; // 깔끔하게 이동
        }
    }, true);
})();

