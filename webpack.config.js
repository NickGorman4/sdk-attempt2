const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const CopyPlugin = require("copy-webpack-plugin");

module.exports = {
  mode: "development",
  entry: {
    app: "./src/index.ts",
  },
  devtool: "source-map",
  resolve: {
    extensions: [".js", ".ts", ".json"],
  },
  plugins: [
    new CleanWebpackPlugin(),
    new HtmlWebpackPlugin({
      title: "Development",
      template: "index.html",
      inject: true,
    }),
    new CopyPlugin([{ from: "bundle", to: "bundle" }]),
  ],
  module: {
    rules: [
      {
        test: /\.ts?$/,
        loader: "ts-loader",
      },
      {
        test: /\.(png|svg|jpg|gif)$/,
        use: [
            'file-loader',
        ],
      },
    ],
  },
  output: {
    filename: "[name].bundle.js",
    path: path.resolve(__dirname, "dist"),
  },
  devServer: {
    port: 8000,
  },
};
