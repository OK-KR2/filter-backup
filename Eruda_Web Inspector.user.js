// ==UserScript==
// @name         Mobile DevTools (Eruda) - 최종 복구본
// @version      1.9
// @match        *://*/*
// @require      https://cdn.jsdelivr.net/npm/eruda
// @run-at       document-end
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    if (typeof eruda === 'undefined') return;

    // 1. 절대 지워지지 않는 Eruda 전용 보호 상자 생성
    const erudaBox = document.createElement('div');
    erudaBox.id = 'super-eruda-box';
    erudaBox.style.cssText = 'position: fixed; z-index: 999999999;'; // 네이버 메뉴들에 안 가려지게 최상단 배치

    // 2. 상자 안에서 Eruda 초기화 (단 1번만 실행, 부수지 않음)
    eruda.init({
        container: erudaBox
    });

    // 3. 복사 버튼 추가
    if (!eruda.get('copy')) {
        eruda.add(new (eruda.Tool.extend({
            name: 'copy',
            init: function($el) {
                this.callSuper(eruda.Tool, 'init', arguments);
                $el.html(`
                    <div style="padding: 20px; text-align: center; background: #f4f4f4; height: 100%;">
                        <button id="eruda-copy-btn" style="width: 100%; max-width: 300px; padding: 20px; background: #007AFF; color: #fff; border: none; border-radius: 12px; font-size: 18px; font-weight: bold;">
                            📄 전체 소스 복사하기
                        </button>
                    </div>
                `);
                $el.find('#eruda-copy-btn').on('click', function() {
                    const htmlContent = document.documentElement.outerHTML;
                    if (navigator.clipboard && navigator.clipboard.writeText) {
                        navigator.clipboard.writeText(htmlContent).then(() => alert('복사 완료!')).catch(() => fallback(htmlContent));
                    } else {
                        fallback(htmlContent);
                    }
                });
            }
        })));
    }

    function fallback(text) {
        const ta = document.createElement("textarea");
        ta.value = text; document.body.appendChild(ta);
        ta.select(); document.execCommand('copy');
        document.body.removeChild(ta);
        alert('복사 완료! (구형)');
    }

    // 4. 네이버 블로그 화면 전환 완벽 방어
    function attachEruda() {
        if (!document.body) return;
        
        // 현재 화면(body)에 우리 상자가 안 붙어있다면?
        if (!document.body.contains(erudaBox)) {
            // 상자 파괴 없이 그대로 새 화면에 다시 붙임
            document.body.appendChild(erudaBox);
        }
    }

    // 최초 1회 붙이기
    attachEruda();

    // 1초마다 감시: 이제 부수고 새로 만들지 않으므로, 창이 닫히거나 깜빡거리는 현상 0%
    setInterval(attachEruda, 1000);
})();
