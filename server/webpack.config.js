const path = require('path');
const { CleanWebpackPlugin: Clean } = require('clean-webpack-plugin');

module.exports = (env, argv) => ({
    target: 'node',
    mode: argv.mode || 'development',
    entry: {
        lambda: './src/lambda.ts',
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
        ],
    },
    output: {
        filename: '[name].js',
        path: path.resolve(__dirname, 'build'),
        libraryTarget: 'commonjs',
    },
    plugins: [new Clean()],
});
