// ==UserScript==
// @name         YouTube PiP Only
// @version      31.0
// @description  유튜브 전용 PiP (Ctrl+P 및 버튼)
// @author       You
// @match        *://*.youtube.com/*
// @run-at       document-idle
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // ==========================================
    // 💡 스마트 영상 탐지 로직 (성능 최적화 캐싱)
    // ==========================================
    let cachedVideo = null;
    let lastVideoCheckTime = 0;

    const getActiveVideo = () => {
        const now = Date.now();
        // 2초 이내에 찾은 기록이 있고, 그 비디오가 아직 화면에 존재한다면 기존 비디오 재사용
        if (cachedVideo && document.body.contains(cachedVideo) && (now - lastVideoCheckTime < 2000)) {
            return cachedVideo;
        }

        let videos = Array.from(document.querySelectorAll('video'));
        
        // 숨겨진 Shadow DOM 내부의 비디오 탐색
        document.querySelectorAll('*').forEach(el => {
            if (el.shadowRoot) {
                videos.push(...el.shadowRoot.querySelectorAll('video'));
            }
        });

        if (videos.length === 0) return null;

        // 면적이 가장 큰 비디오를 진짜 '메인 영상'으로 간주
        const mainVideo = videos.sort((a, b) => (b.clientWidth * b.clientHeight) - (a.clientWidth * a.clientHeight))[0];
        
        cachedVideo = mainVideo;
        lastVideoCheckTime = now;
        
        return mainVideo;
    };


    // ==========================================
    // 📺 YouTube 전용: PiP 강제 활성화 (Ctrl + P) 및 버튼 생성
    // ==========================================
    
    // 단축키 (Ctrl + P)
    window.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key.toLowerCase() === 'p') {
            const video = getActiveVideo();
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

    // PiP 플로팅 버튼 추가
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

    // 유튜브는 페이지 이동 시 새로고침이 안 되므로 주기적 확인 및 자체 이벤트 감지
    setInterval(addPipButton, 1500); 
    window.addEventListener('yt-navigate-finish', addPipButton);

})();
