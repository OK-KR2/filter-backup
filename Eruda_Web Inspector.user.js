// ==UserScript==
// @name         Mobile DevTools (Eruda) - CSP 우회 
// @version      1.6
// @match        *://*/*
// @grant        GM_xmlhttpRequest
// @connect      cdn.jsdelivr.net
// @run-at       document-idle
// ==/UserScript==

(function() {
    'use strict';

    function initEruda() {
        if (!window.eruda) return;
        
        // SPA 찌꺼기 초기화
        if (window.eruda._isInit) {
            try { window.eruda.destroy(); } catch(e){}
        }

        eruda.init();
        
        // 복사 탭 생성
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
        ta.style.position = "fixed"; ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select(); document.execCommand('copy');
        document.body.removeChild(ta);
        alert('전체 소스가 복사되었습니다. (구형)');
    }

    // 🔥 핵심: 네이버 보안 정책(CSP) 우회 함수
    function forceInjectEruda() {
        if (document.getElementById('eruda')) return; // 이미 있으면 패스

        if (window.eruda) {
            initEruda(); // 스크립트는 있는데 화면에서만 날아갔을 때
            return;
        }

        // 확장 프로그램 권한으로 외부 스크립트 텍스트를 몰래 다운로드
        GM_xmlhttpRequest({
            method: "GET",
            url: "https://cdn.jsdelivr.net/npm/eruda",
            onload: function(response) {
                // 다운받은 코드를 파일 링크가 아닌 '순수 텍스트'로 변환해서 강제 삽입 (차단 회피)
                const script = document.createElement('script');
                script.textContent = response.responseText; 
                document.documentElement.appendChild(script);
                
                setTimeout(initEruda, 100);
            }
        });
    }

    // 1. 페이지 접속 시 강제 주입 실행
    forceInjectEruda();

    // 2. 글을 이리저리 이동해서 튕겨나가도 1.5초마다 검사해서 다시 주입
    setInterval(() => {
        if (!document.getElementById('eruda')) {
            forceInjectEruda();
        }
    }, 1500);

})();
