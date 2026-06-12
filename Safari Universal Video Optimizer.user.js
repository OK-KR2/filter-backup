// ==UserScript==
// @name         Safari Universal Video Optimizer (Pro Edition)
// @version      17.0
// @description  내장 플레이어 덮어쓰기 방지 + 스마트 메인 영상 탐지 + 볼륨/배속/전체화면 단축키 완벽 지원
// @author       You
// @match        *://*/*
// @run-at       document-idle
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const host = window.location.hostname;

    // ==========================================
    // 💡 [업그레이드] 스마트 영상 탐지 로직 (가장 큰 메인 영상 찾기 + Shadow DOM 돌파)
    // ==========================================
    const getActiveVideo = () => {
        let videos = Array.from(document.querySelectorAll('video'));
        
        // 숨겨진 Shadow DOM 내부의 비디오까지 전부 긁어오기
        document.querySelectorAll('*').forEach(el => {
            if (el.shadowRoot) {
                videos.push(...el.shadowRoot.querySelectorAll('video'));
            }
        });

        if (videos.length === 0) return null;

        // 면적(가로x세로)이 가장 큰 비디오를 진짜 '메인 영상'으로 간주하고 반환
        return videos.sort((a, b) => (b.clientWidth * b.clientHeight) - (a.clientWidth * a.clientHeight))[0];
    };

    // ==========================================
    // 1. DRM 사이트 예외 처리
    // ==========================================
    const drmDomains = [
        'netflix.com', 'tving.com', 'wavve.com', 'watcha.com', 
        'disneyplus.com', 'coupangplay.com', 'primevideo.com'
    ];
    
    if (drmDomains.some(domain => host.includes(domain))) {
        console.log("🔒 [Video Optimizer] DRM 사이트입니다. 순정 상태를 유지합니다.");
        return;
    }

    // ==========================================
    // 2. YouTube 전용: PiP 강제 활성화 (Ctrl + P)
    // ==========================================
    if (host.includes('youtube.com')) {
        window.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key.toLowerCase() === 'p') {
                const video = getActiveVideo(); // 똑똑해진 탐지 함수 사용
                if (video) {
                    if (typeof video.webkitSetPresentationMode === 'function') {
                        video.webkitSetPresentationMode(video.webkitPresentationMode === 'picture-in-picture' ? 'inline' : 'picture-in-picture');
                    } else if (document.pictureInPictureElement) {
                        document.exitPictureInPicture();
                    } else {
                        video.requestPictureInPicture().catch(console.error);
                    }
                }
            }
        });

        const addPipButton = () => {
            const video = getActiveVideo();
            if (!video || !document.body || document.getElementById('force-pip-btn')) return; 

            const btn = document.createElement('button');
            btn.id = 'force-pip-btn';
            btn.innerText = 'PiP 모드';
            btn.style.cssText = `
                position: fixed !important; bottom: 80px !important; right: 20px !important; 
                z-index: 2147483647 !important; padding: 12px 18px !important; 
                background: rgba(220, 38, 38, 0.9) !important; color: white !important; 
                border: 1px solid rgba(255, 255, 255, 0.3) !important; border-radius: 10px !important; 
                cursor: pointer !important; font-weight: bold !important; font-size: 14px !important;
                backdrop-filter: blur(8px) !important; -webkit-backdrop-filter: blur(8px) !important;
                box-shadow: 0 4px 12px rgba(0,0,0,0.5) !important; display: block !important;
            `;
            
            btn.onclick = (e) => {
                e.preventDefault(); e.stopPropagation();
                const v = getActiveVideo();
                if (!v) return;

                if (typeof v.webkitSetPresentationMode === 'function') {
                    v.webkitSetPresentationMode(v.webkitPresentationMode === 'picture-in-picture' ? 'inline' : 'picture-in-picture');
                } else if (document.pictureInPictureEnabled) {
                    document.pictureInPictureElement ? document.exitPictureInPicture() : v.requestPictureInPicture();
                }
            };
            document.body.appendChild(btn);
        };

        setInterval(addPipButton, 1500); 
        window.addEventListener('yt-navigate-finish', addPipButton);
        return; 
    }

    // ==========================================
    // 3. 범용 영상 처리 및 속성 방어 로직 (요청하신 대로 유지 및 주석 처리)
    // ==========================================
    const processVideo = (v) => {
        if (v.dataset.optmStatus) return;
        if (v.mediaKeys) { v.dataset.optmStatus = "drm_skipped"; return; }
        if (v.currentTime > 2 && !v.controls) { v.dataset.optmStatus = "too_late"; return; }

        /* ▼▼▼▼▼ 기존의 내장 플레이어 덮어씌우기 주석 처리 ▼▼▼▼▼
        const enforceControls = () => {
            if (!v.controls) { v.controls = true; v.setAttribute('controls', 'controls'); }
            v.style.setProperty('z-index', '2147483647', 'important');
            v.style.setProperty('pointer-events', 'auto', 'important');
        };
        enforceControls();
        const attributeLock = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.attributeName === 'controls' && !v.controls) {
                    v.controls = true; v.setAttribute('controls', 'controls');
                }
            });
        });
        attributeLock.observe(v, { attributes: true, attributeFilter: ['controls'] });
        */ // ▲▲▲▲▲ 여기까지 주석 처리 ▲▲▲▲▲

        v.addEventListener('contextmenu', e => e.stopPropagation(), true);
        v.dataset.optmStatus = "success_locked";
    };

    const observer = new MutationObserver((mutations) => {
        for (let mutation of mutations) {
            for (let node of mutation.addedNodes) {
                if (node.tagName === 'VIDEO') {
                    processVideo(node);
                } else if (node.querySelectorAll) {
                    const videos = node.querySelectorAll('video');
                    videos.forEach(processVideo);
                }
            }
        }
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
    window.addEventListener('DOMContentLoaded', () => { document.querySelectorAll('video').forEach(processVideo); });

    // ==========================================
    // 4. [업그레이드] 확장된 키보드 제어 (10초 이동, 볼륨, 배속, 전체화면)
    // ==========================================
    window.addEventListener('keydown', (e) => {
        const activeEl = document.activeElement;
        if (activeEl && (['INPUT', 'TEXTAREA', 'SELECT'].includes(activeEl.tagName) || activeEl.isContentEditable)) return;

        const activeVideo = getActiveVideo(); // 똑똑해진 탐지 함수 사용
        if (!activeVideo) return;

        switch(e.key) {
            // 시간 이동 (좌우 방향키)
            case 'ArrowRight':
                e.preventDefault(); e.stopImmediatePropagation();
                activeVideo.currentTime += 10;
                break;
            case 'ArrowLeft':
                e.preventDefault(); e.stopImmediatePropagation();
                activeVideo.currentTime -= 10;
                break;
            
            // 볼륨 조절 (상하 방향키)
            case 'ArrowUp':
                e.preventDefault(); e.stopImmediatePropagation();
                activeVideo.volume = Math.min(1, activeVideo.volume + 0.1);
                break;
            case 'ArrowDown':
                e.preventDefault(); e.stopImmediatePropagation();
                activeVideo.volume = Math.max(0, activeVideo.volume - 0.1);
                break;

            // 재생/일시정지 (스페이스바)
            case ' ':
            case 'Space':
                e.preventDefault(); e.stopImmediatePropagation();
                activeVideo.paused ? activeVideo.play() : activeVideo.pause();
                break;
                
            // 음소거 (M)
            case 'm':
            case 'M':
                e.preventDefault(); e.stopImmediatePropagation();
                activeVideo.muted = !activeVideo.muted;
                break;

            // 전체화면 (F)
            case 'f':
            case 'F':
                e.preventDefault(); e.stopImmediatePropagation();
                if (!document.fullscreenElement) {
                    if (activeVideo.requestFullscreen) activeVideo.requestFullscreen();
                    else if (activeVideo.webkitRequestFullscreen) activeVideo.webkitRequestFullscreen();
                } else {
                    if (document.exitFullscreen) document.exitFullscreen();
                    else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
                }
                break;
                
            // 배속 조절 ([ 랑 ])
            case ']':
                e.preventDefault(); e.stopImmediatePropagation();
                activeVideo.playbackRate = Math.min(4, activeVideo.playbackRate + 0.25);
                break;
            case '[':
                e.preventDefault(); e.stopImmediatePropagation();
                activeVideo.playbackRate = Math.max(0.25, activeVideo.playbackRate - 0.25);
                break;
        }
    }, true);
})();
