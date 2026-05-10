// ==UserScript==
// @name         Safari Universal Video Optimizer (Real Final)
// @version      14.0
// @description  11.0 순정 로직 완벽 복구 + 모든 영상 내장 플레이어 적용 및 속성 잠금(Lock) + 티비위키/티비몬 강제 제압
// @author       You
// @match        *://*/*
// @all_frames   true
// @run-at       document-start
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const host = window.location.hostname;

    // ==========================================
    // 1. DRM 사이트 예외 처리 (블랙리스트)
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
    // 2. YouTube 전용: PiP(화면 안의 화면) 강제 활성화
    // ==========================================
    if (host.includes('youtube.com')) {
        window.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key.toLowerCase() === 'p') {
                const video = document.querySelector('video');
                if (video) {
                    if (document.pictureInPictureElement) document.exitPictureInPicture();
                    else video.requestPictureInPicture().catch(console.error);
                }
            }
        });

        const addPipButton = () => {
            if (document.getElementById('force-pip-btn') || !document.querySelector('video')) return;

            const btn = document.createElement('button');
            btn.id = 'force-pip-btn';
            btn.innerText = 'PiP 모드';
            btn.style.cssText = `
                position: fixed; bottom: 20px; right: 20px; z-index: 99999; 
                padding: 10px 15px; background: rgba(255, 0, 0, 0.8); color: white; 
                border: none; border-radius: 8px; cursor: pointer; font-weight: bold; 
                backdrop-filter: blur(5px); transition: 0.2s; box-shadow: 0 4px 6px rgba(0,0,0,0.3);
            `;
            
            btn.onmouseover = () => btn.style.transform = 'scale(1.05)';
            btn.onmouseout = () => btn.style.transform = 'scale(1)';
            btn.onclick = () => {
                const v = document.querySelector('video');
                if (document.pictureInPictureElement) document.exitPictureInPicture();
                else v.requestPictureInPicture().catch(() => alert('재생이 준비되지 않았습니다.'));
            };
            document.body.appendChild(btn);
        };

        setInterval(addPipButton, 2000);
        return;
    }

    // ==========================================
    // 3. 범용 영상 처리 및 속성 방어 로직 (11.0 핵심 원본 유지)
    // ==========================================
    const processVideo = (v) => {
        if (v.dataset.optmStatus) return;

        if (v.mediaKeys) {
            v.dataset.optmStatus = "drm_skipped";
            return;
        }

        if (v.currentTime > 2 && !v.controls) {
            v.dataset.optmStatus = "too_late";
            return;
        }

        const enforceControls = () => {
            if (!v.controls) {
                v.controls = true;
                v.setAttribute('controls', 'controls');
            }
            v.style.setProperty('z-index', '2147483647', 'important');
            v.style.setProperty('pointer-events', 'auto', 'important');
        };

        enforceControls();

        const attributeLock = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.attributeName === 'controls' && !v.controls) {
                    v.controls = true;
                    v.setAttribute('controls', 'controls');
                }
            });
        });
        
        attributeLock.observe(v, { attributes: true, attributeFilter: ['controls'] });
        v.addEventListener('contextmenu', e => e.stopPropagation(), true);
        v.dataset.optmStatus = "success_locked";
    };

    // ==========================================
    // 4. 초고속 DOM 감지 (11.0 원본)
    // ==========================================
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

    window.addEventListener('DOMContentLoaded', () => {
        document.querySelectorAll('video').forEach(processVideo);
    });

    // ==========================================
    // 5. 키보드 방향키 10초 이동 & 스페이스바 제어 강제 설정 (11.0 원본)
    // ==========================================
    window.addEventListener('keydown', (e) => {
        const activeEl = document.activeElement;
        if (activeEl && (['INPUT', 'TEXTAREA', 'SELECT'].includes(activeEl.tagName) || activeEl.isContentEditable)) {
            return;
        }

        const activeVideo = document.querySelector('video');
        if (!activeVideo) return;

        if (e.key === 'ArrowRight') {
            e.preventDefault(); 
            e.stopImmediatePropagation(); 
            activeVideo.currentTime += 10;
        }
        else if (e.key === 'ArrowLeft') {
            e.preventDefault();
            e.stopImmediatePropagation();
            activeVideo.currentTime -= 10;
        }
        else if (e.key === ' ' || e.code === 'Space') {
            e.preventDefault();
            e.stopImmediatePropagation();
            if (activeVideo.paused) {
                activeVideo.play();
            } else {
                activeVideo.pause();
            }
        }
    }, true);

    // ==========================================
    // 6. [티비위키/티비몬 연합 전용] UI 암살 및 강제 PiP
    // ==========================================
    const isTvAlliance = /tvmon|tvwiki|tvroom|hoohootv|bunny-frame|poorcdn|digitalorio/i.test(host) || /tvmon|tvwiki|tvroom/i.test(document.referrer);

    if (isTvAlliance) {
        
        // CSS 강제 주입: 놈들의 가짜 UI 숨기기
        const injectStyles = () => {
            if (document.getElementById('tv-destroyer-style')) return;
            const style = document.createElement('style');
            style.id = 'tv-destroyer-style';
            style.innerHTML = `
                .jw-controls, .jw-ui, .vjs-control-bar, .vjs-tech, .plyr__controls, .shaka-controls-container, .fluid_controls_container, [class*="overlay"] {
                    display: none !important;
                    pointer-events: none !important;
                }
                video {
                    z-index: 2147483647 !important;
                    position: relative !important;
                    pointer-events: auto !important;
                    display: block !important;
                    opacity: 1 !important;
                }
            `;
            if (document.head || document.documentElement) {
                (document.head || document.documentElement).appendChild(style);
            }
        };

        // 강제 PiP 버튼 생성 (iframe 잘림 방지를 위해 '좌측 상단' 고정)
        const addTvPipButton = () => {
            if (document.getElementById('tv-force-pip') || !document.querySelector('video')) return;

            const btn = document.createElement('button');
            btn.id = 'tv-force-pip';
            btn.innerText = '📺 강제 PiP';
            btn.style.cssText = `
                position: fixed !important; 
                top: 15px !important; 
                left: 15px !important; 
                z-index: 2147483647 !important; 
                padding: 10px 14px !important; 
                background: rgba(255, 0, 60, 0.9) !important; 
                color: white !important; 
                border: 2px solid white !important; 
                border-radius: 8px !important; 
                cursor: pointer !important; 
                font-size: 14px !important;
                font-weight: bold !important; 
                backdrop-filter: blur(5px) !important; 
                box-shadow: 0 4px 10px rgba(0,0,0,0.5) !important; 
                display: block !important;
            `;
            
            const handlePip = (e) => {
                e.preventDefault();
                e.stopPropagation();
                const v = document.querySelector('video');
                if (!v) return;
                
                // 사파리 특: 재생 중이어야 PiP 가능
                if (v.paused) {
                    alert("⚠️ 영상을 '재생(▶)' 한 뒤에 눌러주세요!");
                    v.play().catch(err => console.log(err));
                    return;
                }

                try {
                    if (typeof v.webkitSetPresentationMode === 'function') {
                        v.webkitSetPresentationMode(v.webkitPresentationMode === 'picture-in-picture' ? 'inline' : 'picture-in-picture');
                    } else if (document.pictureInPictureElement) {
                        document.exitPictureInPicture();
                    } else {
                        v.requestPictureInPicture();
                    }
                } catch(err) { console.error("PiP Error:", err); }
            };

            btn.addEventListener('click', handlePip, true);
            btn.addEventListener('touchstart', handlePip, { passive: false, capture: true });
            
            (document.body || document.documentElement).appendChild(btn);
        };

        // 타이머로 꾸준히 확인 (DOM 생성 전후 대비)
        setInterval(() => {
            injectStyles();
            addTvPipButton();
        }, 1000);
        
        // 화면 더블 탭 시 PiP 발동
        let lastTap = 0;
        window.addEventListener('touchstart', (e) => {
            if (e.target.id === 'tv-force-pip') return;
            const currentTime = new Date().getTime();
            const tapLength = currentTime - lastTap;
            
            if (tapLength < 300 && tapLength > 0) {
                const v = document.querySelector('video');
                if (v && typeof v.webkitSetPresentationMode === 'function' && !v.paused) {
                    e.preventDefault();
                    e.stopImmediatePropagation();
                    v.webkitSetPresentationMode('picture-in-picture');
                }
            }
            lastTap = currentTime;
        }, { passive: false, capture: true });
    }
})();
