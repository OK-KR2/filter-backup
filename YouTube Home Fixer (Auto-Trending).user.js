// ==UserScript==
// @name         YouTube Home Fixer (개빡센 버전)
// @version      3.0
// @match        *://*.youtube.com/*
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';

    const target = '/feed/trending';

    // 1. 처음 접속했을 때 홈이면 묻지도 따지지도 않고 바로 납치
    if (location.pathname === '/' || location.pathname === '/index') {
        location.replace(target);
    }

    // 2. 유튜브가 주소창 몰래 바꾸는 기술(History API) 하이재킹
    const push = history.pushState;
    history.pushState = function() {
        if (arguments[2] === '/' || (typeof arguments[2] === 'string' && arguments[2].startsWith('/?'))) {
            arguments[2] = target;
        }
        return push.apply(this, arguments);
    };

    const replace = history.replaceState;
    history.replaceState = function() {
        if (arguments[2] === '/' || (typeof arguments[2] === 'string' && arguments[2].startsWith('/?'))) {
            arguments[2] = target;
        }
        return replace.apply(this, arguments);
    };

    // 3. 로고 누르거나 뒤로가기 할 때 (finish 말고 start에서 입구컷)
    window.addEventListener('yt-navigate-start', function(e) {
        if (e.detail && (e.detail.url === '/' || e.detail.url.startsWith('/?'))) {
            location.replace(target);
        }
    });
})();

