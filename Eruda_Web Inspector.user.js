// ==UserScript==
// @name        Mobile DevTools (Eruda)
// @version     1.2
// @description 모바일 사파리 Eruda 실행 및 전체 소스 복사 기능 추가
// @match       *://*/*
// @grant       none
// ==/UserScript==

(function () {
    var script = document.createElement('script');
    script.src = "//cdn.jsdelivr.net/npm/eruda"; 
    document.body.appendChild(script);
    script.onload = function () {
        // 1. 오리지널 Eruda 실행
        eruda.init();

        // 2. Eruda 안에 'Copy' 탭 새로 만들기
        var CopyTool = eruda.Tool.extend({
            name: 'copy', // 탭 이름
            init: function ($el) {
                this.callSuper(eruda.Tool, 'init', arguments);
                
                // 탭 안에 들어갈 큰 버튼 디자인
                $el.html('<div style="padding: 20px; display: flex; height: 100%; align-items: center; justify-content: center; background: #f4f4f4;"><button id="eruda-copy-btn" style="width: 100%; max-width: 300px; padding: 20px; background: #007AFF; color: #fff; border: none; border-radius: 12px; font-size: 18px; font-weight: bold; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">📄 전체 소스 복사하기</button></div>');
                
                // 버튼 눌렀을 때 복사 작동
                $el.find('#eruda-copy-btn').on('click', function() {
                    var htmlContent = document.documentElement.outerHTML;
                    var ta = document.createElement("textarea");
                    ta.value = htmlContent;
                    ta.style.cssText = "position:absolute; top:-9999px;";
                    document.body.appendChild(ta);
                    ta.focus();
                    ta.select();
                    try {
                        document.execCommand('copy');
                        alert('전체 소스가 깔끔하게 복사되었습니다!');
                    } catch (err) {
                        alert('복사 실패;; 콘솔을 확인해주세요.');
                    }
                    document.body.removeChild(ta);
                });
            }
        });
        
        // 만든 탭을 Eruda에 꽂아넣기
        eruda.add(new CopyTool());
    };
})();
