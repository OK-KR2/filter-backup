// ==UserScript==
// @name         나무위키 파워링크 최종 처형 (실존 목차 도용 방어)
// @version      7.0
// @description  실제 존재하는 목차 ID를 훔쳐쓰는 최신 위장 기법 완벽 타격
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

    // 2. 광고 폭파 함수 (본문 절대 보호 3중 레이어)
    const nuke = (el) => {
        let parent = el;
        let adBox = null;
        let depth = 0;
        
        while (parent && depth < 8) {
            const tag = parent.tagName ? parent.tagName.toUpperCase() : '';
            // 최상위 레이어 도달 시 중단
            if (tag === 'ARTICLE' || tag === 'MAIN' || tag === 'BODY' || parent.id === 'app') break;
            if (parent.className && typeof parent.className === 'string' && parent.className.includes('wiki-inner-content')) break;
            // 방어막: 글자 수가 너무 많으면 본문으로 간주하고 폭파 중단
            if (parent.textContent && parent.textContent.length > 1500) break;
            
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
        // [패턴 1] 실존하는 문서 목차(ID)를 도용한 가짜 앵커 추적
        // 실제 있는 목차(#s-7 등)를 훔쳐서 위장한 광고 타격
        document.querySelectorAll('a[href^="#s-"]').forEach(a => {
            const text = a.textContent.trim();
            if (!text) return; // 텍스트 없는 플로팅 버튼 제외
            if (/^\[\d+\]$/.test(text)) return; // [1], [2] 같은 정상 각주 제외
            if (a.closest('#toc') || a.closest('.toc')) return; // 실제 상단 목차 박스 제외
            if (a.parentElement && /^H[1-6]$/.test(a.parentElement.tagName)) return; // 본문 제목 태그 제외
            if (a.classList.contains('wiki-link-internal')) return; // 유저가 직접 작성한 정상 내부 링크 제외
            
            // 위 정상적인 케이스를 모두 뚫고 남은 텍스트 길이가 2 이상인 링크? 100% 목차를 도용한 광고입니다.
            if (text.length > 2) {
                nuke(a);
            }
        });

        // [패턴 2] 허니팟(워터마크) 텍스트 추적
        // 나무위키가 스크립트 감시용으로 몰래 숨겨두는 식별 코드(클래스명 = 텍스트)를 역추적
        document.querySelectorAll('div, span').forEach(el => {
            if (el.childNodes.length === 1 && el.firstChild.nodeType === Node.TEXT_NODE) {
                const text = el.textContent.trim();
                if (text.length >= 6 && text.length <= 15) {
                    if (el.classList.contains(text)) {
                        nuke(el);
                    }
                }
            }
        });

        // [패턴 3] 쇼핑몰 도메인 텍스트 타격
        // 화면에 m.coupang.com 같은 도메인이 텍스트로 적혀있는 경우 타격
        const domainRegex = /([a-zA-Z0-9-]+\.(com|co\.kr|net|kr|biz|info))/i;
        document.querySelectorAll('div, span, a').forEach(el => {
            if (el.childNodes.length === 1 && el.firstChild.nodeType === Node.TEXT_NODE) {
                const text = el.textContent.trim();
                // URL이 적혀있는데, 실제 <a> 태그의 외부 링크(http~)로 정상 연결된 게 아니라 꼼수로 넣은 텍스트라면 광고로 간주
                if (domainRegex.test(text)) {
                    let isSafe = false;
                    let p = el.parentElement;
                    while(p && p.tagName !== 'BODY') {
                        if (p.tagName === 'A' && p.getAttribute('href') && !p.getAttribute('href').startsWith('#')) {
                            isSafe = true; break;
                        }
                        p = p.parentElement;
                    }
                    if (!isSafe) nuke(el);
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
