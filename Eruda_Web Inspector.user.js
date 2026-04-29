// ==UserScript==
// @name         Mobile DevTools (Eruda & Copy) - CSP Bypass
// @version      2.0
// @match        *://*/*
// @require      https://cdn.jsdelivr.net/npm/eruda
// @run-at       document-end
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // 1. 전체 소스 복사 기능 (공통)
    function copySource() {
        const htmlContent = document.documentElement.outerHTML;
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(htmlContent)
                .then(() => alert('✅ 전체 소스가 복사되었습니다!'))
                .catch(() => fallbackCopy(htmlContent));
        } else {
            fallbackCopy(htmlContent);
        }
    }

    function fallbackCopy(text) {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed"; ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        try {
            document.execCommand('copy');
            alert('✅ 전체 소스가 복사되었습니다! (구형 방식)');
        } catch (err) {
            alert('❌ 복사 실패: ' + err);
        }
        document.body.removeChild(ta);
    }

    // 2. Eruda 실행 (보안이 약한 일반 사이트 / 블로그 목록용)
    function initEruda() {
        try {
            if (!document.getElementById('eruda')) {
                eruda.init();
            }
            if (!eruda.get('copy')) {
                eruda.add(new (eruda.Tool.extend({
                    name: 'copy',
                    init: function($el) {
                        this.callSuper(eruda.Tool, 'init', arguments);
                        $el.html('<div style="padding:20px;text-align:center;height:100%;background:#f4f4f4;"><button id="btn-copy" style="width:100%;max-width:300px;padding:15px;background:#007AFF;color:#fff;border:none;border-radius:12px;font-weight:bold;font-size:16px;cursor:pointer;">📄 전체 소스 복사하기</button></div>');
                        $el.find('#btn-copy').on('click', copySource);
                    }
                })));
            }
        } catch(e) {}
    }

    // 3. 네이티브 플로팅 버튼 (보안이 빡센 블로그 내부 글 우회용)
    function initNativeButton() {
        if (document.getElementById('csp-bypass-btn')) return;

        const btn = document.createElement('button');
        btn.id = 'csp-bypass-btn';
        btn.innerHTML = '📄<br>소스<br>복사';
        btn.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 60px;
            height: 60px;
            background-color: #007AFF;
            color: white;
            border: none;
            border-radius: 30px;
            font-size: 13px;
            font-weight: bold;
            box-shadow: 0 4px 10px rgba(0,0,0,0.3);
            z-index: 2147483647;
            cursor: pointer;
            line-height: 1.2;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
        `;
        btn.onclick = copySource;
        // 네이버가 body를 날려버려도 살아남도록 최상단 요소에 부착
        (document.documentElement || document.body).appendChild(btn);
    }

    // 4. 무한 감시자 (1초마다 체크하여 방어)
    setInterval(() => {
        // Eruda가 정상적으로 로드되었다면 Eruda를 띄움
        if (typeof eruda !== 'undefined') {
            initEruda();
        } else {
            // 네이버 보안에 막혀 Eruda가 죽었다면 자체 버튼을 띄움
            initNativeButton();
        }
    }, 1000);

})();
