// ==UserScript==
// @name         Safari Universal Video Optimizer (Nuclear PiP)
// @version      8.0
// @description  도메인 검사 완전 폐지! 영상이 감지되면 무조건 PiP 버튼을 강제 주입합니다 (iOS 최적화)
// @author       You
// @match        *://*/*
// @all_frames   true
// @run-at       document-idle
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // 1. DRM 사이트 예외 처리 (넷플릭스 등 보안 플레이어 제외)
    const host = window.location.hostname;
    const drmDomains = ['netflix.com', 'tving.com', 'wavve.com', 'watcha.com', 'disneyplus.com', 'coupangplay.com', 'primevideo.com'];
    if (drmDomains.some(domain => host.includes(domain))) return;

    // 2. PiP 토글 함수 (iOS Safari 완벽 대응)
    const togglePiP = (v) => {
        try {
            if (v.webkitSetPresentationMode) {
                v.webkitSetPresentationMode(v.webkitPresentationMode === 'picture-in-picture' ? 'inline' : 'picture-in-picture');
            } else if (document.pictureInPictureElement) {
                document.exitPictureInPicture();
            } else if (v.requestPictureInPicture) {
                v.requestPictureInPicture();
            }
        } catch (e) {
            console.error("PiP Error:", e);
        }
    };

    // 3. 무조건 나타나는 좀비 버튼 생성기
    const injectButton = () => {
        const video = document.querySelector('video');
        if (!video) return; // 비디오가 없으면 패스

        // 유튜브 메인화면 등 영상이 없는 곳 처리
        if (host.includes('youtube.com') && window.location.pathname !== '/watch') return;

        // 이미 버튼이 꽂혀있으면 중복 생성 방지
        if (document.getElementById('tvw-nuclear-pip-btn')) return;

        const btn = document.createElement('div');
        btn.id = 'tvw-nuclear-pip-btn';
        btn.innerHTML = '📺 PiP 모드';
        
        // 티비위키 자체 버튼(건너뛰기)과 동일한 absolute 속성을 써서, 플레이어 우측 하단에 딱 맞게 고정
        btn.style.cssText = `
            position: absolute !important; 
            bottom: 60px !important; 
            right: 15px !important; 
            padding: 8px 12px !important; 
            background: rgba(220, 0, 0, 0.85) !important; 
            color: #ffffff !important; 
            border: 1px solid rgba(255, 255, 255, 0.4) !important; 
            border-radius: 6px !important; 
            font-family: sans-serif !important;
            font-size: 13px !important; 
            font-weight: bold !important; 
            cursor: pointer !important; 
            z-index: 2147483647 !important; 
            pointer-events: auto !important;
            box-shadow: 0 4px 8px rgba(0,0,0,0.5) !important;
            display: inline-flex !important;
            align-items: center !important;
            justify-content: center !important;
        `;

        const action = (e) => {
            e.preventDefault();
            e.stopPropagation();
            togglePiP(video);
        };

        // 모바일 iOS Safari 터치 씹힘 방지
        btn.addEventListener('click', action, true);
        btn.addEventListener('touchend', action, { passive: false, capture: true });

        // body가 아닌, 비디오 태그를 감싸고 있는 바로 위 부모(video.js 껍데기)에 찰딱 붙임
        const container = video.parentElement || document.body;
        container.appendChild(btn);
    };

    // 4. 복잡한 이벤트 감지 포기하고, 1초마다 무조건 검사해서 비디오 있으면 버튼 박아버림
    setInterval(injectButton, 1000);

    // ==========================================
    // 5. 통합 키보드 단축키 (기존 유지)
    // ==========================================
    window.addEventListener('keydown', (e) => {
        const activeEl = document.activeElement;
        if (activeEl && (['INPUT', 'TEXTAREA', 'SELECT'].includes(activeEl.tagName) || activeEl.isContentEditable)) return;

        const v = document.querySelector('video');
        if (!v) return;

        // PiP 단축키 (Ctrl + P)
        if (e.ctrlKey && e.key.toLowerCase() === 'p') {
            e.preventDefault();
            togglePiP(v);
        }
        // 화살표 오른쪽 (10초 앞)
        else if (e.key === 'ArrowRight') {
            e.preventDefault();
            e.stopImmediatePropagation();
            v.currentTime += 10;
        }
        // 화살표 왼쪽 (10초 뒤)
        else if (e.key === 'ArrowLeft') {
            e.preventDefault();
            e.stopImmediatePropagation();
            v.currentTime -= 10;
        }
        // 스페이스바 (재생/일시정지)
        else if (e.key === ' ' || e.code === 'Space') {
            e.preventDefault();
            e.stopImmediatePropagation();
            if (v.paused) v.play(); else v.pause();
        }
    }, true);
})();
