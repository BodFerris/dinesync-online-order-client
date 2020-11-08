const CopyPlugin = require("copy-webpack-plugin");
const path = require("path");

module.exports = {
    configureWebpack: () => {
        if (process.env.NODE_ENV === 'production') {
            return {
                plugins: [
                    new CopyPlugin(
                        {
                            patterns: [
                                {
                                    from: path.resolve(__dirname, './environments/config-prod.js'),
                                    to: path.resolve(__dirname, './dist/js/config.js')
                                }
                            ]
                        }
                    )
                ]
            }
        }
        else {
            return {
                plugins: [
                    new CopyPlugin(
                        {
                            patterns: [
                                {
                                    from: path.resolve(__dirname, './environments/config-dev.js'),
                                    to: path.resolve(__dirname, './dist/js/config.js')
                                }
                            ]
                        }
                    )
                ]
            }
        }
    }
}