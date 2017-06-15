# fontIconCreatePlugin

## 基本调用方式

同一般的webpack plugin引入iconfont-create-plugin,在webpack config中实例化。
```javascript

const FontIconCreatePlugin = require('iconfont-create-plugin');

module.exports = {

    plugins: [
        new FontIconCreatePlugin({
            name:"icon",
            output:'/output/font',
        }),
    ],
}

```
FontIconCreatePlugin会将'/output/font'中的svg文件读取生成"eot", "woff", "ttf", "svg"四个字体文件，一个css文件，一个
预览的html文件

## FontIconCreatePlugin支持参数

### name
字体图标库的名称，该参数影响生成图标class名的前缀

### output
生成的图标文件的输出地址，可指定为对象将html，css及font字体文件输出到三个不同的文件目录下，考虑发布css，font和预览html在不同目录下
```javascript
{
    font:"/output/font",
    css:"/output/css/font",
    html:"/output/font"
}
```
### publishPath
指定css中字体图标的引用路径，可以用于配置cdn路径或者是静态资源路径

```javascript
new FontIconCreatePlugin({
    name:"icon",
    output:'/output/font',
    publishPath:"/publish/font/"
})
```
生成css

```css
@font-face {
    font-family: "icon";
    src: url("/publish/font/icon.eot?#iefix") format("embedded-opentype"),
    url("/publish/font/icon.woff") format("woff"),
    url("/publish/font/icon.ttf") format("truetype"),
    url("/publish/font/icon.svg#iconFont") format("svg");
    font-weight: normal;
    font-style: normal;
}
```

### suffix
考虑使用如sass这种的样式预处理，可以指定生成的文件的后缀名，如指定css为.sass后缀最终会生成icon.sass的字体样式文件
```javascript
    new FontIconCreatePlugin({
        name:"icon",
        output:'/output/font',
        suffix:{
            css:".sass"
        },
        publishPath:"/publish/font/"
    })
```
### styleTemplate与htmlTemplate

指定FontIconCreatePlugin生成的style文件模板及预览html文件的模板


## 按需加载图标

结合[vusion-iconmaker](https://github.com/hzlinguanfu/vusion-iconmaker)这个loader可以实现字体图标的按需加载
如下配置loader
```javascript
 rules: [
     { test: /\.svg$/, loader: 'vusion-iconmaker', include: path.join(__dirname, 'src/icons') },
 ]
```
业务代码中

```javascript
     const test = 123;

     // const icons = require('icons-loader');

     const $app = document.getElementById('app');

     $app.innerHTML = `<i class="${require('./icons/test/arrow-left.svg')}"></i>
     <i class="${require('./icons/arrow-right.svg')}"></i>
     <i class="${require('./icons/arrow-up.svg')}"></i>
```
在业务代码中请求svg文件，loader将返回class名并通过Plugin将svg icon放到字体图标中

