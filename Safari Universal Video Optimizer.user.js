// ==UserScript==
// @name         Safari Universal Video Optimizer (Final Lock)
// @version      16.2
// @description  모든 영상 내장 플레이어 적용 및 속성 잠금(Lock), 늦은 개입 취소, YouTube PiP 완벽 지원, 10초 건너뛰기 추가
// @author       You
// @match        *://*/*
// @run-at       document-idle
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
        // 단축키 (Ctrl + P)
        window.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key.toLowerCase() === 'p') {
                const video = document.querySelector('video');
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

        // 우측 하단 고정 버튼 생성 로직
        const addPipButton = () => {
            const video = document.querySelector('video');
            if (!video || !document.body) return; // 비디오나 DOM Body가 아직 없으면 대기
            if (document.getElementById('force-pip-btn')) return; // 이미 버튼이 있으면 중복 생성 방지

            const btn = document.createElement('button');
            btn.id = 'force-pip-btn';
            btn.innerText = 'PiP 모드';
            
            // 유튜브 모바일의 공격적인 CSS 및 하단바를 피하기 위해 !important 강제 적용 및 위치 조정
            btn.style.cssText = `
                position: fixed !important; 
                bottom: 80px !important; /* 하단 메뉴바 회피 */
                right: 20px !important; 
                z-index: 2147483647 !important; /* 무조건 최상단 노출 */
                padding: 12px 18px !important; 
                background: rgba(220, 38, 38, 0.9) !important; 
                color: white !important; 
                border: 1px solid rgba(255, 255, 255, 0.3) !important; 
                border-radius: 10px !important; 
                cursor: pointer !important; 
                font-weight: bold !important; 
                font-size: 14px !important;
                backdrop-filter: blur(8px) !important; 
                -webkit-backdrop-filter: blur(8px) !important;
                box-shadow: 0 4px 12px rgba(0,0,0,0.5) !important;
                display: block !important;
                pointer-events: auto !important;
            `;
            
            btn.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                const v = document.querySelector('video');
                if (!v) {
                    alert('현재 재생 중인 영상이 없습니다.');
                    return;
                }

                try {
                    // iOS Safari 최적화 PiP 구동 로직
                    if (typeof v.webkitSetPresentationMode === 'function') {
                        if (v.webkitPresentationMode === 'picture-in-picture') {
                            v.webkitSetPresentationMode('inline');
                        } else {
                            v.webkitSetPresentationMode('picture-in-picture');
                        }
                    } 
                    // 일반 브라우저 표준 로직
                    else if (document.pictureInPictureEnabled) {
                        if (document.pictureInPictureElement) {
                            document.exitPictureInPicture();
                        } else {
                            v.requestPictureInPicture().catch(err => alert('PiP 오류: ' + err.message));
                        }
                    } else {
                        alert('이 브라우저에서는 PiP를 지원하지 않습니다.');
                    }
                } catch (error) {
                    console.error("PiP 전환 에러:", error);
                }
            };
            
            document.body.appendChild(btn);
        };

        // SPA 구조(페이지를 새로고침하지 않고 넘어가는 방식) 대비
        setInterval(addPipButton, 1500); 
        window.addEventListener('yt-navigate-finish', addPipButton);

        return; // 유튜브는 여기서 스크립트 완전 종료
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
