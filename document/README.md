# Tuning the backend Contest 2024

## ディレクトリ構造

```
.
├── .da          # 初期データのバックアップ、SSL証明書などの保管場所
├── app          # バックエンド、フロントエンド、nginx、mysqlの初期実装
├── benchmarker  # ベンチマーカー
├── document     # 各種ドキュメント
├── images       # アプリケーションで使う画像の置き場所
├── provisioning # セットアップ用
├── volume       # mysqlのデータボリューム
```

## ドキュメント

競技開始後、[はじめに](./md/start/00_Scenario.md)を読み[最初にやること](./md/start/01_Start.md)を完了してください。

- まずは
  - [はじめに](./md/start/00_Scenario.md)
  - [最初にやること](./md/start/01_Start.md)
- [ローカル環境での開発](./md/setup/00_Local.md)
- サービスと競技について
  - [サービス概要](./md/env/00_Service.md)
  - [競技の概要と環境](./md/env/01_Env.md)
  - [採点について](./md/env/02_Scoring.md)
  - [スクリプトの紹介](./md/env/03_Scripts.md)
- レギュレーションと FAQ
  - [レギュレーション](./md/rules/00_Rule.md)
  - [FAQ](./md/rules/01_FAQ.md)
- [API 設計書](./openapi/openapi.yaml)

このディレクトリに含まれる画像の利用条件は、Adobe Stock サービスの規約に準じます。
詳細は以下のページをご参照ください。
https://stock.adobe.com/jp/license-terms
