// ==UserScript==
// @name         Mobile DevTools (Eruda) - Stable Version
// @version      1.2
// @description  네이버 블로그 등 보안 사이트에서도 작동하도록 개선된 Eruda
// @match        *://*/*
// @require      https://cdn.jsdelivr.net/npm/eruda
// @run-at       document-end
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    // 1. Eruda 초기화 (이미 @require로 불러왔으므로 바로 실행 가능)
    if (typeof eruda !== 'undefined') {
        initEruda();
    } else {
        // 만약 require가 실패했을 경우를 대비한 대체 로드 방식
        var script = document.createElement('script');
        script.src = "https://cdn.jsdelivr.net/npm/eruda";
        document.body.appendChild(script);
        script.onload = function () {
            initEruda();
        };
    }

    function initEruda() {
        eruda.init();

        // 2. Eruda 안에 'Copy' 탭 새로 만들기
        var CopyTool = eruda.Tool.extend({
            name: 'copy', // 탭 이름
            init: function ($el) {
                this.callSuper(eruda.Tool, 'init', arguments);
                
                $el.html(`
                    <div style="padding: 20px; display: flex; height: 100%; align-items: center; justify-content: center; background: #f4f4f4;">
                        <button id="eruda-copy-btn" style="width: 100%; max-width: 300px; padding: 20px; background: #007AFF; color: #fff; border: none; border-radius: 12px; font-size: 18px; font-weight: bold; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                            📄 전체 소스 복사하기
                        </button>
                    </div>
                `);
                
                $el.find('#eruda-copy-btn').on('click', function() {
                    var htmlContent = document.documentElement.outerHTML;
                    
                    // 최신 방식의 복사 API 사용 시도
                    if (navigator.clipboard && navigator.clipboard.writeText) {
                        navigator.clipboard.writeText(htmlContent).then(function() {
                            alert('전체 소스가 복사되었습니다!');
                        }).catch(function(err) {
                            fallbackCopy(htmlContent);
                        });
                    } else {
                        fallbackCopy(htmlContent);
                    }
                });
            }
        });

        function fallbackCopy(text) {
            var ta = document.createElement("textarea");
            ta.value = text;
            ta.style.position = "fixed";
            ta.style.opacity = "0";
            document.body.appendChild(ta);
            ta.focus();
            ta.select();
            try {
                document.execCommand('copy');
                alert('전체 소스가 복사되었습니다! (Fallback)');
            } catch (err) {
                alert('복사 실패: ' + err);
            }
            document.body.removeChild(ta);
        }
        
        eruda.add(new CopyTool());
    }
})();
