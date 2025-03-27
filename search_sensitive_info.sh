#!/bin/bash

# APIキーのパターン
API_KEY_PATTERN="AIzaSyCi9zffZ9DKqlH20MlYlMOdgIcgyWYsqdk"
AUTH_DOMAIN="history-9a233.firebaseapp.com"
PROJECT_ID="history-9a233"

# 検索対象のディレクトリ
SEARCH_DIR="/Users/sugisaki/Documents/GitHub/learning-app-origin"

echo "機密情報検索を開始します..."

# ファイル内容を検索
echo "APIキーを含むファイルを検索中..."
find "$SEARCH_DIR" -type f -exec grep -l "$API_KEY_PATTERN" {} \;

echo "Auth Domainを含むファイルを検索中..."
find "$SEARCH_DIR" -type f -exec grep -l "$AUTH_DOMAIN" {} \;

echo "Project IDを含むファイルを検索中..."
find "$SEARCH_DIR" -type f -exec grep -l "$PROJECT_ID" {} \;

# テキストファイルのみを検索（バイナリファイルを除外）
echo "テキストファイル内の機密情報を検索中..."
find "$SEARCH_DIR" -type f -print0 | xargs -0 grep -l "$API_KEY_PATTERN"
