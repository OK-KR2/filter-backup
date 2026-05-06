// ==UserScript==
// @name         Safari Universal Video Optimizer (Final Lock)
// @version      4.7
// @description  모든 영상 내장 플레이어 적용, YouTube PiP & 10초 건너뛰기 완벽 지원 (SPA 대응)
// @author       You
// @match        *://*/*
// @run-at       document-start
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const host = window.location.hostname;
    const isYoutube = host.includes('youtube.com');

    // ==========================================
    // 1. DRM 사이트 예외 처리
    // ==========================================
    const drmDomains = ['netflix.com', 'tving.com', 'wavve.com', 'watcha.com', 'disneyplus.com', 'coupangplay.com', 'primevideo.com'];
    if (drmDomains.some(domain => host.includes(domain))) return;

    // ==========================================
    // 2. PiP 실행 함수 (공통)
    // ==========================================
    const togglePiP = (v) => {
        if (!v) return;
        if (v.webkitSetPresentationMode) {
            // iOS Safari 전용
            v.webkitSetPresentationMode(v.webkitPresentationMode === 'picture-in-picture' ? 'inline' : 'picture-in-picture');
        } else if (document.pictureInPictureElement) {
            document.exitPictureInPicture();
        } else if (v.requestPictureInPicture) {
            v.requestPictureInPicture().catch(console.error);
        }
    };

    // ==========================================
    // 3. YouTube 전용: PiP 버튼 추가 (SPA 완벽 대응)
    // ==========================================
    if (isYoutube) {
        const managePipButton = () => {
            const isWatching = window.location.pathname === '/watch'; // 현재 영상 재생 페이지인지 확인
            let btn = document.getElementById('force-pip-btn');

            // 영상 페이지가 아니면 버튼 숨기기
            if (!isWatching) {
                if (btn) btn.style.display = 'none';
                return;
            }

            const video = document.querySelector('video');
            if (!video) return;

            // 버튼이 없으면 생성
            if (!btn) {
                btn = document.createElement('button');
                btn.id = 'force-pip-btn';
                btn.innerText = 'PiP 모드';
                btn.style.cssText = `
                    position: fixed; bottom: 20px; right: 20px; z-index: 99999; 
                    padding: 10px 15px; background: rgba(255, 0, 0, 0.8); color: white; 
                    border: none; border-radius: 8px; cursor: pointer; font-weight: bold; 
                    backdrop-filter: blur(5px); transition: 0.2s; box-shadow: 0 4px 6px rgba(0,0,0,0.3);
                `;
                document.body.appendChild(btn);
            }
            
            // 영상 페이지면 다시 보이기 및 이벤트 갱신
            btn.style.display = 'block';
            btn.onclick = () => togglePiP(document.querySelector('video'));
        };
        setInterval(managePipButton, 2000);
    }

    // ==========================================
    // 4. 범용 영상 처리 (유튜브 제외 일반 사이트용)
    // ==========================================
    const processVideo = (v) => {
        if (isYoutube || v.dataset.optmStatus) return; // 유튜브는 자체 플레이어 유지
        if (v.mediaKeys) return;

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
    // 5. 통합 키보드 단축키 (유튜브 포함 모든 사이트)
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
