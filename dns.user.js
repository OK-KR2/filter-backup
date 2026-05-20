// ==UserScript==
// @name         나의 GitHub DNS 필터 사파리 주입기
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  GitHub에 올려둔 new-dns 필터를 사파리 내부 엔진에 동적 주입합니다.
// @author       User
// @match        *://*/*
// @run-at       document-start
// @grant        GM_xmlhttpRequest
// @connect      raw.githubusercontent.com
// ==/UserScript==

(function() {
    'use strict';

    // 질문자님의 깃허브 필터 주소 로드
    const filterUrl = "https://raw.githubusercontent.com/OK-KR2/filter-backup/refs/heads/main/new-dns";

    // 사파리가 웹사이트를 열 때 백그라운드에서 깃허브 필터를 읽어와 매칭하는 자바스크립트 로직
    GM_xmlhttpRequest({
        method: "GET",
        url: filterUrl,
        onload: function(response) {
            const rules = response.responseText.split('\n');
            const currentHost = window.location.hostname;

            // 간단한 도메인 매칭 예시 (필터 규칙 중 현재 사이트나 관련 도메인이 있으면 차단/경고)
            rules.forEach(rule => {
                if (rule.trim() && !rule.startsWith('!') && !rule.startsWith('[')) {
                    // 기호 정제 (||, ^ 등 제거 후 순수 도메인 추출)
                    let cleanRule = rule.replace('||', '').replace('^', '').trim();
                    if (currentHost.includes(cleanRule) && cleanRule !== '') {
                        console.log("[나의 필터] 차단된 도메인 발견:", cleanRule);
                        window.stop(); // 사파리 로딩 강제 중단
                        document.documentElement.innerHTML = `<div style="text-align:center; margin-top:100px;"><h2>나의 깃허브 DNS 필터에 의해 차단된 사이트입니다.</h2><p>${cleanRule}</p></div>`;
                    }
                }
            });
        }
    });
})();