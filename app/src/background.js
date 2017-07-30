/**
 * @file 切换加载tab的时候，显示该网站的好评率
 * @author cgzero@cgzero.com
 * @date 2016-06-11
 */

/* globals chrome */

(function () {
    /**
     * 默认 请求域名
     *
     * @const
     * @type {string}
     */
    var DEFAULT_HOST = 'https://koubei.baidu.com';

    /**
     * 请求地址
     *
     * @const
     * @type {string}
     */
    var URL_GET_DATA = DEFAULT_HOST + '/s/getmemdataajax';

    /**
     * 简单的url验证的正则
     *
     * @const
     * @type {string}
     */
    // var URL_REG = /^https?:/ig;

    // refer
    chrome.webRequest.onBeforeSendHeaders.addListener(
        function (details) {
            if (details.type === 'xmlhttprequest') {
                var exists = false;
                for (var i = 0; i < details.requestHeaders.length; ++i) {
                    if (details.requestHeaders[i].name === 'Referer') {
                        exists = true;
                        details.requestHeaders[i].value = DEFAULT_HOST;
                        break;
                    }
                }

                if (!exists) {
                    details.requestHeaders.push({name: 'Referer', value: DEFAULT_HOST});
                }

                // 口碑部分请求会判断是否为ajax请求
                // 所以需要增加该header信息
                details.requestHeaders.push({name: 'X-Requested-With', value: 'XMLHttpRequest'});

                return {requestHeaders: details.requestHeaders};
            }
        },
        {urls: [DEFAULT_HOST + '/*']},
        ['blocking', 'requestHeaders']
    );

    // tab change
    chrome.tabs.onActivated.addListener(function (activeInfo) {
        chrome.tabs.get(
            activeInfo.tabId,
            function (tab) {
                changeHandler(tab);
            }
        );
    });
    chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
        // 完成的时候，再去调用，会慢
        if (changeInfo.status === 'loading') {
            changeHandler(tab);
        }
    });

    /**
     * 切换处理
     *
     * @inner
     * @param {Tab} tab tab对象
     */
    function changeHandler(tab) {
        var url = $.trim(tab.url);
        if (isValid(url)) {
            getData(url);
        }
        else {
            setText('');
        }
    }

    /**
     * 获取站点信息
     *
     * @inner
     * @param {string} url 域名
     */
    function getData(url) {
        $.ajax({
            url: URL_GET_DATA,
            data: {
                ctype: 1,
                sort: 7,
                domain: url
            },
            dataType: 'json',
            cache: false
        })
        .then(
            function (obj) {
                if (!obj.status) {
                    var praise = parseInt(obj.data.meminfo.praise, 10);
                    if (obj.data && praise) {
                        setText(praise + '%');
                    }
                }
                else {
                    setText('');
                }
            },
            function () {
                setText('');
            }
        );
    }

    /**
     * 设置badge的提示信息
     *
     * @inner
     * @param {string} text 提示
     */
    function setText(text) {
        chrome.browserAction.setBadgeText({
            text: text
        });
    }


    /**
     * 判断url是否有效(正则为啥有问题？？？)(简单处理吧，其实处理是错误不严谨的)
     *
     * @param {string} url 地址
     * @return {boolean} 是否有效
     */
    function isValid(url) {
        return ~url.indexOf('http');
    }

})();
