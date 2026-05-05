// ==UserScript==
// @name         디시인사이드 IP 식별기 (통피/VPN/비공개릴레이 총망라)
// @version      4.0
// @description  통피, 애플 비공개릴레이, 유명 VPN 및 데이터센터 IP 대역을 식별합니다.
// @match        *://*.dcinside.com/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // 💡 방대한 IP 데이터베이스 (수시로 업데이트되는 VPN 특성상 100% 완벽할 순 없으나 대표 대역 포함)
    const ipCategories = [
        {
            label: "통피",
            ips: [
                // SKT, KT, LGU+ 모바일 데이터 아이피
                "39.7", "39.119", "106.101", "106.102", "110.70",
                "114.200", "114.201", "117.111", "118.235", "125.188",
                "175.223", "175.252", "210.125", "211.36", "211.234",
                "211.246", "223.32", "223.33", "223.38", "223.39", "223.62"
            ]
        },
        {
            label: "비공개/WARP",
            ips: [
                // 애플 비공개 릴레이 & 클라우드플레어 WARP 대역
                "104.28", "172.225", "172.226", "172.227", "8.20", "8.21", 
                "8.22", "8.23", "162.158", "188.114", "104.16", "104.17"
            ]
        },
        {
            label: "VPN/우회",
            ips: [
                // 애드가드, 노드, 익스프레스 등 상용 VPN이 자주 임대하는 데이터센터 대역 (M247, Leaseweb, Vultr 등)
                // 및 AWS, GCP, Oracle 등 클라우드 서버 대역 (일반 개인이 아닌 우회 접속일 확률 99%)
                "140.248", "185.123", "185.240", "185.244", "185.156", "185.212", 
                "194.33", "194.226", "156.146", "212.102", "193.176", "89.39", 
                "37.19", "37.120", "84.17", "103.153", "103.208", "149.28", 
                "45.32", "207.246", "104.238", "139.180", "13.124", "13.125", 
                "3.34", "3.35", "34.64", "35.216", "45.13", "45.14", "45.89", 
                "192.145", "108.162", "141.101", "173.245", "198.41", "138.199",
                "146.70", "169.150", "217.138", "185.242", "149.34", "89.40"
            ]
        }
    ];

    function tagIPs() {
        const ipElements = document.querySelectorAll('.ip');

        ipElements.forEach(el => {
            if (el.dataset.ipTagged === "true") return;

            const text = el.textContent;
            const ipMatch = text.match(/\((\d{1,3}\.\d{1,3})\)/);

            if (ipMatch && ipMatch[1]) {
                const ip = ipMatch[1];
                let label = "개인/기타"; // 목록에 없으면 일반 가정용 인터넷이거나 데이터베이스에 없는 신규 VPN

                for (const category of ipCategories) {
                    if (category.ips.includes(ip)) {
                        label = category.label;
                        break;
                    }
                }

                // 기존 요소 내부에 텍스트 추가
                const tagSpan = document.createElement('span');
                tagSpan.innerText = ` [${label}]`;
                el.appendChild(tagSpan);

                el.dataset.ipTagged = "true";
            }
        });
    }

    tagIPs();

    const observer = new MutationObserver((mutations) => {
        let shouldUpdate = false;
        for (let mutation of mutations) {
            if (mutation.addedNodes.length > 0) {
                shouldUpdate = true;
                break;
            }
        }
        if (shouldUpdate) {
            tagIPs();
        }
    });

    observer.observe(document.body, { childList: true, subtree: true });

})();
