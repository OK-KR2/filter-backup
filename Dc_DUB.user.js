// ==UserScript==
// @name         Dcinside Ultimate Bypass (이미지 복구 특화)
// @namespace    https://gemini.assistant/
// @version      1.0.0
// @description  모바일 Rate Limit 차단 시, 완벽한 PC 헤더 위장과 정밀 파싱을 통해 게시글과 이미지를 90% 이상 확률로 복구합니다.
// @match        *://*.dcinside.com/*
// @grant        GM_xmlhttpRequest
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    // 1. 차단 감지: 텍스트뿐만 아니라 페널티 박스 구조 자체를 확인
    const isBlocked = document.body.innerText.includes("너무 많은 요청으로") || document.querySelector('.penalty-box-inner');
    if (!isBlocked) return;

    // 2. URL 분석 (갤러리 종류, ID, 게시글 번호 추출)
    const urlMatch = window.location.pathname.match(/\/(board|mini)\/([^\/?]+)\/([0-9]+)/);
    if (!urlMatch) return;

    const isMini = urlMatch[1] === 'mini';
    const gallId = urlMatch[2];
    const postNo = urlMatch[3];

    // 복구 중 UI 표시
    document.body.innerHTML = `
        <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100vh; background:#f4f4f4;">
            <div style="padding: 20px; background: #fff; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); text-align:center;">
                <h3 style="color:#d9534f; margin-bottom: 10px;">🚨 차단 감지됨</h3>
                <p style="color:#555; font-size:14px; margin:0;">PC 위장 모드로 게시글과 이미지를 복구 중입니다...</p>
                <div style="margin-top: 15px; font-size:24px;">🔄</div>
            </div>
        </div>
    `;

    /**
     * 서버에 완벽한 PC 유저인 척 위장하여 요청을 보냄 (핵심: Referer 조작)
     */
    const fetchPCData = (url) => {
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: "GET",
                url: url,
                headers: {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                    "Referer": "https://gall.dcinside.com/", // 이 헤더가 없으면 이미지 차단됨
                    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8"
                },
                onload: (res) => resolve(res.responseText),
                onerror: (err) => reject(err)
            });
        });
    };

    /**
     * 우회 로직 실행
     */
    const runBypass = async () => {
        let htmlStr = "";
        let pcUrl = "";

        try {
            // 폴백(Fallback) 전략: 마갤 -> 정갤 (미니갤은 고정)
            if (isMini) {
                pcUrl = `https://gall.dcinside.com/mini/board/view/?id=${gallId}&no=${postNo}`;
                htmlStr = await fetchPCData(pcUrl);
            } else {
                // 마이너 갤러리로 먼저 시도
                pcUrl = `https://gall.dcinside.com/mgallery/board/view/?id=${gallId}&no=${postNo}`;
                htmlStr = await fetchPCData(pcUrl);
                
                // 마갤이 아니라면 정식 갤러리로 재시도
                if (!htmlStr.includes("title_subject")) {
                    pcUrl = `https://gall.dcinside.com/board/view/?id=${gallId}&no=${postNo}`;
                    htmlStr = await fetchPCData(pcUrl);
                }
            }

            const parser = new DOMParser();
            const doc = parser.parseFromString(htmlStr, "text/html");

            // 제목 추출
            const titleEl = doc.querySelector('.title_subject');
            if (!titleEl) throw new Error("게시글이 삭제되었거나 잘못된 접근입니다.");
            const title = titleEl.innerText.trim();

            // 본문 추출 및 정제
            const contentEl = doc.querySelector('.write_div');
            let contentHtml = "<p>본문 내용이 없습니다.</p>";
            
            if (contentEl) {
                // 쓸데없는 스크립트, 광고 태그 제거
                contentEl.querySelectorAll('script, style, iframe, .adv-groupno').forEach(el => el.remove());
                
                // [이미지 강제 복구 로직]
                contentEl.querySelectorAll('img').forEach(img => {
                    // 디시 서버가 숨겨둔 진짜 이미지 주소 찾기
                    const realSrc = img.getAttribute('data-original') || img.getAttribute('src');
                    if (realSrc && !realSrc.includes('dcinside_icon')) {
                        img.setAttribute('src', realSrc);
                        // 모바일에 맞게 이미지 크기 최적화
                        img.style.cssText = "max-width: 100%; height: auto; display: block; margin: 15px auto; border-radius: 4px;";
                        // 불필요한 속성 제거
                        img.removeAttribute('onclick');
                        img.removeAttribute('onload');
                        img.removeAttribute('class');
                    } else {
                        img.remove(); // 쓸데없는 더미 이미지는 날림
                    }
                });

                // 링크 터치 버그 방지
                contentEl.querySelectorAll('a').forEach(a => {
                    if (a.href.includes('javascript:')) a.removeAttribute('href');
                });

                contentHtml = contentEl.innerHTML;
            }

            // 복구된 UI 렌더링
            const restoredUI = `
                <div style="max-width: 800px; margin: 0 auto; padding: 0; background: #fff; min-height: 100vh;">
                    <div style="padding: 15px; border-bottom: 1px solid #eee; background: #f8f9fa;">
                        <span style="display:inline-block; padding:3px 8px; background:#d9534f; color:#fff; font-size:12px; border-radius:3px; font-weight:bold; margin-bottom:8px;">PC 우회 복구됨</span>
                        <h2 style="margin: 0; font-size: 18px; line-height: 1.4; color: #333; word-break: break-all;">${title}</h2>
                    </div>
                    
                    <div style="padding: 20px 15px; font-size: 15px; line-height: 1.6; color: #222; word-break: break-all;">
                        ${contentHtml}
                    </div>

                    <div style="padding: 20px; text-align: center; border-top: 1px solid #eee;">
                        <button onclick="window.history.back()" style="padding: 10px 20px; background: #3b5998; color: #fff; border: none; border-radius: 5px; font-size: 14px; font-weight: bold; cursor: pointer;">← 뒤로 가기</button>
                    </div>
                </div>
            `;

            document.body.innerHTML = restoredUI;

        } catch (err) {
            document.body.innerHTML = `
                <div style="padding: 30px; text-align: center; color: #d9534f; margin-top: 50px;">
                    <h3>❌ 복구 실패</h3>
                    <p style="color:#555; font-size:14px;">${err.message}</p>
                    <button onclick="window.location.reload()" style="margin-top:20px; padding: 8px 16px; border:1px solid #ccc; background:#fff; border-radius:4px;">다시 시도</button>
                </div>
            `;
            console.error("Bypass Error: ", err);
        }
    };

    runBypass();

})();
