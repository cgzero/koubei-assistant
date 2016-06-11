/**
 * @file 口碑评论助手
 * @author cgzero@cgzero.com
 * @date 2016-06-03
 */

/* globals chrome Vue */

(function () {
    /**
     * 默认 请求域名
     *
     * @const
     * @type {string}
     */
    var DEFAULT_HOST = 'http://koubei.baidu.com';

    /**
     * 获取网站基本信息和评论信息
     *
     * @const
     * @type {string}
     */
    var URL_GET_SITE_DATA = DEFAULT_HOST + '/m/getsitedataajax';

    /**
     * 获取网站评论信息
     *
     * @const
     * @type {string}
     */
    var URL_GET_SITE_COMT = DEFAULT_HOST + '/m/getsitecomtajax';

    /**
     * 头像前缀
     *
     * @const
     * @type {string}
     */
    var PHOTO_PREFIX = 'http://himg.bdimg.com/sys/portrait/item/';

    /**
     * 简单的url验证的正则
     *
     * @const
     * @type {string}
     */
    var URL_REG = /^https?:/ig;

    // chrome为ajax请求增加口碑referer
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

                return {requestHeaders: details.requestHeaders};
            }
        },
        {urls: [DEFAULT_HOST + '/*']},
        ['blocking', 'requestHeaders']
    );

    // 切换tab时重新请求数据
    chrome.tabs.query({currentWindow: true, active: true}, function (tabs) {
        if (tabs.length) {
            var url = tabs[0].url.trim();
            if (URL_REG.test(url)) {
                getSiteData(url);
            }
            else {
                getSiteData('baidu.com');
            }
        }
    });

    /**
     * 获取站点信息和评论信息
     *
     * @inner
     * @param {string} url 当前地址栏url
     */
    function getSiteData(url) {
        var siteid;
        new Vue({
            el: '#app',
            ready: function () {

                if (!url) {
                    this.$set('hasdata', 0);
                    this.$set('isrender', 1);
                    this.$set('errmsg', 'URL格式错误');
                    return;
                }

                this.$set('host', 'http://koubei.baidu.com');
                this.$set('userphotoprefix', 'http://himg.bdimg.com/sys/portrait/item/');

                this.$http({
                    url: URL_GET_SITE_DATA,
                    method: 'GET',
                    data: {
                        ctype: 1,
                        sort: 7,
                        domain: url
                    }
                })
                .then(
                    function (res) {
                        var ret = res.data;
                        var status = ret.status;
                        var data = ret.data;

                        this.$set('isrender', 1);

                        if (!status) {
                            this.$set('hasdata', 1);
                            this.$set('siteinfo', data.siteinfo);
                            this.$set('sitecomt', data.sitecomt);
                        }
                        else {
                            this.$set('hasdata', 0);
                            this.$set('status', status);
                            this.$set('errmsg', ret.msg);
                        }

                        siteid = data.siteinfo.siteid;
                    },
                    function (res) {
                        this.$set('isrender', 1);
                        this.$set('hasdata', 0);
                        this.$set('errmsg', '错误，请稍后重试');
                    }
                );

            },
            methods: {
                getTruth: function () {
                    if (this.$get('istruthrender')) {
                        return;
                    }

                    this.$http({
                        url: URL_GET_SITE_COMT,
                        method: 'GET',
                        data: {
                            ctype: 2,
                            siteid: siteid
                        }
                    })
                    .then(
                        function (res) {
                            var ret = res.data;
                            var status = ret.status;
                            var data = ret.data;

                            this.$set('istruthrender', 1);

                            if (!status) {
                                this.$set('sitetruth', data);
                            }
                        }
                    );
                },
                getTopic: function () {
                    if (this.$get('istopicrender')) {
                        return;
                    }

                    this.$http({
                        url: URL_GET_SITE_COMT,
                        method: 'GET',
                        data: {
                            ctype: 4,
                            siteid: siteid
                        }
                    })
                    .then(
                        function (res) {
                            var ret = res.data;
                            var status = ret.status;
                            var data = ret.data;

                            this.$set('istopicrender', 1);

                            if (!status) {
                                this.$set('sitetopic', data);
                            }
                        }
                    );
                }
            }
        });
    }
})();


