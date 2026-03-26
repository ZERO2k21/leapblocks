const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

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
            "events": require.resolve("events/") // occasionally needed
        },
        alias: {
            '@blockly-runtime': path.resolve(__dirname, 'src/blockly/runtime.ts'),
            // Stub serialport if used
            serialport: false,
            electron: false
        }
    },
    optimization: {
        // Disable scope hoisting to prevent TDZ (Temporal Dead Zone) errors
        // in production builds where const/class declarations get reordered
        concatenateModules: false,
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
    ],
};
