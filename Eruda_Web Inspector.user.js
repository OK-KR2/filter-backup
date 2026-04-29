// ==UserScript==
// @name         Mobile DevTools (Eruda) - The End
// @version      6.0
// @match        *://*/*
// @grant        GM_xmlhttpRequest
// @connect      cdn.jsdelivr.net
// @run-at       document-idle
// ==/UserScript==

(function() {
    'use strict';
    if (window.eruda) return;

    let isInjecting = false;

    // Eruda 강제 주입 로직
    function injectEruda() {
        if (isInjecting || window.eruda || document.getElementById('eruda-script')) return;
        isInjecting = true;

        // [1차 시도] 일반적인 방식 (보안이 약한 일반 사이트 및 블로그 목록용)
        const script = document.createElement('script');
        script.id = 'eruda-script';
        script.src = 'https://cdn.jsdelivr.net/npm/eruda';

        script.onload = () => {
            isInjecting = false;
            initEruda(); // 성공 시 바로 실행
        };

        // 🔥 [2차 시도] 일반 방식이 네이버 보안(CSP)에 막혀서 에러가 났을 때!
        script.onerror = () => {
            script.remove(); // 막힌 껍데기 버림
            
            // 유저스크립트의 '초월 권한'을 이용해 백그라운드에서 코드를 훔쳐옴
            GM_xmlhttpRequest({
                method: 'GET',
                url: 'https://cdn.jsdelivr.net/npm/eruda',
                onload: function(response) {
                    // 훔쳐온 코드를 외부 링크가 아닌 '순수 텍스트'로 위장하여 페이지에 쑤셔 넣음
                    const inlineScript = document.createElement('script');
                    inlineScript.textContent = response.responseText;
                    (document.head || document.documentElement).appendChild(inlineScript);
                    
                    setTimeout(() => {
                        isInjecting = false;
                        initEruda();
                    }, 100);
                },
                onerror: function() {
                    isInjecting = false;
                }
            });
        };

        (document.head || document.documentElement).appendChild(script);
    }

    // Eruda 초기화 및 복사 버튼 세팅
    function initEruda() {
        if (!window.eruda) return;
        if (window.eruda._isInit) return; // 이미 실행된 찌꺼기 방어
        
        eruda.init();
        
        if (!eruda.get('copy')) {
            eruda.add(new (eruda.Tool.extend({
                name: 'copy',
                init: function($el) {
                    this.callSuper(eruda.Tool, 'init', arguments);
                    $el.html('<div style="padding:20px; height:100%; background:#f4f4f4; display:flex; align-items:center; justify-content:center;"><button id="c-btn" style="width:100%; max-width:300px; padding:20px; background:#007AFF; color:#fff; border:none; border-radius:12px; font-weight:bold; font-size:18px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">📄 전체 소스 복사</button></div>');
                    $el.find('#c-btn').on('click', () => {
                        const html = document.documentElement.outerHTML;
                        if(navigator.clipboard && navigator.clipboard.writeText){
                            navigator.clipboard.writeText(html).then(() => alert('✅ 전체 소스 복사 완료!')).catch(() => fallback(html));
                        } else {
                            fallback(html);
                        }
                    });
                }
            })));
        }
    }

    function fallback(html) {
        const t = document.createElement("textarea"); t.value = html; document.body.appendChild(t); t.select(); document.execCommand('copy'); document.body.removeChild(t); alert('✅ 전체 소스 복사 완료! (구형)');
    }

    // 1. 최초 실행
    injectEruda();

    // 2. 무한 감시 (네이버 블로그 내부 글 이동 시 튕기는 현상 방어)
    setInterval(() => {
        // 화면에 Eruda 버튼이 없고, 스크립트 자체가 날아갔으면 다시 1차 시도부터 진행
        if (!document.querySelector('.eruda-container') && !window.eruda) {
            injectEruda();
        } 
        // 화면에 버튼만 날아가고 스크립트는 살아있으면 바로 부활
        else if (!document.querySelector('.eruda-container') && window.eruda) {
            initEruda();
        }
    }, 1500);

})();
