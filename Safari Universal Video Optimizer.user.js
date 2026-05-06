// ==UserScript==
// @name         Safari Universal Video Optimizer (Targeted PiP Button)
// @version      5.1
// @description  모든 영상 내장 플레이어 적용 및 단축키 지원, YouTube & TVWIKI 전용 PiP 버튼 (SPA/iframe 대응)
// @author       You
// @match        *://*/*
// @all_frames   true
// @run-at       document-start
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const host = window.location.hostname;
    
    // 타겟 사이트 확인 (유튜브 및 티비위키 계열)
    const isYoutube = host.includes('youtube.com');
    // 숫자 변동에 대응하기 위해 'tvwiki'만 포함되어 있는지 확인 + 실제 영상이 로드되는 iframe 도메인 포함
    const isTvWiki = host.includes('tvwiki') || host.includes('bunny-frame'); 

    // ==========================================
    // 1. DRM 사이트 예외 처리
    // ==========================================
    const drmDomains = ['netflix.com', 'tving.com', 'wavve.com', 'watcha.com', 'disneyplus.com', 'coupangplay.com', 'primevideo.com'];
    if (drmDomains.some(domain => host.includes(domain))) return;

    // ==========================================
    // 2. PiP 실행 함수 (공통)
    // ==========================================
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

    // ==========================================
    // 3. PiP 버튼 강제 생성 (유튜브 & 티비위키에서만 감시 실행)
    // ==========================================
    if (isYoutube || isTvWiki) {
        const managePipButton = () => {
            // 유튜브인 경우 SPA(단일 페이지 애플리케이션) 대응: 영상 페이지(/watch)가 아니면 숨김
            if (isYoutube && window.location.pathname !== '/watch') {
                let btn = document.getElementById('force-pip-btn');
                if (btn) btn.style.display = 'none';
                return;
            }

            const video = document.querySelector('video');
            let btn = document.getElementById('force-pip-btn');

            // 영상이 없으면 버튼 숨김
            if (!video) {
                if (btn) btn.style.display = 'none';
                return;
            }

            // 버튼이 없으면 생성
            if (!btn) {
                btn = document.createElement('button');
                btn.id = 'force-pip-btn';
                btn.innerText = 'PiP 모드';
                btn.style.cssText = `
                    position: absolute; bottom: 60px; right: 20px; z-index: 2147483647; 
                    padding: 10px 15px; background: rgba(240, 0, 1, 0.85); color: white; 
                    border: none; border-radius: 8px; cursor: pointer; font-weight: bold; 
                    backdrop-filter: blur(5px); transition: 0.2s; box-shadow: 0 4px 6px rgba(0,0,0,0.3);
                `;
                // 버튼을 body에 추가 (iframe 내부일 경우 영상 바로 위에 뜸)
                document.body.appendChild(btn);
            }
            
            btn.style.display = 'block';
            btn.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                togglePiP(video);
            };
        };
        
        // 사파리 부하를 줄이기 위해 타겟 사이트에서만 2초마다 감시
        setInterval(managePipButton, 2000);
    }

    // ==========================================
    // 4. 범용 영상 처리 (모든 사이트 적용 - 부하가 적은 이벤트 감지 방식)
    // ==========================================
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

    // ==========================================
    // 5. 통합 키보드 단축키 (모든 사이트 적용)
    // ==========================================
    window.addEventListener('keydown', (e) => {
        const activeEl = document.activeElement;
        if (activeEl && (['INPUT', 'TEXTAREA', 'SELECT'].includes(activeEl.tagName) || activeEl.isContentEditable)) return;

        const v = document.querySelector('video');
        if (!v) return;

        // PiP 단축키 (Ctrl + P)
        if (e.ctrlKey && e.key.toLowerCase() === 'p') {
            e.preventDefault();
            togglePiP(v);
        }
        // 화살표 오른쪽 (10초 앞)
        else if (e.key === 'ArrowRight') {
            e.preventDefault();
            e.stopImmediatePropagation();
            v.currentTime += 10;
        }
        // 화살표 왼쪽 (10초 뒤)
        else if (e.key === 'ArrowLeft') {
            e.preventDefault();
            e.stopImmediatePropagation();
            v.currentTime -= 10;
        }
        // 스페이스바 (재생/일시정지)
        else if (e.key === ' ' || e.code === 'Space') {
            e.preventDefault();
            e.stopImmediatePropagation();
            if (v.paused) v.play(); else v.pause();
        }
    }, true);
})();
