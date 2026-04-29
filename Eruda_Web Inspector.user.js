// ==UserScript==
// @name         Mobile Custom Debugger (Source + Errors)
// @version      8.0
// @match        *://*/*
// @run-at       document-start
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // 1. 에러 및 로그 수집기 (페이지 켜질 때부터 몰래 기록 시작)
    const logs = [];
    function addLog(type, args) {
        try {
            const msg = Array.from(args).map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ');
            logs.push(`[${type}] ${msg}`);
            // 메모리 폭발 방지: 최근 로그 100개만 유지
            if(logs.length > 100) logs.shift();
        } catch(e) {}
    }

    // 기존 콘솔 기능 가로채기 (네이버에서 몰래 뿜는 에러들을 다 주워담음)
    const oLog = console.log, oWarn = console.warn, oErr = console.error;
    console.log = function() { addLog('LOG', arguments); oLog.apply(console, arguments); };
    console.warn = function() { addLog('WARN', arguments); oWarn.apply(console, arguments); };
    console.error = function() { addLog('ERROR', arguments); oErr.apply(console, arguments); };

    // 시스템 치명적 에러 가로채기
    window.addEventListener('error', function(e) {
        logs.push(`[SYS_ERR] ${e.message} at ${e.filename}:${e.lineno}`);
    });
    window.addEventListener('unhandledrejection', function(e) {
        logs.push(`[PROMISE_ERR] ${e.reason}`);
    });

    // 2. 리포트 생성 및 복사 기능
    function exportDebugData() {
        const html = document.documentElement.outerHTML;
        
        // 저(AI)한테 바로 복붙하기 좋게 리포트 형식으로 포장
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
                .then(() => alert('✅ 디버그 리포트(소스+에러) 복사 완료!'))
                .catch(() => fallbackCopy(debugReport));
        } else {
            fallbackCopy(debugReport);
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
            alert('✅ 디버그 리포트(소스+에러) 복사 완료! (구형)');
        } catch (err) {
            alert('❌ 복사 실패');
        }
        document.body.removeChild(ta);
    }

    // 3. 추출 버튼 생성 (디버그 느낌 나게 검정/빨강 테마 + 벌레 아이콘)
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
                transition: transform 0.1s ease;
                border: 2px solid #e06c75;
            ">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="8" y="6" width="8" height="14" rx="4"></rect>
                    <path d="M12 2v4"></path>
                    <path d="M6 10h2"></path>
                    <path d="M16 10h2"></path>
                    <path d="M6 14h2"></path>
                    <path d="M16 14h2"></path>
                    <path d="M6 18h2"></path>
                    <path d="M16 18h2"></path>
                </svg>
            </div>
        `;
        
        const actualBtn = btnContainer.firstElementChild;
        
        actualBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            actualBtn.style.transform = 'scale(0.85)';
            setTimeout(() => {
                actualBtn.style.transform = 'scale(1)';
                exportDebugData();
            }, 150);
        }, { passive: false });

        actualBtn.addEventListener('click', (e) => {
            e.preventDefault();
            exportDebugData();
        });

        document.body.appendChild(btnContainer);
    }

    // 4. 네이버 블로그 방어막 뚫기 (1초마다 버튼 유지)
    setInterval(createButton, 1000);
})();
