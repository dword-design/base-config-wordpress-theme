import { CleanWebpackPlugin } from 'clean-webpack-plugin'

export default {
  entry: {
    index: './src/index.js',
  },
  mode: process.env.NODE_ENV || 'development',
  plugins: [new CleanWebpackPlugin()],
}
