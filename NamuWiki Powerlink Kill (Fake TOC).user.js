// ==UserScript==
// @name         나무위키 파워링크 최종 처형 (목차 보호 완벽 적용)
// @version      7.1
// @description  실제 목차 번호(1, 2.1 등) 완벽 보호 및 위장 앵커 타격
// @match        *://namu.wiki/*
// @run-at       document-start
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // 1. 외부 프레임 광고 1차 차단
    const style = document.createElement('style');
    style.textContent = `
        iframe:not([src*="youtube"]):not([src*="vimeo"]) {
            display: none !important;
            width: 0 !important; height: 0 !important;
            pointer-events: none !important;
        }
    `;
    if (document.documentElement) document.documentElement.appendChild(style);

    // 2. 광고 폭파 함수 (안전망 강화)
    const nuke = (el) => {
        let parent = el;
        let adBox = null;
        let depth = 0;
        
        while (parent && depth < 7) {
            const tag = parent.tagName ? parent.tagName.toUpperCase() : '';
            // 최상위 레이어 도달 시 중단
            if (tag === 'ARTICLE' || tag === 'MAIN' || tag === 'BODY' || parent.id === 'app') break;
            if (parent.className && typeof parent.className === 'string' && parent.className.includes('wiki-inner-content')) break;
            
            // [방어막] 글자 수가 500자가 넘어가면 정상적인 본문 문단으로 간주하고 폭파 중단
            let textLen = parent.textContent ? parent.textContent.replace(/\s+/g, '').length : 0;
            if (textLen > 500) break; 
            
            adBox = parent;
            parent = parent.parentElement;
            depth++;
        }
        
        // 광고 컨테이너 물리적 삭제
        if (adBox && adBox.innerHTML !== '') {
            adBox.innerHTML = '';
            adBox.style.setProperty('display', 'none', 'important');
            adBox.style.setProperty('height', '0', 'important');
            adBox.style.setProperty('margin', '0', 'important');
            adBox.style.setProperty('padding', '0', 'important');
        }
    };

    const scan = () => {
        // [패턴 1] 가짜 앵커 추적 (목차 완벽 보호 적용)
        document.querySelectorAll('a[href^="#s-"]').forEach(a => {
            const text = a.textContent.trim();
            if (!text) return; // 텍스트가 없는 투명 버튼 패스
            
            // ★ 핵심: 텍스트가 오직 숫자와 마침표로만 이루어져 있다면 진짜 목차(예: 1, 2.1, 10.2.3)이므로 보호!
            if (/^[\d.]+$/.test(text)) return; 
            
            if (/^\[\d+\]$/.test(text)) return; // [1], [2] 같은 주석 패스
            if (a.classList.contains('wiki-link-internal')) return; // 위키 유저가 작성한 내부 링크 패스
            
            // 숫자/주석/내부링크가 아닌데 #s- 로 간다? 100% 훔친 목차 아이디를 쓴 광고입니다.
            nuke(a);
        });

        // [패턴 2] 허니팟(워터마크) 텍스트 추적
        // 나무위키가 스크립트 감시용으로 몰래 숨겨두는 8자리 랜덤 식별 코드(클래스명 = 텍스트)를 역추적
        document.querySelectorAll('div, span').forEach(el => {
            if (el.childNodes.length === 1 && el.firstChild.nodeType === Node.TEXT_NODE) {
                const text = el.textContent.trim();
                // 보통 8글자(예: _3Ckm61w8)의 쓰레기 텍스트가 클래스명과 동일하게 박혀있음
                if (text.length >= 6 && text.length <= 15) {
                    if (el.classList.contains(text)) {
                        nuke(el);
                    }
                }
            }
        });
    };

    // 실시간 감시 및 즉각 파괴
    const observer = new MutationObserver(() => { scan(); });
    const start = () => {
        if (document.body) {
            observer.observe(document.body, { childList: true, subtree: true });
            scan();
        } else {
            requestAnimationFrame(start);
        }
    };
    start();
    
    // 지연 팝업 방어
    setInterval(scan, 300);
})();
