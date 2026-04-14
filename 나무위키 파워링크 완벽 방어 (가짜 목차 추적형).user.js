// ==UserScript==
// @name         나무위키 파워링크 완벽 방어 (가짜 목차 추적형)
// @namespace    http://tampermonkey.net/
// @version      6.0
// @description  본문 증발 오류 수정 및 가짜 앵커 링크 기반 타격
// @match        *://namu.wiki/*
// @run-at       document-start
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // 1. 외부 프레임 광고 1차 차단 (유튜브 영상 등은 보호)
    const style = document.createElement('style');
    style.textContent = `
        iframe:not([src*="youtube"]):not([src*="vimeo"]) {
            display: none !important;
            width: 0 !important; height: 0 !important;
            pointer-events: none !important;
        }
    `;
    if (document.documentElement) document.documentElement.appendChild(style);

    // 2. 가짜 목차(Fake Anchor) 링크를 추적하여 광고 박스만 분쇄
    const nukeAds = () => {
        // '#s-' 로 시작하는 모든 링크 탐색
        document.querySelectorAll('a[href^="#s-"]').forEach(a => {
            // 위키 사용자가 직접 작성한 정상적인 내부 링크는 타격하지 않음
            if (a.classList.contains('wiki-link-internal')) return;

            const targetId = a.getAttribute('href').substring(1);
            
            // 실제 문서에 해당 목차(예: s-31)가 없다면, 이것은 100% 클릭 가로채기용 광고 링크!
            if (!document.getElementById(targetId)) {
                let parent = a;
                let adBox = a;
                let depth = 0;

                // 해당 가짜 링크를 감싸고 있는 광고 컨테이너 역추적 (최대 6단계)
                while (parent && depth < 6) {
                    const tag = parent.tagName ? parent.tagName.toUpperCase() : '';
                    
                    // [안전장치 1] 최상위 레이아웃 도달 시 즉시 중단
                    if (tag === 'BODY' || tag === 'ARTICLE' || parent.id === 'app') break;
                    
                    // [안전장치 2] 본문 컨테이너 도달 시 중단 (글자 수가 1000자가 넘어가면 본문으로 간주)
                    if (parent.textContent && parent.textContent.length > 1000) break;
                    
                    // [안전장치 3] 제목 태그나 목차가 포함된 영역이면 중단 (광고 박스에는 H2/H3 타이틀이 없음)
                    if (parent.querySelector('h1, h2, h3, #toc')) break;

                    adBox = parent;
                    parent = parent.parentElement;
                    depth++;
                }

                // 추적해낸 광고 컨테이너의 내부 소스코드를 물리적으로 삭제
                if (adBox && adBox.innerHTML !== '') {
                    adBox.innerHTML = '';
                    adBox.style.setProperty('display', 'none', 'important');
                    adBox.style.setProperty('height', '0', 'important');
                    adBox.style.setProperty('margin', '0', 'important');
                    adBox.style.setProperty('padding', '0', 'important');
                }
            }
        });
    };

    // 3. 페이지 변화 실시간 감시 및 즉각 파괴
    const observer = new MutationObserver(() => { nukeAds(); });
    const start = () => {
        if (document.body) {
            observer.observe(document.body, { childList: true, subtree: true });
            nukeAds();
        } else {
            requestAnimationFrame(start);
        }
    };
    start();

    // 지연 로딩 방어용 주기적 스캔
    setInterval(nukeAds, 300);
})();
