// ==UserScript==
// @name         YouTube Home Fixer (무한깜빡임 완벽해결)
// @version      9.0
// @match        *://m.youtube.com/*
// @match        *://www.youtube.com/*
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';

    const TARGET_URL = '/feed/trending';

    // 세션 스토리지를 이용한 무한루프(깜빡임) 방지 로직
    const checkAndRedirect = () => {
        if (location.pathname === '/' || location.pathname === '/index') {
            // 이미 납치 시도를 한 탭인지 확인 (무한 깜빡임 원천 차단)
            if (!sessionStorage.getItem('yt_home_hijacked')) {
                sessionStorage.setItem('yt_home_hijacked', 'true');
                location.replace(TARGET_URL);
            }
        } else {
            // 인기 탭 등 다른 곳에 정상 도착했으면 락(Lock) 해제
            sessionStorage.removeItem('yt_home_hijacked');
        }
    };

    // 1. 첫 접속 시 1회 한정 감지
    checkAndRedirect();

    // 2. 뒤로가기 등 유튜브 내부 SPA 화면 전환 시 감지
    window.addEventListener('yt-navigate-finish', checkAndRedirect);

    // 3. 홈 버튼 물리적 클릭 낚아채기 (분석해주신 소스코드 기반)
    document.addEventListener('click', function(e) {
        // 상단 로고(.mobile-topbar-header-endpoint) 및 하단 홈 탭(.pivot-w2w) 타겟팅
        const homeBtn = e.target.closest('.mobile-topbar-header-endpoint, .pivot-w2w, #logo, a[href="/"]');
        if (homeBtn) {
            e.preventDefault();  // 원래 동작 컷
            e.stopPropagation(); // 유튜브 내부 이벤트 정지
            
            if (location.pathname !== TARGET_URL) {
                sessionStorage.setItem('yt_home_hijacked', 'true');
                location.href = TARGET_URL; // 인기 급상승으로 수동 이동
            } else {
                location.reload(); // 이미 인기 탭인데 홈 버튼 누르면 새로고침
            }
        }
    }, true); // 캡처링으로 유튜브보다 먼저 낚아챔
})();

