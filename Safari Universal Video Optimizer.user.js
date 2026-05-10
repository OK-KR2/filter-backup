// ==UserScript==
// @name         Safari iOS Video Hijacker
// @version      13.0
// @description  iframe 벙커 완벽 관통, 네이티브 컨트롤 강제, 잘리지 않는 PiP 버튼 강제 생성
// @author       You
// @match        *://*/*
// @all_frames   true
// @run-at       document-idle
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // 티비위키, 티비몬 및 외부 영상 서버(bunny-frame 등) 도메인 싹 다 잡기
    const isTvAlliance = /tvmon|tvwiki|tvroom|hoohootv|bunny-frame|poorcdn|digitalorio/i.test(window.location.hostname);

    if (!isTvAlliance) return;

    console.log("🚀 [Video Hijacker] 영상 벙커 침투 성공: ", window.location.hostname);

    const initVideo = () => {
        const v = document.querySelector('video');
        if (!v) return;

        // 1. 사파리 순정 플레이어 강제 소환 및 잠금 해제
        v.removeAttribute('disablePictureInPicture');
        v.setAttribute('controls', 'controls');
        v.setAttribute('playsinline', 'playsinline');
        v.controls = true;

        // 2. 비디오를 무조건 최상단으로 (터치 가로채기 원천 봉쇄)
        v.style.setProperty('z-index', '2147483647', 'important');
        v.style.setProperty('position', 'relative', 'important');
        v.style.setProperty('pointer-events', 'auto', 'important');

        // 3. 지들이 만든 가짜 컨트롤러(투명 껍데기) CSS로 암살
        const garbageUI = document.querySelectorAll('.jw-controls, .jw-ui, .vjs-control-bar, .plyr__controls, .shaka-controls-container, .fluid_controls_container');
        garbageUI.forEach(el => {
            el.style.setProperty('display', 'none', 'important');
            el.style.setProperty('pointer-events', 'none', 'important');
        });

        // 4. 잘리지 않게 영상 '우측 상단'에 강제 PiP 버튼 생성
        if (!document.getElementById('super-pip-btn')) {
            const btn = document.createElement('button');
            btn.id = 'super-pip-btn';
            btn.innerHTML = '📺 강제 PiP';
            btn.style.cssText = `
                position: absolute !important; 
                top: 10px !important; 
                right: 10px !important; 
                z-index: 2147483647 !important; 
                padding: 8px 12px !important; 
                background: #ff003c !important; 
                color: white !important; 
                border: 2px solid white !important; 
                border-radius: 8px !important; 
                font-size: 14px !important; 
                font-weight: bold !important; 
                box-shadow: 0 4px 10px rgba(0,0,0,0.5) !important;
                cursor: pointer !important;
            `;
            
            const togglePip = (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                // [핵심] 사파리는 영상이 재생 중이어야만 PiP가 작동함
                if (v.paused) {
                    alert("⚠️ 영상을 '재생'시킨 후에 PiP 버튼을 눌러주세요!");
                    v.play(); // 자동 재생 시도
                    return;
                }

                try {
                    if (typeof v.webkitSetPresentationMode === 'function') {
                        v.webkitSetPresentationMode(v.webkitPresentationMode === 'picture-in-picture' ? 'inline' : 'picture-in-picture');
                    } else if (document.pictureInPictureElement) {
                        document.exitPictureInPicture();
                    } else {
                        v.requestPictureInPicture().catch(err => alert("PiP 에러: " + err.message));
                    }
                } catch(error) {
                    alert("사파리 엔진 에러: " + error.message);
                }
            };

            btn.addEventListener('click', togglePip, true);
            btn.addEventListener('touchstart', togglePip, { passive: false, capture: true });
            
            // iframe 내부 body에 직접 박아넣음
            (document.body || document.documentElement).appendChild(btn);
        }
    };

    // 1초마다 스캔해서 놈들이 비디오 띄우는 즉시 장악해버림
    setInterval(initVideo, 1000);

    // [보너스] 영상 화면 빠르게 2번 터치 시 강제 PiP
    let lastTap = 0;
    window.addEventListener('touchstart', (e) => {
        if (e.target.id === 'super-pip-btn') return; // 버튼 누른 건 제외
        
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
    
})();
