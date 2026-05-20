// ==UserScript==
// @name         AdGuard DNS 보조 코스메틱 필터 (공백 및 배너 제거)
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  DNS 차단 후 남은 모바일 광고 배너 공백 및 사용자 필터를 CSS 주입 방식으로 정리합니다.
// @author       Gemini
// @match        *://*/*
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// @run-at       document-start
// @connect      raw.githubusercontent.com
// @connect      filters.adtidy.org
// ==/UserScript==

(function() {
    'use strict';

    // 1. 타겟 필터 주소 목록
    const FILTERS = [
        'https://raw.githubusercontent.com/OK-KR2/filter-backup/refs/heads/main/new-dns.txt',
        'https://filters.adtidy.org/ios/filters/11_optimized.txt',
        'https://filters.adtidy.org/ios/filters/20_optimized.txt'
    ];

    const CACHE_KEY = 'ag_cosmetic_selectors';
    const CACHE_TIME_KEY = 'ag_filters_last_update';
    const UPDATE_INTERVAL = 24 * 60 * 60 * 1000; // 업데이트 주기: 24시간

    const currentDomain = window.location.hostname;

    // 2. 필터 다운로드 및 파싱 함수
    async function updateFilters() {
        let allSelectors = { global: [], domainSpecific: {} };

        for (let url of FILTERS) {
            try {
                const res = await new Promise((resolve, reject) => {
                    GM_xmlhttpRequest({
                        method: 'GET',
                        url: url,
                        timeout: 10000,
                        onload: resolve,
                        onerror: reject
                    });
                });

                if (res.status === 200) {
                    parseAdguardRules(res.responseText, allSelectors);
                }
            } catch (e) {
                console.error(`[AdGuard 보조] 필터 다운로드 실패 (${url}):`, e);
            }
        }

        // 중복 제거로 메모리 최적화
        allSelectors.global = [...new Set(allSelectors.global)];
        for (let dom in allSelectors.domainSpecific) {
            allSelectors.domainSpecific[dom] = [...new Set(allSelectors.domainSpecific[dom])];
        }

        GM_setValue(CACHE_KEY, allSelectors);
        GM_setValue(CACHE_TIME_KEY, Date.now());
        return allSelectors;
    }

    // AdGuard 코스메틱 규칙(##)만 파싱하는 엔진
    function parseAdguardRules(text, allSelectors) {
        const lines = text.split('\n');
        lines.forEach(line => {
            line = line.trim();
            // 주석, 화이트리스트 규칙, 네트워크 규칙은 패스
            if (!line || line.startsWith('!') || line.startsWith('[') || line.includes('#@#')) return;

            // 코스메틱 규칙 (##) 존재 여부 확인
            if (line.includes('##')) {
                const parts = line.split('##');
                const domainPart = parts[0].trim();
                const selector = parts[1].trim();

                if (!selector || selector.includes(':style') || selector.includes(':has')) return; // 복잡한 확장 제어는 성능상 제외

                if (domainPart === '') {
                    // 모든 사이트 공통 적용 규칙 (글로벌 배너/공백 제거)
                    allSelectors.global.push(selector);
                } else {
                    // 특정 도메인 전용 규칙 (쉼표 분할 처리)
                    const domains = domainPart.split(',');
                    domains.forEach(d => {
                        d = d.trim();
                        if (d.startsWith('~')) return; // 예외 도메인은 스킵
                        if (!allSelectors.domainSpecific[d]) {
                            allSelectors.domainSpecific[d] = [];
                        }
                        allSelectors.domainSpecific[d].push(selector);
                    });
                }
            }
        });
    }

    // 3. 추출된 CSS 셀렉터들을 페이지에 즉시 주입
    function injectStyles(selectors) {
        if (!selectors || selectors.length === 0) return;
        
        // 요소 숨기기 및 여백 완전히 제거 (디스플레이 초기화)
        const css = selectors.join(', ') + ' { display: none !important; height: 0 !important; min-height: 0 !important; padding: 0 !important; margin: 0 !important; visibility: hidden !important; }';
        
        const style = document.createElement('style');
        style.type = 'text/css';
        style.innerHTML = css;
        
        // DOM이 생성되기 전 최상단 헤드에 가장 먼저 안착 유도
        if (document.head) {
            document.head.appendChild(style);
        } else {
            const observer = new MutationObserver(() => {
                if (document.head) {
                    document.head.appendChild(style);
                    observer.disconnect();
                }
            });
            observer.observe(document.documentElement, { childList: true });
        }
    }

    // 4. 메인 실행 컨트롤러
    async function main() {
        let selectors = GM_getValue(CACHE_KEY);
        const lastUpdate = GM_getValue(CACHE_TIME_KEY, 0);

        // 캐시가 없거나 24시간이 지났으면 백그라운드 업데이트 유도
        if (!selectors || (Date.now() - lastUpdate > UPDATE_INTERVAL)) {
            // 첫 실행 시에는 데이터가 없으므로 동기 처리, 이후엔 비동기 백그라운드 갱신
            if (!selectors) {
                selectors = await updateFilters();
            } else {
                updateFilters(); 
            }
        }

        if (selectors) {
            // 글로벌 규칙 기본 탑재
            let activeSelectors = [...selectors.global];
            
            // 서브도메인 매칭 처리 (예: sub.example.com 일 때 example.com 규칙도 포함)
            const domainParts = currentDomain.split('.');
            for (let i = 0; i < domainParts.length - 1; i++) {
                const testDomain = domainParts.slice(i).join('.');
                if (selectors.domainSpecific[testDomain]) {
                    activeSelectors.push(...selectors.domainSpecific[testDomain]);
                }
            }

            injectStyles(activeSelectors);
        }
    }

    main();
})();