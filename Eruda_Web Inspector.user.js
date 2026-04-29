// ==UserScript==
// @name         Mobile DevTools (Eruda)
// @version      1.3
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // 중복 실행 방지
    if (window.eruda) return;

    // Eruda 스크립트 강제 주입 (가장 확실한 로드 방식)
    const script = document.createElement('script');
    script.src = "https://cdn.jsdelivr.net/npm/eruda";
    script.onload = function() {
        // 라이브러리 로드가 완료된 후 초기화
        eruda.init();
        
        // 복사 도구 추가
        eruda.add(new (eruda.Tool.extend({
            name: 'copy',
            init: function($el) {
                this.callSuper(eruda.Tool, 'init', arguments);
                $el.html(`
                    <div style="padding: 20px; display: flex; justify-content: center;">
                        <button id="eruda-copy-btn" style="width: 100%; padding: 15px; background: #007AFF; color: #fff; border: none; border-radius: 10px; font-size: 16px; font-weight: bold;">
                            📄 전체 소스 복사하기
                        </button>
                    </div>
                `);
                
                $el.find('#eruda-copy-btn').on('click', function() {
                    const htmlContent = document.documentElement.outerHTML;
                    if (navigator.clipboard && navigator.clipboard.writeText) {
                        navigator.clipboard.writeText(htmlContent).then(() => alert('복사되었습니다.'));
                    } else {
                        const ta = document.createElement("textarea");
                        ta.value = htmlContent;
                        document.body.appendChild(ta);
                        ta.select();
                        document.execCommand('copy');
                        document.body.removeChild(ta);
                        alert('복사되었습니다. (구형 방식)');
                    }
                });
            }
        })));
    };
    
    // head가 없으면 documentElement에 추가
    (document.head || document.documentElement).appendChild(script);
})();
