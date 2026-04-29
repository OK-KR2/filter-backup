// ==UserScript==
// @name         YouTube Home Fixer (모바일 터치 찐막 + 깜빡임 방지)
// @version      10.0
// @match        *://m.youtube.com/*
// @match        *://www.youtube.com/*
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';

    const TARGET_URL = '/feed/trending';
    let isNavigating = false;

    // 무식한 새로고침 없이, 유튜브 내부 기능으로 부드럽게 화면만 넘기는 함수
    const spaNavigate = (url) => {
        if (isNavigating || location.pathname === url) return;
        isNavigating = true;
        setTimeout(() => { isNavigating = false; }, 1000); // 1초 쿨타임 (무한 핑퐁 방지)

        // 가짜 링크를 만들어서 클릭하게 함 -> 유튜브 SPA 시스템이 이걸 인식하고 부드럽게 넘겨줌
        const a = document.createElement('a');
        a.href = url;
        document.body.appendChild(a);
        a.click(); 
        a.remove();
    };

    // 1. 처음 주소창에 youtube.com 치고 들어왔을 때 딱 한 번 튕겨냄
    if (location.pathname === '/' || location.pathname === '/index') {
        location.replace(TARGET_URL);
    }

    // 2. 모바일 터치 이벤트 원천 낚아채기
    const hijackNavigation = (e) => {
        // 스크립트가 만든 가짜 링크는 무시
        if (e.target.tagName === 'A' && e.target.href.includes(TARGET_URL)) return;

        // 선생님이 주신 소스코드 기반 정확한 타겟: 상단 로고 & 하단 홈버튼
        const homeBtn = e.target.closest('.mobile-topbar-header-endpoint, .pivot-w2w, ytm-home-logo');
        if (homeBtn) {
            e.preventDefault();             // 유튜브 내부 터치 동작 취소
            e.stopPropagation();            // 이벤트 전파 싹 다 차단
            e.stopImmediatePropagation();   
            
            spaNavigate(TARGET_URL);        // 부드럽게 인기 탭으로 납치
        }
    };

    // [핵심] 모바일은 click이 아니라 touchend에서 낚아채야 유튜브한테 주도권을 안 뺏깁니다!
    document.addEventListener('touchend', hijackNavigation, true);
    document.addEventListener('click', hijackNavigation, true);

    // 3. 뒤로가기 등으로 홈('/')에 다시 들어왔을 때 깜빡임 없이 부드럽게 넘김
    window.addEventListener('yt-navigate-finish', () => {
        if (location.pathname === '/') {
            spaNavigate(TARGET_URL);
        }
    });
})();

