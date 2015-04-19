# pagelet.js

> scrat seo模式的pagelet框架

## API

### pagelet.autoload();

> 调用这个函数，阻止页面的a标签的跳转，变成自动pagelet加载

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