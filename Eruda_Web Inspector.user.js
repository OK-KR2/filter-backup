// ==UserScript==
// @name         Mobile Custom Debugger (Sync Copy) - YouTube Fix
// @version      8.2
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
        ta.setAttribute('readonly', ''); 
        ta.style.position = "absolute";
        ta.style.left = "-9999px";
        document.body.appendChild(ta);
        
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
            showManualCopyModal(text);
        }
        document.body.removeChild(ta);
    }

    // [최후의 수단] innerHTML 없이 DOM으로만 모달 조립 (유튜브 보안 우회)
    function showManualCopyModal(text) {
        if (document.getElementById('manual-copy-modal')) return;
        
        const modal = document.createElement('div');
        modal.id = 'manual-copy-modal';
        modal.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.9); z-index:2147483647; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:20px; box-sizing:border-box;';
        
        const p = document.createElement('p');
        p.textContent = '자동 복사 차단됨. 아래 텍스트를 직접 전체 복사하세요.';
        p.style.cssText = 'color:white; font-size:16px; margin-bottom:10px; font-weight:bold;';
        
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.cssText = 'width:100%; height:70%; border-radius:10px; padding:10px; font-size:12px;';
        
        const btn = document.createElement('button');
        btn.textContent = '닫기';
        btn.style.cssText = 'margin-top:15px; padding:10px 20px; background:#e06c75; color:white; border:none; border-radius:8px; font-size:16px; font-weight:bold; cursor:pointer;';
        btn.onclick = () => document.body.removeChild(modal);
        
        modal.appendChild(p);
        modal.appendChild(ta);
        modal.appendChild(btn);
        document.body.appendChild(modal);
    }

    // 3. 버튼 생성 (innerHTML 없이 순수 DOM 요소로만 조립)
    function createButton() {
        if (document.getElementById('custom-debug-btn')) return;
        if (!document.body) return;

        const btnContainer = document.createElement('div');
        btnContainer.id = 'custom-debug-btn';
        
        const actualBtn = document.createElement('div');
        actualBtn.style.cssText = `
            position: fixed; bottom: 25px; right: 25px; width: 55px; height: 55px;
            background: rgba(40, 44, 52, 0.9); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
            color: #e06c75; border-radius: 50%; box-shadow: 0 8px 20px rgba(0, 0, 0, 0.4);
            display: flex; justify-content: center; align-items: center;
            z-index: 2147483647; cursor: pointer; border: 2px solid #e06c75;
        `;
        
        // SVG는 namespace를 지정해줘야 렌더링됨
        const svgNS = "http://www.w3.org/2000/svg";
        const svg = document.createElementNS(svgNS, "svg");
        svg.setAttribute("width", "24"); svg.setAttribute("height", "24");
        svg.setAttribute("viewBox", "0 0 24 24"); svg.setAttribute("fill", "none");
        svg.setAttribute("stroke", "currentColor"); svg.setAttribute("stroke-width", "2");
        svg.setAttribute("stroke-linecap", "round"); svg.setAttribute("stroke-linejoin", "round");

        const rect = document.createElementNS(svgNS, "rect");
        rect.setAttribute("x", "8"); rect.setAttribute("y", "6");
        rect.setAttribute("width", "8"); rect.setAttribute("height", "14"); rect.setAttribute("rx", "4");
        svg.appendChild(rect);

        const paths = ["M12 2v4", "M6 10h2", "M16 10h2", "M6 14h2", "M16 14h2", "M6 18h2", "M16 18h2"];
        paths.forEach(d => {
            const path = document.createElementNS(svgNS, "path");
            path.setAttribute("d", d);
            svg.appendChild(path);
        });

        actualBtn.appendChild(svg);
        btnContainer.appendChild(actualBtn);
        
        actualBtn.addEventListener('touchend', (e) => { e.preventDefault(); exportDebugData(); });
        actualBtn.addEventListener('click', (e) => { e.preventDefault(); exportDebugData(); });

        document.body.appendChild(btnContainer);
    }

    // 4. 네이버 블로그 무한 부활 방어
    setInterval(createButton, 1000);
})();
