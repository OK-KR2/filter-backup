// ==UserScript==
// @name         Mobile DevTools (Eruda)
// @version      1.4
// @match        *://*/*
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';

    // 중복 실행 방지
    if (window.eruda) return;

    // Eruda 라이브러리를 직접 삽입 (메타데이터 의존성 제거)
    const script = document.createElement('script');
    script.src = "https://cdn.jsdelivr.net/npm/eruda";
    
    script.onload = function() {
        eruda.init();
        
        // 복사 도구 추가
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
                    
                    // 클립보드 API 시도
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
    };

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

    // 문서 시작 시점에 스크립트 주입
    (document.head || document.documentElement).appendChild(script);
})();
