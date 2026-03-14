---
title: "TypeMD 0.1.0 — 用物件思考的知識管理工具，正式登場"
description: "第一個正式版本釋出。從型別系統、雙向關聯到 TUI 瀏覽器，TypeMD 0.1.0 讓你用自己的方式管理知識。"
date: 2026-03-09
tags: [發布, 開發日誌]
---

經過一週的密集 Vibe 開發，TypeMD 的第一個正式版本 — **0.1.0** — 今天釋出了。

[上一篇文章](/zh-tw/posts/why-typemd/)聊了為什麼要做這個工具：你的知識應該存在你自己的檔案裡，用你自己定義的結構。0.1.0 是這個想法第一次變成可以真正使用的東西。它不完美，但核心已經站穩了。

## 你的知識，你的型別

大多數筆記工具讓你寫筆記，但不讓你定義「這是什麼」。TypeMD 不一樣 — 你先定義型別，再建立物件。

比如你是個重度讀者，你可以定義一個 `book` 型別：

```yaml
name: book
emoji: 📖
properties:
  - name: author
    type: relation
    target: person
  - name: year
    type: number
  - name: rating
    type: number
```

然後每一本書就是一個 Markdown 檔案，帶著你定義的結構。不是某個 app 的資料庫格式，就是純文字。

## 連結，不只是標籤

知識管理工具最常見的組織方式是標籤和資料夾。但真正的知識是*連結*出來的 — 一本書有作者，一個作者寫了多本書，一個概念引用了其他概念。

TypeMD 的 relation 系統讓你建立雙向連結：

```bash
tmd relation link book/clean-code-01jqr... author person/robert-martin-01jqr...
```

反向的連結會自動建立。你也可以在 Markdown 內文中用 wiki-link 語法 `[[person/robert-martin-01jqr...]]` 來引用其他物件，backlink 會自動追蹤。

## 在終端機裡瀏覽你的知識庫

CLI 是 TypeMD 的根基，但有時候你只是想瀏覽、翻翻看。0.1.0 附帶了一個用 Bubble Tea 打造的 TUI，三欄式的佈局讓你一眼看到物件列表、內文和屬性。

你可以在裡面直接編輯、搜尋、調整面板大小，甚至外部修改檔案後它會自動刷新。按 `?` 就能看到所有快捷鍵。

```bash
tmd tui
```

## 全文搜尋，找到任何東西

有了 SQLite FTS5 加持，`tmd search` 可以在整個知識庫裡做全文搜尋。在 TUI 裡按 `/` 也能直接搜尋。當你的物件越來越多，這個功能會越來越重要。

## 讓 AI 讀懂你的知識庫

TypeMD 內建 MCP server，讓 Claude 這樣的 AI 助手可以直接搜尋和讀取你的知識庫。

```bash
tmd mcp
```

這代表你可以在對話中直接問 AI「我讀過哪些關於軟體架構的書？」，它會去你的知識庫裡找答案。

## 安裝

```bash
brew install typemd/tap/typemd-cli
```

或從 [GitHub Releases](https://github.com/typemd/typemd/releases/tag/v0.1.0) 下載預編譯的執行檔。

## 接下來

0.1.0 是起點。下一個版本 0.2.0 會讓型別系統更豐富 — pinned properties、property emoji 等功能，讓你的知識結構表達力更強。

有興趣的話，專案在 [github.com/typemd/typemd](https://github.com/typemd/typemd) 開源。
