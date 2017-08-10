/**
 * Created by moujintao on 2017/5/12.
 */
const path = require('path');
const fs = require('fs');
const IconMaker = require('icon-maker');
const iconMaker = new IconMaker();
const runPath = path.resolve('./');
const ejs = require('ejs');
const util = require('./util.js');

let fileNamePath = {};

class fontIconCreatePlugin {
    constructor(options) {
        this.options = Object.assign({
            entry: '',
            output: '/src/iconFont',
            name: 'iconFont',
            styleTemplate: __dirname + '/demo.css',
            htmlTemplate: __dirname + '/i-font-preview.html',
            publishPath: './',
            suffix: {
                css: '.css',
                html: '.html',
            },
            cssEmbed: false,
        }, options);
        this.options.loaderName = 'vusion-iconmaker';
        this.iconUrlNameMap = {};
    }
    apply(compiler) {
        const svgList = util.readAllIconSvg(this.options.entry instanceof Array ? this.options.entry : [this.options.entry], runPath);
        fileNamePath = util.getRepeatClassNameSvg(svgList);
        compiler.plugin('after-plugins', (compilation) => {
            compilation.options.iconFontOptions = {
                fontName: this.options.name,
                svgList: [],
            };
        });
        compiler.plugin('compilation', (compilation) => {
            // 主要的编译实例
            // 随后所有的方法都从 compilation.plugin 上得来
            compilation.plugin('normal-module-loader', (loaderContext, module) => {
                // 这里是所以模块被加载的地方
                // 一个接一个，此时还没有依赖被创建

                if (module.request.indexOf(this.options.loaderName) !== -1 && module.resource.indexOf(this.options.loaderName) === -1)
                    loaderContext.className = this.addSvgToFilePath(module.resource);
            });
        });
        // right after emit, files will be generated
        compiler.plugin('emit', (compilation, callback) => {
            const suffix = Object.assign({
                css: '.css',
                html: '.html',
            }, this.options.suffix);

            if (this.options.cssEmbed) {
                const iconFontLoaderSvgs = compilation.options.iconFontOptions.svgList;
                iconFontLoaderSvgs.forEach((item) => {
                    this.iconUrlNameMap[item] = this.addSvgToFilePath(item);
                });
            }

            let hasSVGCache = false;
            // const dirName=path.join(runPath, this.options.output),output=this.options.output;
            const { fontDirName, htmlDirName, cssDirName } = util.getOutputPath(this.options.output, runPath);

            if (fontDirName === htmlDirName && fontDirName === cssDirName)
                util.mkdir(fontDirName);
            else {
                util.mkdir(fontDirName);
                util.mkdir(htmlDirName);
                util.mkdir(cssDirName);
            }
            const resultSvg = util.createFileCache(fileNamePath, fontDirName + '/SAME_SVG_CACHE');
            hasSVGCache = resultSvg.hasCache;
            const svgList = resultSvg.svgList;
            svgList.forEach((value) => {
                iconMaker.addSvg(value);
            });
            iconMaker._fontFamily = this.options.name;
            iconMaker.run((err, font) => {
                if (err)
                    throw err;
                const fontFiles = font.fontFiles;

                for (let n = 0, len = fontFiles.length; n < len; n++) {
                    const createFilePath = fontDirName + fontFiles[n].path;
                    fs.writeFile(createFilePath, fontFiles[n].contents, (err) => {
                        if (err)
                            throw err;
                        console.log('fontIconCreatePlugin create ' + createFilePath);
                    });
                }
                this.handleCss(font, compilation.hash).then((options) => {
                    this.fonts = options.data.fontName;
                    if (this.options.cssEmbed)
                        this.replaceAssetContent(compilation);

                    fs.writeFile(cssDirName + '/' + this.options.name + suffix.css, options.result, (err) => {
                        if (err)
                            throw err;
                        console.log('fontIconCreatePlugin create ' + cssDirName + '/' + this.options.name + '.css');
                    });
                    callback();
                    return options;
                }).then((options) => this.createDemoHtml(options.result, options.data)).then((html) => new Promise((res, ref) => {
                    fs.writeFile(htmlDirName + '/' + this.options.name + '-preview' + suffix.html, html, (err) => {
                        if (err)
                            throw err;
                        console.log('fontIconCreatePlugin create ' + htmlDirName + '/' + this.options.name + '-preview.html');
                        res();
                    });
                })).then(() => {
                    if (hasSVGCache) {
                        console.log('remove cache file ' + fontDirName + '/SAME_SVG_CACHE');
                        util.rmdirSync(fontDirName + '/SAME_SVG_CACHE');
                    }
                }).catch((err) => {
                    if (hasSVGCache) {
                        console.log('remove cache file ' + fontDirName + '/SAME_SVG_CACHE');
                        util.rmdirSync(fontDirName + '/SAME_SVG_CACHE');
                    }
                    throw err;
                });
            });
        });
    }
    handleCss(font, hash) {
        const iconMakerCss = font.css;
        const data = this.extractVar(iconMakerCss);
        data.hash = hash;
        return new Promise((res, rej) => {
            fs.readFile(this.options.styleTemplate, (err, fileData) => {
                if (err)
                    throw err;
                const template = fileData.toString();
                const result = template.replace(/\$\{([0-9a-zA-Z]*)\}/g, (e1, e2) => {
                    const replaceVal = data[e2] || e1;
                    return replaceVal;
                });
                res({ result, data });
            });
        });
    }
    createDemoHtml(css, data) {
        const renderData = Object.assign({ cssStr: css }, data);
        return new Promise((res, rej) => {
            fs.readFile(this.options.htmlTemplate, (err, fileData) => {
                if (err)
                    throw err;
                const template = fileData.toString();
                const result = ejs.render(template, renderData);
                res(result, data);
            });
        });
    }
    extractVar(css) {
        const name = this.options.name,
            publishPath = this.options.publishPath,
            classReg = new RegExp('\\.' + name + '-([0-9a-zA-Z-]*)\\:before\\s*\\{\\n\\s*content\\:\\s*\\"(\\\\f[0-9a-zA-Z]*)\\"\\;\\s*\\n\\s*\\}', 'g'),
            fontBody = [], fontName = {};
        let regResult = classReg.exec(css);
        while (regResult) {
            fontBody.push(regResult[0]);
            fontName[regResult[1]] = regResult[2];
            regResult = classReg.exec(css);
        }
        return {
            name,
            publishPath,
            fontContent: fontBody.join('\n'),
            fontName,
        };
    }
    addSvgToFilePath(url) {
        const filePath = url.split('/'), fileName = filePath[filePath.length - 1], names = fileName.split('.');
        const name = names.slice(0, names.length - 1).join('');
        const fileNameIndex = util.delRepeatName(url, fileNamePath);
        if (fileNameIndex === 0)
            return name;

        return name + '-' + fileNameIndex;
    }
    /**
     * replace asset's font content
     */
    replaceAssetContent(compilation) {
        const assets = compilation.assets;
        const keys = Object.keys(assets);
        keys.forEach((key) => {
            if (key.substr(key.lastIndexOf('.')) === '.js' || key.substr(key.lastIndexOf('.')) === '.css') {
                const asset = assets[key];
                let content = asset.source();

                content = content.replace(/\$\{ICONFONT_([\s\S]*?)}/g, ($1, $2) => {
                    const name = this.iconUrlNameMap[$2];
                    if (!name)
                        return $1;

                    return this.fonts[name];
                });
                assets[key] = {
                    source() {
                        return content;
                    },
                    size() {
                        return content.length;
                    },
                };
            }
        });
    }
}

module.exports = fontIconCreatePlugin;
