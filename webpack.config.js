const path = require('path');

const IS_PRODUCTION = process.env.NODE_ENV === 'production';

const CleanWebpackPlugin = require('clean-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const BrowserSyncPlugin = require('browser-sync-webpack-plugin');

const plugins = [
    new CleanWebpackPlugin([ './public' ]),
    new ExtractTextPlugin('bundle.css'),
];

if (!IS_PRODUCTION) {
    plugins.push(new BrowserSyncPlugin({
        host: 'localhost',
        port: (process.env.PORT || 3000) + 1,
        proxy: 'http://localhost:' + (process.env.PORT || 3000),
        files: './views/**/*.pug',
        ui: false,
        online: false,
    }, {
        injectCss: true,
    }));
}

module.exports = {
    mode: process.env.NODE_ENV || 'development',
    entry: [
        './scripts/index.js',
        './styles/index.scss',
    ],
    devtool: IS_PRODUCTION ? false : 'inline-source-map',
    module: {
        rules: [
            {
                test: /\.(sass|scss)$/,
                exclude: [ /node_modules/ ],
                use: ExtractTextPlugin.extract({
                    use: [
                        {
                            loader: 'css-loader',
                            options: {
                                importLoaders: 2,
                            },
                        },
                        {
                            loader: 'postcss-loader',
                        },
                        {
                            loader: 'sass-loader',
                        },
                    ],
                }),
            },
            {
                test: /\.pug$/,
                use: {
                    loader: 'pug-loader',
                },
            },
        ],
    },
    plugins: plugins,
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'public'),
    },
    performance: {
        hints: IS_PRODUCTION ? 'warning' : false,
    },
};
