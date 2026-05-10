// ==UserScript==
// @name         Safari Universal Video Optimizer (Final Lock + TV 연합 참교육)
// @version      12.0
// @description  모든 영상 내장 플레이어 적용 및 속성 잠금(Lock), 늦은 개입 취소, YouTube PiP 완벽 지원, 10초 건너뛰기 추가 + 티비위키/티비몬 강제 제압
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
        // 단축키 (Ctrl + P)
        window.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key.toLowerCase() === 'p') {
                const video = document.querySelector('video');
                if (video) {
                    if (document.pictureInPictureElement) document.exitPictureInPicture();
                    else video.requestPictureInPicture().catch(console.error);
                }
            }
        });

        // 우측 하단 고정 버튼
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
        return; // 유튜브는 여기서 스크립트 완전 종료
    }

    // ==========================================
    // 3. 범용 영상 처리 및 속성 방어 로직
    // ==========================================
    const processVideo = (v) => {
        if (v.dataset.optmStatus) return; // 이미 처리/취소된 영상 패스

        // [방어 1] EME(DRM 암호화) 영상 보호
        if (v.mediaKeys) {
            v.dataset.optmStatus = "drm_skipped";
            return;
        }

        // [방어 2] 지각 개입 취소 (영상이 이미 2초 이상 재생된 경우)
        if (v.currentTime > 2 && !v.controls) {
            console.log("⚠️ [Video Optimizer] 영상이 이미 진행 중입니다. 충돌 방지를 위해 개입을 취소합니다.");
            v.dataset.optmStatus = "too_late";
            return;
        }

        // Safari 내장 컨트롤러 강제 활성화 및 최상단 배치
        const enforceControls = () => {
            if (!v.controls) {
                v.controls = true;
                v.setAttribute('controls', 'controls');
            }
            v.style.setProperty('z-index', '2147483647', 'important');
            v.style.setProperty('pointer-events', 'auto', 'important');
        };

        enforceControls();

        // [핵심] 사이트 자체 스크립트가 controls를 끄려고 할 때 막아내는 방어막(Lock)
        const attributeLock = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.attributeName === 'controls' && !v.controls) {
                    console.log("🛡️ [Video Optimizer] 사이트가 내장 컨트롤러를 끄려는 것을 방어했습니다.");
                    v.controls = true;
                    v.setAttribute('controls', 'controls');
                }
            });
        });
        
        // controls 속성의 변화만 타겟으로 감시
        attributeLock.observe(v, { attributes: true, attributeFilter: ['controls'] });

        // 우클릭 차단 뚫기 (캡처 및 사파리 기본 메뉴용)
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
                    // 추가된 요소 내부에 비디오가 숨어있는지 확인
                    const videos = node.querySelectorAll('video');
                    videos.forEach(processVideo);
                }
            }
        }
    });

    observer.observe(document.documentElement, { childList: true, subtree: true });

    // 혹시라도 놓친 영상이 있다면 DOMContentLoaded 시점에 한 번 더 스캔
    window.addEventListener('DOMContentLoaded', () => {
        document.querySelectorAll('video').forEach(processVideo);
    });

    // ==========================================
    // 5. 키보드 방향키 10초 이동 & 스페이스바 제어 강제 설정
    // ==========================================
    window.addEventListener('keydown', (e) => {
        // 검색창, 댓글창 등 텍스트 입력 중일 때는 키보드 단축키 무시
        const activeEl = document.activeElement;
        if (activeEl && (['INPUT', 'TEXTAREA', 'SELECT'].includes(activeEl.tagName) || activeEl.isContentEditable)) {
            return;
        }

        const activeVideo = document.querySelector('video');
        if (!activeVideo) return;

        // 화살표 오른쪽 키 (10초 앞으로)
        if (e.key === 'ArrowRight') {
            e.preventDefault(); 
            e.stopImmediatePropagation(); 
            activeVideo.currentTime += 10;
        }
        // 화살표 왼쪽 키 (10초 뒤로)
        else if (e.key === 'ArrowLeft') {
            e.preventDefault();
            e.stopImmediatePropagation();
            activeVideo.currentTime -= 10;
        }
        // 스페이스바 (재생/일시정지 더블 클릭 현상 방지)
        else if (e.key === ' ' || e.code === 'Space') {
            e.preventDefault(); // 브라우저 기본 스크롤 다운 방지
            e.stopImmediatePropagation(); // 사이트 자체 스크립트 중복 실행 방지
            if (activeVideo.paused) {
                activeVideo.play();
            } else {
                activeVideo.pause();
            }
        }
    }, true); // 'true'를 사용해 이벤트 캡처링 단계에서 먼저 가로챔

    // ==========================================
    // 6. [티비위키/티비몬 연합 전용 참교육] 커스텀 플레이어 파괴 및 제어권 강탈
    // ==========================================
    const isTvAlliance = /tvmon|tvwiki|tvroom|hoohootv|bunny-frame|poorcdn|digitalorio/i.test(host) || /tvmon|tvwiki|tvroom/i.test(document.referrer);

    if (isTvAlliance) {
        console.log("🔥 [Video Optimizer] 불법 스트리밍 연합 감지! 참교육 모드 가동!");

        // 방해되는 투명 껍데기(커스텀 UI) CSS로 숨통 끊기
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
            (document.head || document.documentElement).appendChild(style);
        };
        injectStyles();

        // 강제 PiP 버튼 (모바일 화면 우측 하단)
        const addTvPipButton = () => {
            if (document.getElementById('tv-force-pip') || !document.querySelector('video')) return;

            const btn = document.createElement('button');
            btn.id = 'tv-force-pip';
            btn.innerText = '🔥 강제 PiP';
            btn.style.cssText = `
                position: fixed !important; bottom: 80px !important; right: 20px !important; z-index: 2147483647 !important; 
                padding: 12px 18px !important; background: rgba(0, 150, 255, 0.9) !important; color: white !important; 
                border: 2px solid white !important; border-radius: 8px !important; cursor: pointer !important; font-weight: bold !important; 
                backdrop-filter: blur(5px) !important; box-shadow: 0 4px 10px rgba(0,0,0,0.5) !important; display: block !important;
            `;
            
            const handlePip = (e) => {
                e.preventDefault();
                e.stopPropagation();
                const v = document.querySelector('video');
                if (!v) return;
                
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

        setInterval(addTvPipButton, 1500);
        
        // 껍데기 무시하고 화면 더블 탭 시 PiP 발동
        let lastTap = 0;
        window.addEventListener('touchstart', (e) => {
            if (e.target.id === 'tv-force-pip' || e.target.id === 'force-pip-btn') return;
            const currentTime = new Date().getTime();
            const tapLength = currentTime - lastTap;
            
            if (tapLength < 300 && tapLength > 0) {
                const v = document.querySelector('video');
                if (v && typeof v.webkitSetPresentationMode === 'function') {
                    // 더블탭 원래 이벤트를 무시하고 사파리 PiP 즉시 실행
                    e.preventDefault();
                    e.stopImmediatePropagation();
                    v.webkitSetPresentationMode('picture-in-picture');
                }
            }
            lastTap = currentTime;
        }, { passive: false, capture: true }); // 가장 먼저 가로채기
    }
})();
