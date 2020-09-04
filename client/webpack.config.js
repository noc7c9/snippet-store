const path = require('path');
const { CleanWebpackPlugin: Clean } = require('clean-webpack-plugin');
const Dotenv = require('dotenv-webpack');
const Html = require('html-webpack-plugin');
const MiniCssExtract = require('mini-css-extract-plugin');

module.exports = (env, argv) => ({
    target: 'web',
    mode: argv.mode || 'development',
    entry: {
        index: './src/index.ts',
    },
    resolve: {
        extensions: ['.js', '.ts'],
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: [
                    {
                        loader: '@sucrase/webpack-loader',
                        options: { transforms: ['typescript', 'imports'] },
                    },
                ],
            },
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
        new Html({ template: './src/index.pug' }),
        new Html({ template: './src/error.pug', filename: 'error.html' }),
        new MiniCssExtract({ filename: '[name].css' }),
    ],
    devServer: {
        host: '0.0.0.0',
        allowedHosts: (process.env.WEBPACK_DEV_SERVER_ALLOWED_HOSTS || '')
            .split(',')
            .map((host) => host.trim()),
        before: (app, server, compiler) => {
            let hash = null;
            compiler.hooks.done.tap('__SHITTY_AUTO_RELOAD__', (stats) => {
                hash = stats.hash;
            });
            app.get('/__SHITTY_AUTO_RELOAD__', (req, res) => {
                res.json({ hash });
            });
        },
    },
});
