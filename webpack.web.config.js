const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const CompressionPlugin = require('compression-webpack-plugin');

module.exports = {
    mode: 'production',
    entry: './src/renderer.tsx',
    target: 'web',
    output: {
        path: path.resolve(__dirname, 'build'),
        filename: '[name].[contenthash].js',
        publicPath: '/',
    },
    resolve: {
        extensions: ['.js', '.ts', '.jsx', '.tsx', '.css'],
        fallback: {
            "fs": false,
            "path": false,
            "os": false,
            "child_process": false,
            "serialport": false,
            "electron": false,
            "events": require.resolve("events/")
        },
        alias: {
            '@blockly-runtime': path.resolve(__dirname, 'src/blockly/runtime.ts'),
            serialport: false,
            electron: false
        }
    },
    optimization: {
        concatenateModules: false,
        splitChunks: {
            chunks: 'all',
            cacheGroups: {
                blockly: {
                    test: /[\\/]node_modules[\\/]blockly[\\/]/,
                    name: 'blockly',
                    chunks: 'all',
                    priority: 20,
                },
                vendors: {
                    test: /[\\/]node_modules[\\/]/,
                    name: 'vendors',
                    chunks: 'all',
                    priority: 10,
                },
                // Do NOT split app source code — keep evaluation order stable
                default: {
                    minChunks: 2,
                    reuseExistingChunk: true,
                },
            },
        },
        runtimeChunk: 'single',
    },
    module: {
        rules: [
            {
                test: /\.[jt]sx?$/,
                exclude: /node_modules/,
                use: [
                    {
                        loader: 'ts-loader',
                        options: {
                            transpileOnly: true,
                        }
                    }
                ]
            },
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader', 'postcss-loader'],
            },
            {
                test: /\.(png|jpe?g|gif|svg|woff|woff2|eot|ttf|otf)$/i,
                type: 'asset/resource',
            },
        ],
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: './src/index.html',
        }),
        new CopyWebpackPlugin({
            patterns: [
                { from: path.resolve(__dirname, 'public'), to: '.' },
            ],
        }),
        new BundleAnalyzerPlugin({
            analyzerMode: 'static',
            openAnalyzer: false,
            reportFilename: 'bundle-report.html',
        }),
        new CompressionPlugin({
            algorithm: 'gzip',
            test: /\.(js|css|html|svg)$/,
            threshold: 10240,
            minRatio: 0.8,
        }),
    ],
};
