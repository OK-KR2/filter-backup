// ==UserScript==
// @name         YouTube Home Fixer (로고 물리적 개조 버전)
// @version      7.0
// @match        *://*.youtube.com/*
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';

    const target = '/feed/trending';

    // 1. 처음 주소창에 youtube.com 치고 들어왔을 때 딱 한 번 이동
    if (location.pathname === '/') {
        location.replace(target);
    }

    // 2. 무식하지만 가장 확실한 방법: 로고 도착지 자체를 조작
    setInterval(() => {
        // 화면에 있는 모든 링크(a 태그)를 뒤짐
        document.querySelectorAll('a').forEach(link => {
            try {
                // 링크 목적지가 홈('/')인지 팩트체크 (m.youtube.com 도 잡아냄)
                const url = new URL(link.href, location.origin);
                if (url.pathname === '/') {
                    // 목적지를 인기 급상승으로 강제 변경
                    link.href = target; 
                }
            } catch(e) {}
        });
    }, 500);

    // 3. 보험용: 혹시 조작되기 0.5초 틈에 로고를 눌렀을 경우를 대비한 최우선 차단
    document.addEventListener('click', function(e) {
        const link = e.target.closest('a');
        if (link) {
            try {
                const url = new URL(link.href, location.origin);
                if (url.pathname === '/') {
                    e.preventDefault();
                    e.stopPropagation();
                    location.href = target;
                }
            } catch(e) {}
        }
    }, true);
})();

