// ==UserScript==
// @name         Mobile DevTools (Eruda) - SPA 대응
// @version      1.5
// @match        *://*/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function() {
    'use strict';

    function injectEruda() {
        // 이미 화면에 Eruda 버튼이 존재하면 중복 실행 방지
        if (document.getElementById('eruda')) return;

        // Eruda 라이브러리가 없다면 새로 다운로드
        if (typeof eruda === 'undefined') {
            const script = document.createElement('script');
            script.src = "https://cdn.jsdelivr.net/npm/eruda";
            script.onload = () => initEruda();
            document.head.appendChild(script);
        } else {
            // 이미 다운로드 되어있다면 바로 실행
            initEruda();
        }
    }

    function initEruda() {
        if (!window.eruda) return;
        
        // 페이지 이동으로 Eruda 버튼 껍데기만 날아갔을 경우, 내부 설정 초기화
        if (window.eruda._isInit) {
            try { window.eruda.destroy(); } catch(e){}
        }

        eruda.init();
        
        // 플러그인(복사 탭) 중복 생성 방지
        if (!eruda.get('copy')) {
            eruda.add(new (eruda.Tool.extend({
                name: 'copy',
                init: function($el) {
                    this.callSuper(eruda.Tool, 'init', arguments);
                    $el.html(`
                        <div style="padding: 20px; text-align: center; background: #f4f4f4; height: 100%;">
                            <button id="eruda-copy-btn" style="width: 100%; max-width: 300px; padding: 20px; background: #007AFF; color: #fff; border: none; border-radius: 12px; font-size: 18px; font-weight: bold; cursor: pointer;">
                                📄 전체 소스 복사하기
                            </button>
                        </div>
                    `);
                    
                    $el.find('#eruda-copy-btn').on('click', function() {
                        const htmlContent = document.documentElement.outerHTML;
                        
                        if (navigator.clipboard && navigator.clipboard.writeText) {
                            navigator.clipboard.writeText(htmlContent)
                                .then(() => alert('전체 소스가 복사되었습니다.'))
                                .catch(() => fallbackCopy(htmlContent));
                        } else {
                            fallbackCopy(htmlContent);
                        }
                    });
                }
            })));
        }
    }

    function fallbackCopy(text) {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        try {
            document.execCommand('copy');
            alert('전체 소스가 복사되었습니다. (구형 방식)');
        } catch (err) {
            alert('복사 실패: ' + err);
        }
        document.body.removeChild(ta);
    }

    // 1. 페이지 접속 시 최초 1회 실행
    injectEruda();

    // 2. SPA 동적 라우팅 방어 (네이버 블로그 등)
    // 1.5초(1500ms)마다 확인해서 Eruda 버튼이 화면에서 지워졌으면 다시 생성
    setInterval(() => {
        if (!document.getElementById('eruda')) {
            injectEruda();
        }
    }, 1500);

})();
