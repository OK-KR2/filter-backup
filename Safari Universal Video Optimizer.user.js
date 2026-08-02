// ==UserScript==
// @name         Safari Universal Video Optimizer (Pro Edition)
// @version      20.1
// @description  내장 플레이어 덮어쓰기 방지 + 스마트 메인 영상 탐지 + 볼륨/배속/전체화면 단축키 완벽 지원 + 기존 커스텀 버튼 무력화
// @author       You
// @match        *://*/*
// @run-at       document-idle
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const host = window.location.hostname;

    // ==========================================
    // 💡 [업그레이드] 스마트 영상 탐지 로직 (성능 최적화 캐싱 + Shadow DOM 돌파)
    // ==========================================
    let cachedVideo = null;
    let lastVideoCheckTime = 0;

    const getActiveVideo = () => {
        const now = Date.now();
        // 2초 이내에 찾은 기록이 있고, 그 비디오가 아직 화면에 존재한다면 기존 비디오 재사용 (렉 완벽 방지)
        if (cachedVideo && document.body.contains(cachedVideo) && (now - lastVideoCheckTime < 2000)) {
            return cachedVideo;
        }

        let videos = Array.from(document.querySelectorAll('video'));
        
        // 숨겨진 Shadow DOM 내부의 비디오까지 전부 긁어오기 (무거운 작업)
        document.querySelectorAll('*').forEach(el => {
            if (el.shadowRoot) {
                videos.push(...el.shadowRoot.querySelectorAll('video'));
            }
        });

        if (videos.length === 0) return null;

        // 면적이 가장 큰 비디오를 진짜 '메인 영상'으로 간주
        const mainVideo = videos.sort((a, b) => (b.clientWidth * b.clientHeight) - (a.clientWidth * a.clientHeight))[0];
        
        // 찾은 비디오를 캐시에 저장하고 시간 갱신
        cachedVideo = mainVideo;
        lastVideoCheckTime = now;
        
        return mainVideo;
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
    // 3. 범용 영상 처리 및 속성 방어 로직 
    // ==========================================
    const processVideo = (v) => {
        if (v.dataset.optmStatus) return;
        if (v.mediaKeys) { v.dataset.optmStatus = "drm_skipped"; return; }
        if (v.currentTime > 2 && !v.controls) { v.dataset.optmStatus = "too_late"; return; }

        // ▼▼▼▼▼ [요청 1] 기존의 내장 플레이어 덮어씌우기 주석 원복 완료 ▼▼▼▼▼
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
        // ▲▲▲▲▲ 여기까지 주석 원복 완료 ▲▲▲▲▲


        // ▼▼▼▼▼ [요청 2] 최적화된 재생/일시정지 버튼 무력화 로직 ▼▼▼▼▼
        // 공통 검사 함수: 요소에 play나 pause 키워드가 있는지 확인
        const isPlayPauseElement = (el) => {
            if (!el || !el.getAttribute) return false;
            const attrs = (el.getAttribute('class') || '') + ' ' + 
                          (el.id || '') + ' ' + 
                          (el.getAttribute('aria-label') || '');
            const lowerAttrs = attrs.toLowerCase();
            return lowerAttrs.includes('play') || lowerAttrs.includes('pause');
        };

        const disableCustomControls = () => {
            if (!v.parentElement) return;
            const elements = v.parentElement.querySelectorAll('*');
            elements.forEach(el => {
                if (el.tagName === 'VIDEO') return;
                if (isPlayPauseElement(el)) {
                    // 1차 차단: 마우스 이벤트 원천 무력화
                    el.style.setProperty('pointer-events', 'none', 'important');
                }
            });
        };
        disableCustomControls(); 

        if (v.parentElement) {
            // [성능 최적화]: DOM이 아무리 자주 변해도 0.2초에 1번만 실행되도록 디바운스 적용 (렉 방지)
            let timer = null;
            const btnLock = new MutationObserver(() => {
                if (timer) clearTimeout(timer);
                timer = setTimeout(disableCustomControls, 200);
            });
            btnLock.observe(v.parentElement, { childList: true, subtree: true });

            // [방어력 강화]: SVG 아이콘 클릭 방어 및 모든 마우스/터치 이벤트 차단 함수
            const blockEvent = (e) => {
                if (e.target.tagName === 'VIDEO') return; // 영상 자체 클릭은 허용
                
                // 클릭된 요소부터 부모(버튼 등)로 올라가며 play/pause가 있는지 탐색
                let current = e.target;
                while (current && current !== v.parentElement) {
                    if (isPlayPauseElement(current)) {
                        e.preventDefault();
                        e.stopPropagation();
                        e.stopImmediatePropagation(); // 다른 확장프로그램/스크립트의 실행까지 완벽 차단
                        return;
                    }
                    current = current.parentElement;
                }
            };
            
            // 2차 차단: click뿐만 아니라 최신 프레임워크가 쓰는 down 이벤트까지 캡처링 차단
            v.parentElement.addEventListener('click', blockEvent, true);
            v.parentElement.addEventListener('mousedown', blockEvent, true);
            v.parentElement.addEventListener('pointerdown', blockEvent, true);
        }
        // ▲▲▲▲▲ 추가된 스크립트 끝 ▲▲▲▲▲


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