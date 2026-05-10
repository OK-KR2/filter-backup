// ==UserScript==
// @name         Safari Universal Video Optimizer (Absolute Hijacker)
// @version      15.0
// @description  11.0 뼈대 유지 + 속성 가로채기(Monkey Patch)로 순정 플레이어 강제 고정 + 하단 PiP 버튼
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
    
    if (drmDomains.some(domain => host.includes(domain))) return;

    // ==========================================
    // 2. YouTube 전용: PiP 강제 활성화 (11.0 원본)
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
                backdrop-filter: blur(5px); box-shadow: 0 4px 6px rgba(0,0,0,0.3);
            `;
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
    // 3. 범용 영상 처리 (11.0 원본)
    // ==========================================
    const processVideo = (v) => {
        if (v.dataset.optmStatus || v.mediaKeys) return;

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

    const observer = new MutationObserver((mutations) => {
        for (let mutation of mutations) {
            for (let node of mutation.addedNodes) {
                if (node.tagName === 'VIDEO') processVideo(node);
                else if (node.querySelectorAll) node.querySelectorAll('video').forEach(processVideo);
            }
        }
    });

    observer.observe(document.documentElement, { childList: true, subtree: true });

    // ==========================================
    // 4. 키보드 방향키 10초 이동 (11.0 원본)
    // ==========================================
    window.addEventListener('keydown', (e) => {
        const activeEl = document.activeElement;
        if (activeEl && (['INPUT', 'TEXTAREA', 'SELECT'].includes(activeEl.tagName) || activeEl.isContentEditable)) return;

        const activeVideo = document.querySelector('video');
        if (!activeVideo) return;

        if (e.key === 'ArrowRight') {
            e.preventDefault(); e.stopImmediatePropagation(); activeVideo.currentTime += 10;
        } else if (e.key === 'ArrowLeft') {
            e.preventDefault(); e.stopImmediatePropagation(); activeVideo.currentTime -= 10;
        } else if (e.key === ' ' || e.code === 'Space') {
            e.preventDefault(); e.stopImmediatePropagation();
            if (activeVideo.paused) activeVideo.play(); else activeVideo.pause();
        }
    }, true);

    // ==========================================
    // 5. 🔥 [끝판왕] 외부 플레이어 순정 강제 고정 및 PiP 버튼
    // ==========================================
    // 티비위키, 티비몬 등 영상 껍데기 프레임 도메인 감지
    if (/bunny-frame|poorcdn|digitalorio|tvmon|tvwiki/i.test(host)) {
        
        const absoluteHijack = () => {
            const v = document.querySelector('video');
            if (!v || v.dataset.hijacked) return;

            // [방패 부수기 1] 놈들이 controls를 끄려고 할 때 브라우저 기능 자체를 가로채서 씹어버림
            try {
                Object.defineProperty(v, 'controls', {
                    get: () => true,
                    set: (val) => { console.log("놈들이 컨트롤러를 끄려고 시도했지만 차단함"); }
                });

                const originalRemove = v.removeAttribute;
                v.removeAttribute = function(attr) {
                    if (attr.toLowerCase() === 'controls') return; // 삭제 시도 무시
                    return originalRemove.apply(this, arguments);
                };
            } catch(e) {}

            v.setAttribute('controls', 'controls');
            v.setAttribute('playsinline', 'playsinline');
            
            // 영상 자체를 모든 가짜 UI 위로 강제 노출
            v.style.setProperty('z-index', '2147483647', 'important');
            v.style.setProperty('position', 'relative', 'important');
            v.style.setProperty('pointer-events', 'auto', 'important');

            v.dataset.hijacked = "true";
        };

        // PiP 버튼 하단 생성 (순정 컨트롤바에 안 겹치게 bottom: 60px 위치)
        const injectPipButton = () => {
            if (document.getElementById('ultimate-pip-btn') || !document.querySelector('video')) return;

            const btn = document.createElement('button');
            btn.id = 'ultimate-pip-btn';
            btn.innerHTML = '🔥 PiP';
            btn.style.cssText = `
                position: fixed !important; 
                bottom: 60px !important; 
                left: 15px !important; 
                z-index: 2147483647 !important; 
                padding: 10px 14px !important; 
                background: rgba(0, 100, 255, 0.85) !important; 
                color: white !important; 
                border: 2px solid rgba(255,255,255,0.5) !important; 
                border-radius: 8px !important; 
                cursor: pointer !important; 
                font-size: 13px !important;
                font-weight: bold !important; 
                backdrop-filter: blur(4px) !important; 
                box-shadow: 0 4px 10px rgba(0,0,0,0.5) !important; 
                pointer-events: auto !important;
            `;
            
            const handlePip = (e) => {
                e.preventDefault();
                e.stopPropagation();
                const v = document.querySelector('video');
                if (!v) return;
                
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
                } catch(err) { alert("PiP Error: " + err.message); }
            };

            btn.addEventListener('click', handlePip, true);
            btn.addEventListener('touchstart', handlePip, { passive: false, capture: true });
            
            (document.body || document.documentElement).appendChild(btn);
        };

        // 0.5초마다 놈들의 방어막을 뚫고 계속 주입
        setInterval(() => {
            absoluteHijack();
            injectPipButton();
        }, 500);
    }
})();
