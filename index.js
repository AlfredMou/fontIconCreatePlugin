/**
 * Created by moujintao on 2017/5/12.
 */
let path = require('path');
let fs = require('fs');
let IconMaker=require('icon-maker');
let iconMaker = new IconMaker();
let runPath=path.resolve('./');
let ejs=require("ejs");


function fontIconCreatePlugin(options) {
    // 使用配置（options）设置插件实例
    this.options=Object.assign({
        entry:'',
        output:'/iconFont',
        name:'iconFont',
        styleTemplate:__dirname+'/demo.css',
        htmlTemplate:__dirname+'/i-font-preview.html',
        publishPath:"./",
        svgPath:[]
    },options);
    this.options.loaderName='@icon-maker-loader';
}

fontIconCreatePlugin.prototype.apply = function(compiler) {
    // right after emit, files will be generated
    compiler.plugin("compilation",(compilation)=>{
        //主要的编译实例
        //随后所有的方法都从 compilation.plugin 上得来
        compilation.plugin('normal-module-loader',(loaderContext, module) => {
            //这里是所以模块被加载的地方
            //一个接一个，此时还没有依赖被创建
            if(module.request.indexOf(this.options.loaderName)!==-1&&module.resource.indexOf(this.options.loaderName)===-1){
                this.options.svgPath.push(module.resource);
            }
        });
    });
    // right after emit, files will be generated
    compiler.plugin("emit", (compilation, callback) => {
        let svgList=readAllIconSvg(this.options.entry instanceof Array?this.options.entry:[this.options.entry]);
        const dirName=path.join(runPath, this.options.output);
        mkdir(dirName);
        svgList=delRepeat(svgList.concat(this.options.svgPath));

        svgList.forEach((value)=>{
            iconMaker.addSvg(value);
        });
        iconMaker._fontFamily=this.options.name;
        iconMaker.run((err, font) => {
            if (err) throw err;
            var fontFiles=font.fontFiles;

            for(var n=0,len=fontFiles.length;n<len;n++){
                let createFilePath= dirName+fontFiles[n].path;
                fs.writeFile(createFilePath, fontFiles[n].contents, function(err){
                    if(err) throw err;
                    console.log('fontIconCreatePlugin create '+createFilePath);
                });
            }
            this.handleCss(font).then((options)=>{
                fs.writeFile(dirName+'/'+this.options.name+'.css', options.result,(err)=>{
                    if(err) throw err;
                    //console.log('fontIconCreatePlugin create '+dirName+"/"+this.options.name+'.css');
                });
                return options
            }).then((options) => {
                return this.createDemoHtml(options.result,options.data)
            }).then((html)=>{
                fs.writeFile(dirName+'/'+this.options.name+'-preview.html', html,(err)=>{
                    if(err) throw err;
                    //console.log('fontIconCreatePlugin create '+dirName+"/"+this.options.name+'-preview.html');
                });
            });;

        });
        callback();
    });
};

fontIconCreatePlugin.prototype.handleCss=function(font) {
    let iconMakerCss = font.css;
    let data = this.extractVar(iconMakerCss);
    return new Promise((res,rej)=>{
        fs.readFile(this.options.styleTemplate, (err, fileData) => {
            if (err) throw err;
            let template = fileData.toString(),result;
            result=template.replace(/\$\{([0-9a-zA-Z]*)\}/g,(e1,e2)=>{
                var replaceVal=data[e2]||e1;
                return replaceVal;
            });
            res({result,data});
        });
    })
}

fontIconCreatePlugin.prototype.createDemoHtml = function (css,data) {
    let renderData=Object.assign({cssStr:css},data);
    return new Promise((res,rej)=>{
        fs.readFile(this.options.htmlTemplate, (err, fileData) => {
            if (err) throw err;
            let template = fileData.toString(),result;
            result=ejs.render(template,renderData);
            res(result,data);
        });
    })
}

fontIconCreatePlugin.prototype.extractVar=function(css) {
    let name = this.options.name,
        publishPath=this.options.publishPath,regResult,
        classReg= new RegExp('\\.'+name+'-([0-9a-zA-Z-]*)\\:before\\s*\\{\\n\\s*content\\:\\s*\\"(\\\\f[0-9]*)\\"\\;\\s*\\n\\s*\\}','g');
    let fontBody=[],fontName={};
    regResult=classReg.exec(css);
    while(regResult){
        fontBody.push(regResult[0]);
        fontName[regResult[1]]=regResult[2];
        regResult=classReg.exec(css);
    }
    return {
        name:name,
        publishPath:publishPath,
        fontContent:fontBody.join("\n"),
        fontName:fontName
    }
}

function readAllIconSvg(entryList) {
    let files = [],jsPath,dirs,matchs,entery;

    for(let i=0,len=entryList.length;i<len;i++){
        entery=entryList[i];
        jsPath = path.join(runPath, entery);
        dirs = fs.readdirSync(jsPath);
        matchs = [];
        dirs.forEach(function (item) {
            matchs = item.match(/(.+)\.svg$/);
            if (matchs) {
                files.push(path.resolve(jsPath, item));
            }
        });
    }
    return files;
}

function mkdir(dirpath,dirname){
    //判断是否是第一次调用
    if(typeof dirname === "undefined"){
        if(fs.existsSync(dirpath)){
            return;
        }else{
            mkdir(dirpath,path.dirname(dirpath));
        }
    }else{
        //判断第二个参数是否正常，避免调用时传入错误参数
        if(dirname !== path.dirname(dirpath)){
            mkdir(dirpath);
            return;
        }
        if(fs.existsSync(dirname)){
            fs.mkdirSync(dirpath)
        }else{
            mkdir(dirname,path.dirname(dirname));
            fs.mkdirSync(dirpath);
        }
    }
}

function delRepeat(arry) {
    arry.sort();//排序
    var n = [arry[0]];
    for (var i = 1; i < arry.length; i++) {
        if (arry[i] !== n[n.length - 1]) {
            n.push(arry[i]);
        }
    }
    return n;
}

module.exports = fontIconCreatePlugin;