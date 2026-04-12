// ==UserScript==
// @name         Dcinside Expert Cache System + Rate Limit
// @namespace    https://github.com/hooray804/adguard-gallery-filter
// @version      7.6.1
// @description  캐시 시스템에 실시간 Rate Limit(요청 제한) 모니터링 기능을 추가합니다.
// @match        *://*.dcinside.com/*
// @run-at       document-end
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // --- [추가된 부분] 1. Rate Limit 표시 UI 관련 변수 ---
    let rateLimitUI = null;

    /**
     * 실시간으로 남은 요청 수를 화면에 표시하는 함수
     */
    const updateRateLimitUI = (limit, remaining) => {
        if (!rateLimitUI) {
            rateLimitUI = document.createElement("div");
            rateLimitUI.style.cssText = "position: fixed; bottom: 10px; left: 10px; background: rgba(0, 0, 0, 0.6); color: #fff; padding: 4px 8px; border-radius: 4px; font-size: 11px; z-index: 99999; pointer-events: none; box-shadow: 0 1px 3px rgba(0,0,0,0.3);";
            document.body.appendChild(rateLimitUI);
        }
        rateLimitUI.innerText = `Rate Limit: ${remaining} / ${limit}`; 
    };

    /**
     * 서버 헤더에서 요청 제한 정보를 추출하는 함수
     */
    const checkRateLimit = async () => {
        try {
            // HEAD 요청만 보내서 데이터 소모 없이 헤더 정보만 가져옴
            const response = await fetch(window.location.href, { method: "HEAD" });
            const limit = response.headers.get("x-rate-limit-limit") || response.headers.get("x-ratelimit-limit"); 
            const remaining = response.headers.get("x-rate-limit-remaining") || response.headers.get("x-ratelimit-remaining"); 

            if (limit && remaining) {
                updateRateLimitUI(limit, remaining);
            }
        } catch (e) {
            console.error("Rate Limit 확인 실패", e);
        }
    };
    // ------------------------------------------------

    // 1. 상수 및 초기 설정
    const DB_NAME = "dc_expert_db";
    const STORE_NAME = "post_cache";
    let dbInstance = null;

    // ... (중략: 기존 openDB, cleanOldCache, getCache, setCache 로직은 동일) ...

    const openDB = () => new Promise((resolve, reject) => {
        if (dbInstance) return resolve(dbInstance);
        const request = indexedDB.open(DB_NAME, 3);
        request.onupgradeneeded = (e) => {
            const db = e.target.result;
            if (db.objectStoreNames.contains(STORE_NAME)) db.deleteObjectStore(STORE_NAME);
            db.createObjectStore(STORE_NAME, { keyPath: "url" }).createIndex("time", "time", { unique: false });
        };
        request.onsuccess = (t) => {
            dbInstance = t.target.result;
            if (Math.random() < 0.05) cleanOldCache(dbInstance);
            resolve(dbInstance);
        };
        request.onerror = (e) => reject(e);
    });

    const cleanOldCache = (db) => {
        const transaction = db.transaction([STORE_NAME], "readwrite");
        const store = transaction.objectStore(STORE_NAME);
        const index = store.index("time");
        const twentyFourHoursAgo = Date.now() - 86400000;
        const range = IDBKeyRange.upperBound(twentyFourHoursAgo);
        index.openCursor(range).onsuccess = (e) => {
            const cursor = e.target.result;
            if (cursor) {
                store.delete(cursor.primaryKey);
                cursor.continue();
            }
        };
    };

    // 초기 실행 시 Rate Limit 확인
    checkRateLimit();

    window.dcCache = { 
        getCache: async (url) => {
            const db = await openDB();
            return new Promise((r) => {
                const req = db.transaction([STORE_NAME], "readonly").objectStore(STORE_NAME).get(url);
                req.onsuccess = () => r(req.result);
            });
        },
        setCache: async (data) => {
            const db = await openDB();
            // 데이터를 저장할 때마다 서버 상태를 한 번씩 체크하여 수치를 갱신
            checkRateLimit(); 
            return new Promise((r) => {
                const req = db.transaction([STORE_NAME], "readwrite").objectStore(STORE_NAME).put(data);
                req.onsuccess = () => r(req.result);
            });
        }
    };

})();
