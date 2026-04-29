// ==UserScript==
// @name         YouTube Home Fixer (모바일 찐해결 버전)
// @version      8.0
// @match        *://m.youtube.com/*
// @match        *://www.youtube.com/*
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';

    const targetUrl = '/feed/trending';
    let isRedirecting = false;

    // 1. URL 실시간 감시: 홈('/') 접속 시 묻지도 따지지도 않고 납치
    setInterval(() => {
        // 주소창이 '/' 이면서, 현재 납치 중이 아닐 때만 실행 (무한루프 방지)
        if (!isRedirecting && (location.pathname === '/' || location.pathname === '/index')) {
            isRedirecting = true;
            location.replace(targetUrl);
            
            // 2초 쿨타임 (유튜브 시스템과 싸움 방지)
            setTimeout(() => { isRedirecting = false; }, 2000);
        }
    }, 100);

    // 2. 모바일 UI 버튼 물리적 낚아채기 (a 태그 버림)
    document.addEventListener('click', function(e) {
        // 뽑아주신 소스코드 기반: 상단 로고(ytm-home-logo) & 하단 홈 탭(.pivot-w2w)
        const homeBtn = e.target.closest('ytm-home-logo, .pivot-w2w');
        
        if (homeBtn) {
            e.preventDefault();      // 유튜브 자체 동작 취소
            e.stopPropagation();     // 클릭 이벤트 전파 차단
            
            // 이미 인기 급상승이 아니면 이동
            if (location.pathname !== targetUrl) {
                isRedirecting = true;
                location.href = targetUrl;
                setTimeout(() => { isRedirecting = false; }, 2000);
            }
        }
    }, true); // 캡처링으로 유튜브가 클릭 감지하기 전에 제일 먼저 뺏어옴
})();

