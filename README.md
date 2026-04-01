# Crypto Realtime Dashboard (Market Radar Engine)

FastAPIとWebSocketを活用した、暗号資産（仮想通貨）のリアルタイム価格監視ダッシュボードの基盤システムです。

## 🚀 特徴
- **リアルタイム更新**: Binance WebSocket APIから直接データを取得し、バックエンド経由でフロントエンドへ即時配信。
- **モダンなスタック**: Python (FastAPI) + Docker + Traefik によるスケーラブルな構成。
- **軽量フロントエンド**: Cloudflare Pages でのホスティングに最適化。
- **リバースプロキシ対応**: Traefik を使用し、独自ドメイン + SSL化済みの環境で動作。

## 🛠 技術スタック
- **Backend**: Python 3.11, FastAPI, WebSockets
- **Frontend**: HTML5, JavaScript (ES6+), Tailwind CSS v4
- **Infrastructure**: Docker, Docker Compose, Traefik
- **Database**: PostgreSQL 16 (今後、価格履歴保存に活用予定)
- **Deployment**: VPS (Self-hosted) & Cloudflare Pages

## 📦 セットアップ
### 1. 環境変数の設定
`.env.example`（または以下の内容）を参考に `.env` を作成してください。
```env
DOMAIN_CRYPTO_API=your-api-domain.com
POSTGRES_USER=admin
POSTGRES_PASSWORD=password
POSTGRES_DB=crypto_db
```

### 2. コンテナの起動
```bash
docker compose up -d --build
```

## 📅 今後の拡張予定 (Roadmap)
​[ ] 時系列データの蓄積: PostgreSQL (TimescaleDB) を活用した過去価格の保存。
​[ ] 高度なチャート実装: Lightweight Charts (TradingView) によるローソク足表示。
​[ ] マルチ通貨対応: BTC以外の主要アルトコインの同時監視。
​[ ] ユーザー管理機能: NISA/iDeCo等の個人資産管理と連携したポートフォリオ表示。
​
## 👤 作者
​GitHub: hisao5232
