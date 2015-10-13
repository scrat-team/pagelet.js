/**
 * pagecache
 * 用于为pagelet请求添加缓存功能
 * 用法：pagelet.cache(options);
 * options:
 *   max <Number>: 最大缓存页面数，默认是30页
 */

(function(global){

    /**
     * 最大缓存数
     * @type {number}
     */
    var MAX_CACHE_SIZE = 30;

    var cached = {};

    /**
     * 访问热度，这是一个自增id
     * @type {number}
     */
    var hot = 0;
    var noop = function(){};
    var anchor = document.createElement('a');
    anchor.href = '/';
    var root = anchor.href.replace(/\/$/, '');

    /**
     * 获取页面访问热度，用于缓存淘汰算法（LRU）
     * @returns {number}
     */
    function getHot(){
        return hot++;
    }

    /**
     * 格式化url，去除开头的域名
     * @param url
     * @returns {void|string|XML|*}
     */
    function normalize(url){
        anchor.href = url;
        return anchor.href.replace(root, '');
    }

    /**
     * 检查缓存是否超限
     */
    function check(){
        var arr = [];
        for(var url in cached){
            arr.push({
                url: url,
                hot: cached[url].hot
            });
        }
        if(arr.length > MAX_CACHE_SIZE){
            arr.sort(function(a, b){
                return b.hot - a.hot;
            });
            for(var i = MAX_CACHE_SIZE; i < arr.length; i++){
                delete cached[arr[i].url];
            }
        }
    }

    function getScrollTop(){
        return window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop;
    }

    var prevUrl = normalize('');

    /**
     * 存储页面缓存
     * @returns {*}
     */
    function save(url){
        var dom = document.querySelector('[data-pagelet=layout]');
        if(prevUrl){
            var scrollTop = getScrollTop();
            var fragment = document.createDocumentFragment();
            fragment.appendChild(dom.cloneNode(true));
            cached[prevUrl] = {
                scrollTop: scrollTop,
                fragment: fragment,
                title: document.title,
                hot: getHot()
            };
            check();
        }
        prevUrl = url;
        return dom;
    }

    window.requestAnimationFrame = (function(){
        return window.requestAnimationFrame   ||
            window.webkitRequestAnimationFrame ||
            window.mozRequestAnimationFrame    ||
            function( callback ){
                window.setTimeout(callback, 1000 / 60);
            };
    })();

    /**
     * 恢复页面缓存
     * @param options
     * @returns {boolean}
     */
    function revert(options){
        var url = normalize(options.url);
        var cache = cached[url];
        if(cache){
            pagelet.abort({ action: 'pagecache' });
            delete cached[url];
            save(url);
            var push = options.isBack ? noop : pagelet.pushState(options);
            options.pagelets.forEach(function(pagelet){
                var selector = '[data-pagelet="' + pagelet + '"]';
                var currentDom = document.querySelector(selector);
                var cacheDom = cache.fragment.querySelector(selector);
                if(currentDom && cacheDom){
                    //currentDom.innerHTML = cacheDom.innerHTML;
                    var parent = currentDom.parentNode;
                    parent.replaceChild(cacheDom, currentDom);
                } else {
                    // TODO error
                    location.href = url;
                }
            });
            document.title = cache.title;
            var scroll = (options.isBack || options.revertScroll) ? cache.scrollTop : 1;
            var evt = {
                options: options,
                fromCache: true
            };
            requestAnimationFrame(function(){
                window.scrollTo(0, scroll);
                cache = null;
            });
            pagelet.emit(pagelet.EVENT_LOAD_COMPLETED, evt);
            push(cache.title);
            return true;
        }
        return false;
    }

    pagelet.cache = global.pagecache = function(options){
        options = options || {};
        MAX_CACHE_SIZE = options.max || MAX_CACHE_SIZE;

        // 监听html插入事件，将页面缓存起来
        pagelet.on(pagelet.EVENT_BEFORE_INSERT_HTML, function(e){
            if(!e.options.nocache){
                save(e.options.url);
            }
        });

        // 插入html之后恢复滚动条位置
        pagelet.on(pagelet.EVENT_AFTER_INSERT_HTML, function(e){
            if(!e.options.isBack && !e.options.keepScroll){
                requestAnimationFrame(function(){
                    window.scrollTo(0, 1);
                });
            }
        });

        // 监听页面跳转事件，判断是可以从缓存恢复页面内容
        pagelet.router('*', function(ctx, options, e, next){
            options.prevUrl = prevUrl;
            if(!options.isBack){
                if(e && e.target && e.target.hasAttribute('data-keep-scroll')){
                    options.revertScroll = true;
                }
            }
            if(revert(options)){
                // used cache
            } else {
                next();
            }
        });
    };

})(window);
