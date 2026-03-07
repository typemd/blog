---
title: "為什麼我要打造 TypeMD"
description: "一個 local-first CLI 知識管理工具的誕生故事 — 為什麼檔案很重要、「用物件思考」是什麼意思、以及我們要往哪裡去。"
date: 2026-03-07
tags: [開發日誌, 理念]
---

我用過的每一個知識管理工具，都在做同樣的取捨：你得到了漂亮的介面，但你的資料住在別人的伺服器上，用別人的格式。Notion、Roam、Obsidian（程度輕一些）— 它們都假設工具*本身*就是系統。

我想要的是不一樣的東西。

## 檔案即真實來源

TypeMD 從一個簡單的前提出發：**你的知識應該存在純 Markdown 檔案裡**，在你自己的電腦上，在你自己的 Git repo 中。沒有鎖定。沒有你讀不懂的資料庫。沒有公司轉型時的遷移恐慌。

每個物件 — 一本書、一個人、一個想法 — 都是一個帶有 YAML frontmatter 的 Markdown 檔案。Schema 定義在簡單的 YAML type 定義裡。SQLite index 讓查詢變快，但它是衍生的；你隨時可以從檔案重建它。

```
objects/
  book/
    golang-in-action-01jqr3k5mp.md
  person/
    rob-pike-01jqr4n8xz.md
```

就這樣。`cat` 它。`grep` 它。用版本控制管理它。它就是純文字。

## 用物件思考，而非檔案

但光有純檔案還不夠。TypeMD 背後的洞察是：知識有*結構*。一本書有作者。一個作者寫了多本書。一個想法引用其他想法。

TypeMD 給你**帶有型別的物件和關聯**。你定義一個 type schema：

```yaml
name: book
properties:
  - name: author
    type: relation
    target: person
  - name: year
    type: number
  - name: rating
    type: number
```

CLI 理解這些連結。你可以查詢、連結、遍歷你的知識圖譜 — 全部在終端機裡完成。

## 為什麼是 CLI？

因為 CLI 可以組合。你可以把 `tmd query` 的輸出 pipe 進 `jq`。你可以用腳本批次操作。你可以和你的編輯器、你的 shell、你的工作流程整合。

但光有 CLI 也不夠。TypeMD 同時提供 MCP server，讓 Claude 這樣的 AI 助手可以直接讀寫你的知識庫。還有一個用 Bubble Tea 打造的 TUI，讓你可以互動式瀏覽。

## 最近在做什麼

過去幾週都在磨利基礎：

- **ULID 檔名** — 物件現在會加上 ULID 後綴（`book/golang-in-action-01jqr3k5mp.md`），即使跨同步的 repo 也不會有命名衝突。
- **Migration 系統** — `tmd migrate` 讓你隨時間演進 type schema，不會破壞既有物件。
- **孤兒清理** — indexer 現在會在同步時自動偵測和移除過期的 relation。
- **文件國際化** — 文件網站現在支援繁體中文（zh-TW），因為這個專案從台灣出發，理應在這裡也方便使用。

## 接下來呢

路線圖清晰但有野心：

1. **Web UI** — 本地的網頁介面，用來視覺化瀏覽和編輯
2. **Marketplace** — 可分享的 type schema 和 plugin
3. **桌面應用程式** — 透過 Wails，把 Web UI 包裝在原生外殼裡

但核心理念不會變：你的檔案是你的。工具服務資料，不是反過來。

---

如果這個理念引起你的共鳴，專案在 [github.com/typemd/typemd](https://github.com/typemd/typemd) 開源。歡迎 star、開 issue、貢獻程式碼。
