// ==UserScript==
// @name         Safari Universal Video Optimizer (TVWIKI & YouTube PiP)
// @version      5.2
// @description  모든 영상 내장 플레이어 적용, YouTube & TVWIKI 전용 PiP 버튼 (iOS iframe 완벽 대응)
// @author       You
// @match        *://*/*
// @all_frames   true
// @run-at       document-end
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const host = window.location.hostname;
    
    // 1. 타겟 사이트 확인 (유튜브 및 티비위키 계열)
    const isYoutube = host.includes('youtube.com');
    // tvwiki(숫자 변동 대응) 및 실제 영상이 호스팅되는 외부 CDN 도메인 모두 포함
    const isTvWiki = host.includes('tvwiki') || host.includes('bunny') || host.includes('poorcdn') || host.includes('digitalorio');

    // 2. DRM 사이트 예외 처리
    const drmDomains = ['netflix.com', 'tving.com', 'wavve.com', 'watcha.com', 'disneyplus.com', 'coupangplay.com', 'primevideo.com'];
    if (drmDomains.some(domain => host.includes(domain))) return;

    // 3. PiP 실행 함수 (iOS Safari 전용 API 완벽 지원)
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

    // 4. PiP 버튼 강제 생성 (유튜브 & 티비위키 관련 도메인에서만 실행하여 부하 최소화)
    if (isYoutube || isTvWiki) {
        const managePipButton = () => {
            if (isYoutube && window.location.pathname !== '/watch') {
                let btn = document.getElementById('force-pip-btn');
                if (btn) btn.style.display = 'none';
                return;
            }

            const video = document.querySelector('video');
            let btn = document.getElementById('force-pip-btn');

            if (!video) {
                if (btn) btn.style.display = 'none';
                return;
            }

            if (!btn) {
                btn = document.createElement('button');
                btn.id = 'force-pip-btn';
                btn.innerText = 'PiP 모드';
                // iOS 환경을 고려하여 position: fixed 및 !important 남발로 플레이어 UI 위로 강제 노출
                btn.style.cssText = `
                    position: fixed !important; bottom: 70px !important; right: 20px !important; 
                    z-index: 2147483647 !important; padding: 10px 15px !important; 
                    background: rgba(240, 0, 1, 0.85) !important; color: white !important; 
                    border: none !important; border-radius: 8px !important; cursor: pointer !important; 
                    font-weight: bold !important; backdrop-filter: blur(5px) !important; 
                    box-shadow: 0 4px 6px rgba(0,0,0,0.3) !important; pointer-events: auto !important;
                `;
                // 문서의 최상위 요소에 붙여서 body overflow:hidden 등에 짤리지 않게 방지
                (document.body || document.documentElement).appendChild(btn);
            }
            
            btn.style.display = 'block';
            btn.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                togglePiP(video);
            };
        };
        
        setInterval(managePipButton, 2000);
    }

    // 5. 범용 영상 처리 (순정 컨트롤러 표시 및 우클릭 방지 해제)
    const processVideo = (v) => {
        if (isYoutube || v.dataset.optmStatus || v.mediaKeys) return;

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

    // 6. 단축키 공통 지원
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
