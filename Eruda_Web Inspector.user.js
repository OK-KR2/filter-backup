// ==UserScript==
// @name         Mobile Custom Debugger (Sync Copy)
// @version      8.1
// @match        *://*/*
// @run-at       document-start
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // 1. 에러 및 로그 수집기
    const logs = [];
    function addLog(type, args) {
        try {
            const msg = Array.from(args).map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ');
            logs.push(`[${type}] ${msg}`);
            if(logs.length > 100) logs.shift();
        } catch(e) {}
    }

    const oLog = console.log, oWarn = console.warn, oErr = console.error;
    console.log = function() { addLog('LOG', arguments); oLog.apply(console, arguments); };
    console.warn = function() { addLog('WARN', arguments); oWarn.apply(console, arguments); };
    console.error = function() { addLog('ERROR', arguments); oErr.apply(console, arguments); };

    window.addEventListener('error', function(e) { logs.push(`[SYS_ERR] ${e.message} at ${e.filename}:${e.lineno}`); });
    window.addEventListener('unhandledrejection', function(e) { logs.push(`[PROMISE_ERR] ${e.reason}`); });

    // 2. 리포트 생성
    function exportDebugData() {
        const html = document.documentElement.outerHTML;
        const debugReport = `
=== [SITE INFO] ===
URL: ${location.href}
UA: ${navigator.userAgent}

=== [CONSOLE LOGS & ERRORS] ===
${logs.length > 0 ? logs.join('\n') : '기록된 에러가 없습니다.'}

=== [HTML SOURCE] ===
${html}
`;
        // 터치 즉시 동기적으로 실행 (아이폰 보안 우회)
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(debugReport)
                .then(() => alert('✅ 리포트가 클립보드에 복사되었습니다!'))
                .catch(() => fallbackCopy(debugReport));
        } else {
            fallbackCopy(debugReport);
        }
    }

    function fallbackCopy(text) {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.setAttribute('readonly', ''); // 아이폰 키보드 올라오는 것 방지
        ta.style.position = "absolute";
        ta.style.left = "-9999px";
        document.body.appendChild(ta);
        
        // 아이폰 전용 텍스트 선택 트릭
        ta.select();
        ta.setSelectionRange(0, 999999);
        
        try {
            const successful = document.execCommand('copy');
            if (successful) {
                alert('✅ 디버그 리포트 복사 완료! (구형)');
            } else {
                throw new Error('Copy command failed');
            }
        } catch (err) {
            // 사파리가 끝까지 막을 경우: 궁극의 수동 복사창 띄우기
            showManualCopyModal(text);
        }
        document.body.removeChild(ta);
    }

    // [최후의 수단] 화면에 강제로 텍스트창을 띄워버림
    function showManualCopyModal(text) {
        if (document.getElementById('manual-copy-modal')) return;
        const modal = document.createElement('div');
        modal.id = 'manual-copy-modal';
        modal.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.9); z-index:2147483647; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:20px; box-sizing:border-box;';
        
        modal.innerHTML = `
            <p style="color:white; font-size:16px; margin-bottom:10px; font-weight:bold;">자동 복사 차단됨. 아래 텍스트를 직접 전체 복사하세요.</p>
            <textarea style="width:100%; height:70%; border-radius:10px; padding:10px; font-size:12px;"></textarea>
            <button style="margin-top:15px; padding:10px 20px; background:#e06c75; color:white; border:none; border-radius:8px; font-size:16px; font-weight:bold; cursor:pointer;">닫기</button>
        `;
        
        modal.querySelector('textarea').value = text;
        modal.querySelector('button').onclick = () => document.body.removeChild(modal);
        document.body.appendChild(modal);
    }

    // 3. 버튼 생성
    function createButton() {
        if (document.getElementById('custom-debug-btn')) return;
        if (!document.body) return;

        const btnContainer = document.createElement('div');
        btnContainer.id = 'custom-debug-btn';
        
        btnContainer.innerHTML = `
            <div style="
                position: fixed;
                bottom: 25px;
                right: 25px;
                width: 55px;
                height: 55px;
                background: rgba(40, 44, 52, 0.9);
                backdrop-filter: blur(10px);
                -webkit-backdrop-filter: blur(10px);
                color: #e06c75;
                border-radius: 50%;
                box-shadow: 0 8px 20px rgba(0, 0, 0, 0.4);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 2147483647;
                cursor: pointer;
                border: 2px solid #e06c75;
            ">
                <svg width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\">
                    <rect x=\"8\" y=\"6\" width=\"8\" height=\"14\" rx=\"4\"></rect>
                    <path d=\"M12 2v4\"></path><path d=\"M6 10h2\"></path><path d=\"M16 10h2\"></path>
                    <path d=\"M6 14h2\"></path><path d=\"M16 14h2\"></path>
                    <path d=\"M6 18h2\"></path><path d=\"M16 18h2\"></path>
                </svg>
            </div>
        `;
        
        const actualBtn = btnContainer.firstElementChild;
        
        // 지연(애니메이션) 없이 즉시 실행
        actualBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            exportDebugData();
        });

        actualBtn.addEventListener('click', (e) => {
            e.preventDefault();
            exportDebugData();
        });

        document.body.appendChild(btnContainer);
    }

    // 4. 네이버 블로그 무한 부활 방어
    setInterval(createButton, 1000);
})();
