# pagelet.js

> scrat seo模式的pagelet框架

## API

### pagelet.autoload();

> 调用这个函数，阻止页面的a标签的跳转，变成自动pagelet加载

### pagelet.on(type, callback)

> 事件绑定

事件列表：

* ``pagelet.EVENT_BEFORE_LOAD`` pagelet加载前事件
* ``pagelet.EVENT_LOAD_ERROR`` pagelet加载失败事件
* ``pagelet.EVENT_LOAD_COMPLETED`` pagelet加载完成事件
* ``pagelet.EVENT_GO_ERROR`` pagelet跳转错误事件
* ``pagelet.EVENT_BACK_ERROR`` popstate跳转错误事件
* ``pagelet.EVENT_GO_LOADED`` pagelet跳转加载完毕事件
* ``pagelet.EVENT_LOAD_PROGRESS`` pagelet加载进度事件
* ``pagelet.EVENT_BEFORE_EXEC_SCRIPTS`` pagelet执行页面脚本开始前事件
* ``pagelet.EVENT_AFTER_EXEC_SCRIPTS`` pagelet执行页面脚本完成后事件
* ``pagelet.EVENT_BEFORE_INSERT_HTML`` pagelet处理html前事件
* ``pagelet.EVENT_AFTER_INSERT_HTML`` pagelet处理html后事件
* ``pagelet.EVENT_BEFORE_GO`` pagelet跳转前事件
* ``pagelet.EVENT_AFTER_GO`` pagelet跳转后事件
* ``pagelet.EVENT_GO_COMPLETED`` pagelet跳转完成事件

示例（实现一个加载进度条）：

```js
var timer, last,
    wrapper = $('.progress'), inner = $('#progress-inner');

pagelet.on(pagelet.EVENT_BEFORE_LOAD, function(){
    last = Date.now();
    wrapper.css('display', 'block');
    clearTimeout(timer);
});

pagelet.on(pagelet.EVENT_LOAD_PROGRESS, function(data){
    var e = data.event;
    var percent = e.loaded / e.total * 100;
    inner.width(percent + '%');
});

pagelet.on(pagelet.EVENT_LOAD_COMPLETED, function(){
    inner.width('100%');
    var delay = 200;
    var delta = Date.now() - last;
    if(delta < 300){
        delay += 300 - delta;
    }
    timer = setTimeout(function(){
        wrapper.css('display', 'none');
        inner.width(0);
    }, delay);
});
```

### pagelet.off(type, callback)

> 解除事件绑定

### pagelet.emit(type, data)

> 事件派发

示例：

```js
pagelet.emit(pagelet.EVENT_BEFORE_LOAD, { options: options });
```

### pagelet.pushState(options)

> 压栈一个历史记录

示例：

```js
var options = {
    url: '/news?p=123',
    pagelets: ['list', 'hot'],
    success: function(data, done){
        // 在pagelet加载完成后务必调用一下push函数
        push(data.title);
    }
};
// 在load之前调用pushState，这样可以让url先发生变化
var push = pagelet.pushState(options);
pagelet.load(options);
```



### pagelet.load(options);

> 加载一个pagelet

options中的参数：

* url ``String`` 要加载的页面地址
* pagelets ``String|Array`` 要加载的pagelet的id，可以是id数组，也可以是用``,``分隔的字符串
* success ``Function`` 完成pagelet资源加载后的回调函数
* progress ``Function|null`` ajax加载过程中的progress函数
* complete ``Function|null`` ajax加载完成回调
* error ``Function|null`` ajax加载失败回调

示例：

```js
var options = {
    url: '/news?p=123',
    pagelets: ['list', 'hot'],
    success: function(data, done){
        // 这里写业务逻辑处理html插入，其中：
        // data.html，是一个k-v对象，k是pageletId，v是html片段
        // data.data，是页面用{% datalet name="xxx" value="xxx" %} 收集的数据
        // 完成html插入之后，如果本函数的返回值不是false，框架会自动执行pagelet中的脚本，
        // 有时候我们插入html可能要延迟一下，没问题，让当前函数返回false，然后在后续合适
        // 的时机中调用一下done函数，框架会完成页面脚本执行的工作
    }
};
pagelet.load(options);
```

### pagelet.go(options)

> 加载pagelet并将url放入历史记录

options与pagelet.load函数一样，但多了几个参数：

* replace ``Boolean`` 历史记录是否为replace替换，默认是false，如果设置为true，将不会产生新的历史

```js
var options = {
    url: '/news?p=123',
    pagelets: ['list', 'hot'],
    replace: true,
    success: function(data, done){
        // 这里写业务逻辑处理html插入，其中：
        // data.html，是一个k-v对象，k是pageletId，v是html片段
        // data.data，是页面用{% datalet name="xxx" value="xxx" %} 收集的数据
        // 完成html插入之后，如果本函数的返回值不是false，框架会自动执行pagelet中的脚本，
        // 有时候我们插入html可能要延迟一下，没问题，让当前函数返回false，然后在后续合适
        // 的时机中调用一下done函数，框架会完成页面脚本执行的工作
    }
};
pagelet.go(options);
```

### pagelet.router(pattern, callback)

> 在pagelet.go和history前进后退过程中拦截url，实现路由控制

示例：

```js
pagelet.router('/:page', function(ctx, options, event, next){
    if(/^\w+$/.test(ctx.page)){
        $('.nav a[data-name]')
            .removeClass('active');
        $('.nav a[data-name="' + ctx.page + '"]')
            .addClass('active');
    }
    // 调用next函数，可以让路径继续进行，不会影响默认事件
    // 如果不调用，可以在这里处理页面状态切换
    next();
});
```

### pagelet.autoload(defaultPagelet, eventType);

> 拦截A标签跳转

务必设置 ``defaultPagelet`` 参数，就是最外层的pagelet id，这样在某些历史记录不存在的时候，框架可以自动切换最父级的pagelet，页面切换能保证准确。eventType是拦截事件的类型，默认是 ``click`` 事件

示例：

```js
pagelet.autoload('layout', 'touchend');
```

### pagelet.timeout(time);

> 设置pagelet加载资源或者pagelet页面的超时时间，单位是ms，默认值为 ``600000``，即1分钟

示例：

```js
pagelet.timeout(10*1000);
```