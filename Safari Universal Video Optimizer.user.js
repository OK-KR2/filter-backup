// ==UserScript==
// @name         Safari Universal Video Optimizer (Ultimate PiP)
// @version      6.0
// @description  모든 영상 내장 플레이어 적용, 계속 바뀌는 외부 플레이어 도메인 완벽 대응 (부하 제로)
// @author       You
// @match        *://*/*
// @all_frames   true
// @run-at       document-end
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const host = window.location.hostname;
    const ref = document.referrer; // 자신을 호출한 부모 창의 주소

    // ==========================================
    // 1. 타겟 감지 (도메인이 계속 바뀌는 문제 완벽 해결)
    // ==========================================
    const isYoutube = host.includes('youtube.com');
    // 현재 도메인이나 부모 창(referrer)에 'tvwiki' 문자가 포함되어 있으면 작동 (숫자 변경 대응)
    const isTvWiki = host.includes('tvwiki') || ref.includes('tvwiki');
    // 혹시 모를 이중 iframe을 대비해 플레이어 성격의 외부 프레임도 느슨하게 허용
    const isVideoFrame = window !== window.top && (host.includes('player') || host.includes('cdn') || host.includes('video'));

    const isTarget = isYoutube || isTvWiki || isVideoFrame;

    // ==========================================
    // 2. DRM 사이트 예외 처리
    // ==========================================
    const drmDomains = ['netflix.com', 'tving.com', 'wavve.com', 'watcha.com', 'disneyplus.com', 'coupangplay.com', 'primevideo.com'];
    if (drmDomains.some(domain => host.includes(domain))) return;

    // ==========================================
    // 3. PiP 토글 함수
    // ==========================================
    const togglePiP = (v) => {
        if (!v) return;
        if (v.webkitSetPresentationMode) {
            v.webkitSetPresentationMode(v.webkitPresentationMode === 'picture-in-picture' ? 'inline' : 'picture-in-picture');
        } else if (document.pictureInPictureElement) {
            document.exitPictureInPicture();
        } else if (v.requestPictureInPicture) {
            v.requestPictureInPicture().catch(console.error);
        }
    };

    // ==========================================
    // 4. PiP 버튼 생성 (이벤트 기반 - 사파리 부하 0%)
    // ==========================================
    const createPipButton = (video) => {
        if (!isTarget || document.getElementById('force-pip-btn')) return;
        if (isYoutube && window.location.pathname !== '/watch') return;

        const btn = document.createElement('button');
        btn.id = 'force-pip-btn';
        btn.innerText = 'PiP 모드';
        btn.style.cssText = `
            position: fixed !important; bottom: 80px !important; right: 20px !important; 
            z-index: 2147483647 !important; padding: 12px 18px !important; 
            background: rgba(220, 0, 0, 0.9) !important; color: white !important; 
            border: none !important; border-radius: 8px !important; cursor: pointer !important; 
            font-size: 14px !important; font-weight: bold !important; backdrop-filter: blur(5px) !important; 
            box-shadow: 0 4px 10px rgba(0,0,0,0.5) !important; pointer-events: auto !important;
            display: block !important;
        `;
        
        btn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            togglePiP(video);
        };

        // 최상단 body에 강제 부착
        (document.body || document.documentElement).appendChild(btn);
    };

    // 비디오가 로드되거나 재생될 때 '딱 한 번만' 버튼 생성 (무한 감시 안함)
    document.addEventListener('loadedmetadata', (e) => {
        if (e.target.tagName === 'VIDEO') createPipButton(e.target);
    }, true);
    
    document.addEventListener('play', (e) => {
        if (e.target.tagName === 'VIDEO') createPipButton(e.target);
    }, true);

    // ==========================================
    // 5. 범용 영상 처리 (컨트롤러 강제 활성화)
    // ==========================================
    const processVideo = (v) => {
        if (isYoutube || v.dataset.optmStatus || v.mediaKeys) return;
        
        if (isTarget) createPipButton(v); // 초기 렌더링 시 이미 있는 비디오 처리

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
    // 6. 통합 키보드 단축키
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
