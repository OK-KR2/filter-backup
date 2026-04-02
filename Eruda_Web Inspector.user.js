// ==UserScript==
// @name        Mobile DevTools (Eruda)
// @match       *://*/*
// @grant       none
// ==/UserScript==

(function () {
    var script = document.createElement('script');
    script.src = "//cdn.jsdelivr.net/npm/eruda"; // 이 부분이 찝찝하면 코드를 통째로 복사해서 로컬에 넣어도 됩니다.
    document.body.appendChild(script);
    script.onload = function () {
        eruda.init();
    };
})();
