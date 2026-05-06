// ==UserScript==
// @name         Safari Universal Video Optimizer (Zombie PiP)
// @version      7.0
// @description  Video.js 등 이벤트 차단 플레이어 완벽 우회, 무조건 PiP 버튼 생성
// @author       You
// @match        *://*/*
// @all_frames   true
// @run-at       document-end
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const host = window.location.hostname;
    const ref = document.referrer;

    // ==========================================
    // 1. 도메인 타겟팅 (바뀌는 도메인, 외부 CDN 모두 포함)
    // ==========================================
    const isTarget = host.includes('tvwiki') || 
                     host.includes('bunny') || 
                     host.includes('poorcdn') || 
                     host.includes('digitalorio') ||
                     host.includes('youtube.com') ||
                     ref.includes('tvwiki');

    const drmDomains = ['netflix.com', 'tving.com', 'wavve.com', 'watcha.com', 'disneyplus.com', 'coupangplay.com', 'primevideo.com'];
    if (drmDomains.some(domain => host.includes(domain))) return;

    // ==========================================
    // 2. PiP 토글 함수 (iOS Safari 완벽 대응)
    // ==========================================
    const togglePiP = (v) => {
        if (!v) return;
        try {
            if (typeof v.webkitSetPresentationMode === 'function') {
                v.webkitSetPresentationMode(v.webkitPresentationMode === 'picture-in-picture' ? 'inline' : 'picture-in-picture');
            } else if (document.pictureInPictureElement) {
                document.exitPictureInPicture();
            } else if (v.requestPictureInPicture) {
                v.requestPictureInPicture();
            }
        } catch(e) {
            console.error("PiP Error: ", e);
        }
    };

    // ==========================================
    // 3. 무조건 나타나는 좀비 버튼 생성기
    // ==========================================
    const injectButton = () => {
        if (!isTarget) return;

        const video = document.querySelector('video');
        if (!video) return; // 비디오가 없으면 패스

        let btn = document.getElementById('tvw-pip-btn-v7');
        
        // 버튼이 없으면 무조건 강제 생성
        if (!btn) {
            btn = document.createElement('button');
            btn.id = 'tvw-pip-btn-v7';
            btn.innerText = '📺 PiP 모드';
            
            // 다른 UI에 절대 가려지지 않게 최상단 고정 (!important)
            btn.style.cssText = `
                position: fixed !important; 
                bottom: 100px !important; 
                right: 15px !important; 
                z-index: 2147483647 !important; 
                padding: 12px 18px !important; 
                background: #e50914 !important; 
                color: white !important; 
                border: 2px solid rgba(255,255,255,0.8) !important; 
                border-radius: 12px !important; 
                cursor: pointer !important; 
                font-size: 15px !important; 
                font-weight: 900 !important; 
                box-shadow: 0 5px 15px rgba(0,0,0,0.6) !important; 
                pointer-events: auto !important;
                display: block !important;
            `;
            
            // 플레이어가 클릭을 가로채는 것을 막기 위한 강제 실행
            const action = (e) => {
                e.preventDefault();
                e.stopPropagation();
                const currentVideo = document.querySelector('video');
                togglePiP(currentVideo);
            };
            
            // iOS 터치 이슈 해결을 위해 touchstart와 click 둘 다 바인딩
            btn.addEventListener('click', action, true);
            btn.addEventListener('touchstart', action, { passive: false, capture: true });

            // body가 아닌 최상위 html 태그에 부착 (화면 짤림 완벽 방지)
            document.documentElement.appendChild(btn);
        }
    };

    // 4. 이벤트 무시하고 1.5초마다 계속 확인 (가장 확실한 방법)
    if (isTarget) {
        setInterval(injectButton, 1500);
    }

    // ==========================================
    // 5. 통합 키보드 단축키
    // ==========================================
    window.addEventListener('keydown', (e) => {
        const activeEl = document.activeElement;
        if (activeEl && (['INPUT', 'TEXTAREA', 'SELECT'].includes(activeEl.tagName) || activeEl.isContentEditable)) return;

        const v = document.querySelector('video');
        if (!v) return;

        if (e.ctrlKey && e.key.toLowerCase() === 'p') {
            e.preventDefault();
            togglePiP(v);
        } else if (e.key === 'ArrowRight') {
            e.preventDefault();
            e.stopImmediatePropagation();
            v.currentTime += 10;
        } else if (e.key === 'ArrowLeft') {
            e.preventDefault();
            e.stopImmediatePropagation();
            v.currentTime -= 10;
        } else if (e.key === ' ' || e.code === 'Space') {
            e.preventDefault();
            e.stopImmediatePropagation();
            if (v.paused) v.play(); else v.pause();
        }
    }, true);
})();
