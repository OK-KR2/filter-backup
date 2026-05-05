// ==UserScript==
// @name         Safari Universal Video Optimizer (Final Lock)
// @version      4.3
// @description  모든 영상 내장 플레이어 적용 및 속성 잠금(Lock), 늦은 개입 취소, YouTube PiP 완벽 지원, 10초 건너뛰기 추가
// @author       You
// @match        *://*/*
// @exclude      *://store.nintendo.co.kr/*
// @exclude      *://192.168.0.1/*
// @run-at       document-start
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const host = window.location.hostname;

    // ==========================================
    // 0. 강제 예외 사이트 (확실한 차단 - 앱 버그 방어용)
    // ==========================================
    // 확장 프로그램이 @exclude를 무시할 때를 대비한 2중 차단막
    const blockDomains = ['nintendo.co.kr', 'nintendo.com', '192.168.0.1'];
    
    if (blockDomains.some(domain => host.includes(domain))) {
        console.log("⛔ [Video Optimizer] 예외 사이트 감지됨. 스크립트 실행을 완전히 중단합니다.");
        return; // 스크립트 즉시 컷!
    }

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
    // 3. 범용 영상 처리 및 속성 방어 로직
    // ==========================================
    const processVideo = (v) => {
        if (v.dataset.optmStatus) return; 

        if (v.mediaKeys) {
            v.dataset.optmStatus = "drm_skipped";
            return;
        }

        if (v.currentTime > 2 && !v.controls) {
            console.log("⚠️ [Video Optimizer] 영상이 이미 진행 중입니다. 충돌 방지를 위해 개입을 취소합니다.");
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
                    console.log("🛡️ [Video Optimizer] 사이트가 내장 컨트롤러를 끄려는 것을 방어했습니다.");
                    v.controls = true;
                    v.setAttribute('controls', 'controls');
                }
            });
        });
        
        attributeLock.observe(v, { attributes: true, attributeFilter: ['controls'] });

        v.addEventListener('contextmenu', e => e.stopPropagation(), true);

        v.dataset.optmStatus = "success_locked";
        console.log("✅ [Video Optimizer] Safari 내장 플레이어 전환 및 잠금 완료.");
    };

    // ==========================================
    // 4. 초고속 DOM 감지 (페이지 렌더링 극초기)
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
    // 5. 키보드 방향키 10초 이동 & 스페이스바 제어 강제 설정
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
})();
