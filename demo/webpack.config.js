// var CommonsChunkPlugin = require('webpack/lib/optimize/CommonsChunkPlugin');
const path = require('path');
const FontIconCreatePlugin = require('../index.js');
var ExtractTextPlugin = require('extract-text-webpack-plugin');
var extractLESS = new ExtractTextPlugin({
    filename:"css/[name].css",
    allChunks:true
});

module.exports = {
    entry: {
        bundle: './test/index.js',
        test: './test/index.js',
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
            { test: /\.css$/, use: ExtractTextPlugin.extract({ fallback: 'style-loader', use: ["css-loader","icon-font-loader"]}) },
            { test: /\.(woff|eot|ttf|svg)$/, loader: 'url-loader', exclude: path.join(__dirname, 'src/icons') }
        ]
    },
    devtool: '#eval-source-map',
    plugins: [
        new FontIconCreatePlugin({
            entry:"/test/icons",
            name:"iconDD",
            output:"/test/iconfont",
            cssEmbed:true
            //publishPath:"/publish/font/"
        }),extractLESS
    ],
}
