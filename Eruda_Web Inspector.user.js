// ==UserScript==
// @name         Mobile DevTools (Eruda)
// @version      1.7
// @match        *://*/*
// @require      https://cdn.jsdelivr.net/npm/eruda
// @run-at       document-idle
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Eruda 초기화 함수
    function startEruda() {
        if (typeof eruda === 'undefined') return;
        
        // 이미 실행 중이면 중복 실행 방지
        if (document.getElementById('eruda')) {
            if (!window.eruda._isInit) eruda.init();
            return;
        }

        eruda.init();

        // 전체 소스 복사 기능 추가
        if (!eruda.get('copy')) {
            eruda.add(new (eruda.Tool.extend({
                name: 'copy',
                init: function($el) {
                    this.callSuper(eruda.Tool, 'init', arguments);
                    $el.html('<div style="padding:20px;"><button id="eb" style="width:100%;padding:20px;background:#007AFF;color:#fff;border:none;border-radius:12px;font-weight:bold;">📄 전체 소스 복사</button></div>');
                    $el.find('#eb').on('click', () => {
                        const s = document.documentElement.outerHTML;
                        if (navigator.clipboard) {
                            navigator.clipboard.writeText(s).then(() => alert('복사완료'));
                        } else {
                            const t = document.createElement("textarea");
                            t.value = s; document.body.appendChild(t);
                            t.select(); document.execCommand('copy');
                            document.body.removeChild(t);
                            alert('복사완료(구형)');
                        }
                    });
                }
            })));
        }
    }

    // 1. 최초 실행
    startEruda();

    // 2. 네이버 블로그 등 페이지 전환(SPA) 대응
    // 화면에서 Eruda 버튼이 사라졌는지 2초마다 체크해서 다시 살려냄
    setInterval(() => {
        if (!document.querySelector('.eruda-container')) {
            startEruda();
        }
    }, 2000);
})();
