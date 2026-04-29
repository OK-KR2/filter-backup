// ==UserScript==
// @name         Mobile DevTools (Eruda) - 완벽 대응
// @version      1.8
// @match        *://*/*
// @require      https://cdn.jsdelivr.net/npm/eruda
// @run-at       document-idle
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    let myContainer = null;

    function initMyEruda() {
        // 이미 화면에 정상적으로 띄워져 있으면 무시
        if (document.querySelector('.eruda-container')) {
            return;
        }

        // 기존에 고장난 Eruda가 남아있다면 흔적을 완전히 삭제 (이게 핵심)
        if (window.eruda && window.eruda._isInit) {
            try { eruda.destroy(); } catch(e) {}
        }

        // Eruda가 담길 새로운 박스(컨테이너) 생성
        myContainer = document.createElement('div');
        document.body.appendChild(myContainer);

        // 새 박스 안에 Eruda 실행
        eruda.init({
            container: myContainer
        });

        // 복사 버튼 추가
        if (!eruda.get('copy')) {
            eruda.add(new (eruda.Tool.extend({
                name: 'copy',
                init: function($el) {
                    this.callSuper(eruda.Tool, 'init', arguments);
                    $el.html(`
                        <div style="padding: 20px; display: flex; justify-content: center; background: #f4f4f4; height: 100%;">
                            <button id="eruda-copy-btn" style="width: 100%; max-width: 300px; padding: 15px; background: #007AFF; color: #fff; border: none; border-radius: 10px; font-size: 16px; font-weight: bold; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                                📄 전체 소스 복사하기
                            </button>
                        </div>
                    `);
                    
                    $el.find('#eruda-copy-btn').on('click', function() {
                        const text = document.documentElement.outerHTML;
                        if (navigator.clipboard && navigator.clipboard.writeText) {
                            navigator.clipboard.writeText(text).then(() => alert('복사 완료!')).catch(() => fallback(text));
                        } else {
                            fallback(text);
                        }
                    });
                }
            })));
        }
    }

    function fallback(text) {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed"; ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select(); document.execCommand('copy');
        document.body.removeChild(ta);
        alert('복사 완료! (구형)');
    }

    // 1. 최초 실행
    initMyEruda();

    // 2. 1.5초마다 감시해서 네이버 블로그가 화면을 갈아치우면 좀비처럼 다시 생성
    setInterval(() => {
        if (!document.querySelector('.eruda-container')) {
            initMyEruda();
        }
    }, 1500);

})();
