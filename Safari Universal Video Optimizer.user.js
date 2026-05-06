// ==UserScript==
// @name         Safari Universal Video Optimizer (Final Restored)
// @version      10.0
// @description  기존 기능(단축키, 기본 플레이어) 완벽 복구 + TVWIKI PiP 강제 적용
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

    // 타겟 사이트 (유튜브 + 티비위키 및 관련 CDN 모두 포함)
    const isYoutube = host.includes('youtube.com');
    const isTvWiki = host.includes('tvwiki') || host.includes('bunny') || host.includes('poorcdn') || host.includes('digitalorio') || ref.includes('tvwiki');

    // ==========================================
    // 1. DRM 사이트 예외 처리
    // ==========================================
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
        } catch(e) { console.error("PiP Error: ", e); }
    };

    // ==========================================
    // 3. PiP 버튼 강제 생성 (TVWIKI & Youtube 전용)
    // ==========================================
    const injectPipButton = () => {
        if (!isTvWiki && !isYoutube) return;
        if (isYoutube && window.location.pathname !== '/watch') return;

        const video = document.querySelector('video');
        if (!video) return;

        let btn = document.getElementById('tvw-pip-btn-restored');
        if (!btn) {
            btn = document.createElement('button');
            btn.id = 'tvw-pip-btn-restored';
            btn.innerText = 'PiP 모드';
            btn.style.cssText = `
                position: fixed !important; 
                bottom: 70px !important; 
                right: 20px !important; 
                z-index: 2147483647 !important; 
                padding: 10px 15px !important; 
                background: rgba(240, 0, 1, 0.85) !important; 
                color: white !important; 
                border: 2px solid rgba(255,255,255,0.3) !important; 
                border-radius: 8px !important; 
                cursor: pointer !important; 
                font-weight: bold !important; 
                backdrop-filter: blur(5px) !important; 
                box-shadow: 0 4px 6px rgba(0,0,0,0.3) !important; 
                pointer-events: auto !important;
                display: block !important;
            `;
            
            const action = (e) => {
                e.preventDefault();
                e.stopPropagation();
                togglePiP(document.querySelector('video'));
            };
            
            // 모바일 터치 씹힘 방지
            btn.addEventListener('click', action, true);
            btn.addEventListener('touchstart', action, { passive: false, capture: true });
            
            // 화면 최상단에 꽂아버림
            (document.body || document.documentElement).appendChild(btn);
        }
    };

    if (isTvWiki || isYoutube) {
        // 1.5초마다 버튼 상태 확인
        setInterval(injectPipButton, 1500);
        
        // [꿀기능 유지] 화면 더블탭 PiP 기능 (버튼 누르기 귀찮을 때 화면 두번 터치!)
        let lastTap = 0;
        document.addEventListener('touchstart', (e) => {
            const video = document.querySelector('video');
            // 버튼을 직접 누른 경우는 제외
            if (!video || e.target.tagName === 'BUTTON' || e.target.id === 'tvw-pip-btn-restored') return;
            
            const currentTime = new Date().getTime();
            const tapLength = currentTime - lastTap;
            if (tapLength < 300 && tapLength > 0) {
                togglePiP(video);
            }
            lastTap = currentTime;
        }, { passive: false });
    }

    // ==========================================
    // 4. 범용 영상 처리 (일반 사이트 컨트롤러 살려냄!!!)
    // ==========================================
    const processVideo = (v) => {
        // 유튜브나 티비위키 계열은 자체 플레이어가 있으므로 건드리지 않음
        if (isYoutube || isTvWiki || v.dataset.optmStatus || v.mediaKeys) return;

        const enforce = () => {
            v.controls = true;
            v.setAttribute('controls', 'controls');
            v.style.setProperty('z-index', '2147483647', 'important');
            v.style.setProperty('pointer-events', 'auto', 'important');
        };
        enforce();

        const lock = new MutationObserver(() => { if (!v.controls) enforce(); });
        lock.observe(v, { attributes: true, attributeFilter: ['controls'] });
        v.addEventListener('contextmenu', e => e.stopPropagation(), true);
        v.dataset.optmStatus = "success";
    };

    const observer = new MutationObserver(mutations => {
        for (let m of mutations) {
            for (let n of m.addedNodes) {
                if (n.tagName === 'VIDEO') processVideo(n);
                else if (n.querySelectorAll) n.querySelectorAll('video').forEach(processVideo);
            }
        }
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });

    // ==========================================
    // 5. 통합 키보드 단축키 (스페이스바, 방향키 살려냄!!!)
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
