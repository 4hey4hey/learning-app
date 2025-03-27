#!/bin/bash

# プロジェクト分析スクリプト

# 必要なツールのインストール
npm install -g eslint eslint-plugin-react eslint-plugin-react-hooks madge source-map-explorer

# ESLintによる静的解析
echo "ESLint静的解析の開始..."
eslint src --ext .js,.jsx --config ./analysis-config.json > eslint-report.json

# コードの循環的複雑度と依存関係分析
echo "依存関係マップの生成..."
madge --json src > dependency-graph.json

# バンドルサイズ分析
echo "バンドルサイズ分析..."
source-map-explorer 'build/static/js/*.js' > bundle-analysis.txt

# 大きなファイルの特定
echo "大きなファイルの特定..."
find src -type f -name "*.js" -exec wc -l {} + | sort -rn > large-files.txt

# 分析結果の統合レポート生成
node generate-analysis-report.js

echo "分析完了！"
