// ==UserScript==
// @name         Mobile DevTools (Eruda) - Final
// @version      5.0
// @match        *://*/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function() {
    'use strict';
    if (window.eruda) return;

    // 1. 네이버 보안(CSP)을 뚫기 위한 무기 (Blob 로더)
    async function loadEruda() {
        try {
            const response = await fetch('https://cdn.jsdelivr.net/npm/eruda');
            const code = await response.text();
            const blob = new Blob([code], { type: 'text/javascript' });
            const url = URL.createObjectURL(blob);
            
            const script = document.createElement('script');
            script.src = url;
            script.onload = () => {
                initEruda();
                URL.revokeObjectURL(url); // 메모리 정리
            };
            (document.head || document.documentElement).appendChild(script);
        } catch (e) {
            // 위 방식이 막힐 경우를 대비한 2차 침투 (직접 주입)
            const s = document.createElement('script');
            s.src = 'https://cdn.jsdelivr.net/npm/eruda';
            s.onload = initEruda;
            (document.head || document.documentElement).appendChild(s);
        }
    }

    function initEruda() {
        if (!window.eruda) return;
        eruda.init();
        
        // 소스 복사 기능 추가
        if (!eruda.get('copy')) {
            eruda.add(new (eruda.Tool.extend({
                name: 'copy',
                init: function($el) {
                    this.callSuper(eruda.Tool, 'init', arguments);
                    $el.html('<div style="padding:20px;"><button id="c-btn" style="width:100%;padding:20px;background:#007AFF;color:#fff;border:none;border-radius:12px;font-weight:bold;font-size:18px;">📄 전체 소스 복사</button></div>');
                    $el.find('#c-btn').on('click', () => {
                        const html = document.documentElement.outerHTML;
                        navigator.clipboard.writeText(html).then(() => alert('복사 완료!')).catch(() => {
                            const t = document.createElement("textarea"); t.value = html; document.body.appendChild(t); t.select(); document.execCommand('copy'); document.body.removeChild(t); alert('복사 완료!');
                        });
                    });
                }
            })));
        }
    }

    // 네이버 블로그 글 이동 시 버튼 사라짐 방지 (무한 생존 로직)
    function checkEruda() {
        if (!document.querySelector('.eruda-container')) {
            if (typeof eruda === 'undefined') {
                loadEruda();
            } else {
                initEruda();
            }
        }
    }

    // 실행 및 감시
    checkEruda();
    setInterval(checkEruda, 2000);
})();
