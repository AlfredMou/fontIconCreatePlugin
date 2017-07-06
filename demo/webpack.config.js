// var CommonsChunkPlugin = require('webpack/lib/optimize/CommonsChunkPlugin');
const path = require('path');
const FontIconCreatePlugin = require('../index.js');

module.exports = {
    entry: {
        bundle: './src/index.js',
    },
    output: {
        path: __dirname + '/dist',
        filename: '[name].js',
        // libraryTarget: 'umd',
        // library: ['Foo', '[name]']
    },
    module: {
        rules: [
            { test: /\.svg$/, loader: 'vusion-iconmaker', include: path.join(__dirname, 'src/icons') },
            { test: /\.css$/, use: [{ loader: 'style-loader' }, { loader: 'css-loader' }] },
            { test: /\.(woff|eot|ttf|svg)$/, loader: 'url-loader', exclude: path.join(__dirname, 'src/icons') }
        ]
    },
    devtool: '#eval-source-map',
    plugins: [
        new FontIconCreatePlugin({
            entry:"/src/.icons",
            name:"icon",
            output:{
                font:"/src/iconfont",
                css:"/src/css/font",
                html:"/src/iconfont"
            },
            suffix:{
                css:".mcss",
                html:".html"
            },
            //publishPath:"/publish/font/"
        }),
    ],
}
