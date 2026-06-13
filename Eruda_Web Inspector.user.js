// ==UserScript==
// @name         Mobile Custom Debugger (Sync Copy) - Advanced Pro
// @version      9.2
// @match        *://*/*
// @run-at       document-start
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // 1. 에러 및 로그 수집기 (console.clear 방어 추가)
    const logs = [];
    function addLog(type, args) {
        try {
            const msg = Array.from(args).map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ');
            logs.push(`[${type}] ${msg}`);
            if(logs.length > 200) logs.shift(); // 로그 보관량 증가
        } catch(e) {}
    }

    const oLog = console.log, oWarn = console.warn, oErr = console.error, oClear = console.clear;
    console.log = function() { addLog('LOG', arguments); oLog.apply(console, arguments); };
    console.warn = function() { addLog('WARN', arguments); oWarn.apply(console, arguments); };
    console.error = function() { addLog('ERROR', arguments); oErr.apply(console, arguments); };
    
    // 대상 사이트가 강제로 콘솔을 지우는 것을 방지
    console.clear = function() { addLog('SYS', ['console.clear() call intercepted']); };

    // 대상 사이트의 DisableDevtool 라이브러리 실행 무력화 (사전 차단)
    try {
        Object.defineProperty(window, 'DisableDevtool', {
            value: function() { console.log('[SYS] DisableDevtool execution blocked.'); },
            writable: false,
            configurable: false
        });
    } catch(e) {}

    window.addEventListener('error', function(e) { logs.push(`[SYS_ERR] ${e.message} at ${e.filename}:${e.lineno}`); });
    window.addEventListener('unhandledrejection', function(e) { logs.push(`[PROMISE_ERR] ${e.reason}`); });

    // 2. 자체 Toast 알림 UI (alert 대체)
    let shadowRoot = null;
    function showToast(message, isError = false) {
        if (!shadowRoot) return;
        
        const toast = document.createElement('div');
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed; bottom: 90px; right: 25px;
            background: ${isError ? '#e06c75' : '#98c379'}; color: #282c34;
            padding: 10px 16px; border-radius: 8px; font-size: 14px; font-weight: bold;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3); z-index: 2147483647;
            opacity: 0; transform: translateY(10px); transition: all 0.3s ease;
            pointer-events: none;
        `;
        
        shadowRoot.appendChild(toast);
        
        // 애니메이션 효과
        requestAnimationFrame(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateY(0)';
        });

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(10px)';
            setTimeout(() => { if(toast.parentNode) toast.parentNode.removeChild(toast); }, 300);
        }, 2500);
    }

    // 3. 리포트 생성
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
                .then(() => showToast('✅ 리포트 복사 완료!'))
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
                showToast('✅ 리포트 복사 완료 (구형)');
            } else {
                throw new Error('Copy command failed');
            }
        } catch (err) {
            showManualCopyModal(text);
        }
        document.body.removeChild(ta);
    }

    // 4. 수동 복사 모달 (순수 DOM)
    function showManualCopyModal(text) {
        if (!shadowRoot || shadowRoot.getElementById('manual-copy-modal')) return;
        
        const modal = document.createElement('div');
        modal.id = 'manual-copy-modal';
        modal.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.9); z-index:2147483647; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:20px; box-sizing:border-box;';
        
        const p = document.createElement('p');
        p.textContent = '자동 복사 차단됨. 아래 텍스트를 복사하세요.';
        p.style.cssText = 'color:white; font-size:16px; margin-bottom:10px; font-weight:bold;';
        
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.cssText = 'width:100%; height:70%; border-radius:10px; padding:10px; font-size:12px; background:#fff; color:#000; outline:none;';
        
        const btn = document.createElement('button');
        btn.textContent = '닫기';
        btn.style.cssText = 'margin-top:15px; padding:10px 20px; background:#e06c75; color:white; border:none; border-radius:8px; font-size:16px; font-weight:bold; cursor:pointer;';
        btn.onclick = () => shadowRoot.removeChild(modal);
        
        modal.appendChild(p);
        modal.appendChild(ta);
        modal.appendChild(btn);
        shadowRoot.appendChild(modal);
    }

    // 5. Shadow DOM을 활용한 버튼 생성 (사이트 간섭 차단)
    function createButton() {
        if (document.getElementById('custom-debug-host')) return;
        if (!document.body) return;

        // Shadow Host 컨테이너
        const host = document.createElement('div');
        host.id = 'custom-debug-host';
        host.style.cssText = 'position: fixed; z-index: 2147483647; bottom: 0; right: 0; width: 0; height: 0; overflow: visible;';
        document.body.appendChild(host);

        // Shadow Root 생성 (closed로 설정해 외부 스크립트 접근 최소화)
        shadowRoot = host.attachShadow({ mode: 'closed' });
        
        const actualBtn = document.createElement('div');
        actualBtn.style.cssText = `
            position: absolute; bottom: 25px; right: 25px; width: 55px; height: 55px;
            background: rgba(40, 44, 52, 0.9); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
            color: #e06c75; border-radius: 50%; box-shadow: 0 8px 20px rgba(0, 0, 0, 0.4);
            display: flex; justify-content: center; align-items: center;
            cursor: pointer; border: 2px solid #e06c75;
        `;
        
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
        shadowRoot.appendChild(actualBtn);
        
        actualBtn.addEventListener('touchend', (e) => { e.preventDefault(); exportDebugData(); });
        actualBtn.addEventListener('click', (e) => { e.preventDefault(); exportDebugData(); });
    }

    // 6. 감시 및 복구 사이클
    setInterval(createButton, 1000);
})();
