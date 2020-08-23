const path = require('path');
const { CleanWebpackPlugin: Clean } = require('clean-webpack-plugin');
const Dotenv = require('dotenv-webpack');
const Html = require('html-webpack-plugin');
const MiniCssExtract = require('mini-css-extract-plugin');

module.exports = (env, argv) => ({
    target: 'node',
    mode: argv.mode || 'development',
    entry: {
        index: './src/index.js',
    },
    module: {
        rules: [
            {
                test: /\.pug$/,
                use: [
                    {
                        loader: 'pug-loader',
                        options: { pretty: argv.mode !== 'development' },
                    },
                ],
            },
            {
                test: /\.scss$/,
                use: [
                    { loader: MiniCssExtract.loader },
                    { loader: 'css-loader', options: { importLoaders: 1 } },
                    { loader: 'sass-loader' },
                ],
            },
        ],
    },
    output: {
        filename: '[name].js',
        path: path.resolve(__dirname, 'build'),
    },
    plugins: [
        new Dotenv({
            path: argv.mode === 'production' ? './.env.production' : './.env',
            safe: true,
            allowEmptyValues: true,
        }),
        new Clean(),
        new Html({
            template: './src/views/index.pug',
        }),
        new Html({
            template: './src/views/error.pug',
            filename: 'error.html',
            inject: false,
        }),
        new MiniCssExtract({
            filename: '[name].css',
        }),
    ],
    devServer: {
        host: '0.0.0.0',
        allowedHosts: (process.env.WEBPACK_DEV_SERVER_ALLOWED_HOSTS || '')
            .split(',')
            .map((host) => host.trim()),
    },
});
