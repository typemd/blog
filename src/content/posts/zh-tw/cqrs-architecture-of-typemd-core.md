---
title: "TypeMD Core 的 CQRS 架構"
description: "為什麼一個本地優先的 CLI 工具需要 CQRS？從讀寫分離、Repository 抽象到領域事件，聊聊 TypeMD core 的架構演進。"
date: 2026-03-14
tags: [架構, 開發日誌]
---

TypeMD 是一個本地優先的知識管理工具。物件存成 Markdown，索引放 SQLite，所有東西都在你的硬碟上。這麼簡單的工具，為什麼需要 CQRS？

答案是：因為它有兩個世界。

## 兩個世界

TypeMD 有兩種方式讀取資料。第一種是直接從 Markdown 檔案讀——這是 source of truth，永遠正確，但慢。第二種是從 SQLite 索引查——這是加速層，快但可能過期。

寫入也有兩個目標。建立物件要寫檔案，同時更新索引。刪除 relation 要改檔案的 frontmatter，同時清理索引中的紀錄。

一開始，這些全混在同一層。`Vault` 結構體直接操作檔案系統和 SQLite，幾百行的方法裡穿插著 `os.WriteFile` 和 SQL 語句。能用，但每次加新功能都在跟既有的程式碼纏鬥。

## 讀寫分離

CQRS（Command Query Responsibility Segregation）的核心概念很直覺：讀跟寫走不同的路。

在 TypeMD 裡，這變成兩個 service：

**ObjectService** 負責所有寫入操作——建立物件、儲存、建立 relation、解除 relation：

```go
type ObjectService struct {
    repo       ObjectRepository
    index      ObjectIndex
    dispatcher *EventDispatcher
}
```

**QueryService** 負責所有讀取操作——查詢、搜尋、解析 ID、列出 relation：

```go
type QueryService struct {
    repo  ObjectRepository
    index ObjectIndex
}
```

兩者都依賴 `ObjectRepository` 和 `ObjectIndex`，但用法不同。ObjectService 寫檔案 + 更新索引（dual write），QueryService 查索引 + 必要時讀檔案。

## Repository 與 Index：兩個介面

讀寫分離的前提是抽象層要乾淨。我們定義了兩個介面：

**ObjectRepository** 是 source of truth 的抽象。它回傳領域實體（`*Object`、`*TypeSchema`），不是原始的 byte：

```go
type ObjectRepository interface {
    Get(id string) (*Object, error)
    Save(obj *Object, keyOrder []string) error
    Create(obj *Object, keyOrder []string) error
    Walk() ([]*Object, error)
    // ... type schema, template, shared property operations
}
```

具體的實作 `LocalObjectRepository` 負責所有檔案系統的細節——路徑規則、YAML 序列化、frontmatter 解析。呼叫者不需要知道物件存在哪、格式長什麼樣。

**ObjectIndex** 是加速層的抽象。查詢回傳輕量的 `ObjectResult`（投影），不是完整的領域實體：

```go
type ObjectResult struct {
    ID         string
    Type       string
    Filename   string
    Properties map[string]any
    Body       string
}
```

需要完整實體？回頭用 `ObjectRepository.Get(id)` 讀檔案。索引只負責「找到」，不負責「給你全部」。

## Vault 變成 Facade

重構前，`Vault` 是一個什麼都做的 God Object。重構後，它只做兩件事：

1. **DI 容器**——組裝所有依賴：

```go
func (v *Vault) Open() error {
    // ...
    v.Events = NewEventDispatcher()
    v.Objects = NewObjectService(v.repo, v.index, v.Events)
    v.Queries = NewQueryService(v.repo, v.index)
    v.projector = NewProjector(v.repo, v.index, createTag)
    // ...
}
```

2. **Facade**——外部消費者（CLI、TUI、MCP）透過 `vault.Objects.Create(...)` 和 `vault.Queries.Search(...)` 存取功能，不需要知道背後有幾個 service。

## Projector：保持索引同步

檔案是 source of truth，索引是衍生資料。兩者可能不同步——使用者直接用編輯器改了 Markdown 檔案、Git pull 帶進新物件、或者索引資料庫被刪除。

`Projector` 負責把 Repository 的狀態投影到 Index：

```go
type Projector struct {
    repo  ObjectRepository
    index ObjectIndex
}

func (p *Projector) Sync() (*SyncResult, error) {
    objects, _ := p.repo.Walk()  // 讀取所有檔案
    // diff with index, upsert/remove as needed
}
```

它不關心商業邏輯，只關心同步。Sync 的時機也很單純——啟動時發現索引需要更新，或使用者要求 `--reindex`。

## 領域事件

實體操作現在會產生事件。`Object.SetProperty()` 回傳一個 `PropertyChanged` 事件，`ObjectService.Create()` 蒐集所有事件並在操作成功後分派：

```go
// 實體層——產生事件
func (o *Object) SetProperty(key string, value any, schema *TypeSchema) (DomainEvent, error) {
    old := o.Properties[key]
    o.Properties[key] = value
    return PropertyChanged{ObjectID: o.ID, Key: key, Old: old, New: value}, nil
}

// 使用情境層——蒐集並分派
func (s *ObjectService) SetProperty(id, key string, value any) error {
    // ... load object, validate, set property ...
    s.dispatcher.Dispatch(events)
    return nil
}
```

目前定義了六種事件：

| 事件 | 時機 |
|------|------|
| `ObjectCreated` | 新物件建立 |
| `ObjectSaved` | 既有物件儲存 |
| `PropertyChanged` | 屬性值變更 |
| `ObjectLinked` | 建立 relation |
| `ObjectUnlinked` | 移除 relation |
| `TagAutoCreated` | Sync 時自動建立標籤 |

現在的訂閱者很少——TUI 用事件來更新畫面。但這個基礎為未來的功能打開了可能性：webhook、外掛系統、即時同步。

## 這套架構適合小專案嗎？

坦白說，如果 TypeMD 永遠只有一個消費者（CLI），CQRS 大概是過度設計。但現在有三個消費者：CLI、TUI、MCP Server，未來還會有 Web UI。

讀寫分離讓每個消費者可以只取用它需要的部分。CLI 幾乎只用 ObjectService；TUI 大量使用 QueryService 來驅動畫面；MCP Server 兩者都用。

Repository 抽象讓測試變容易。BDD 測試不需要真正的檔案系統或 SQLite——mock Repository 和 Index 就夠了。

領域事件讓 TUI 能在物件變更後更新畫面，不需要輪詢。

這些好處加起來，值得多出來的那幾個介面和結構體。

## 全貌

```
Consumers:  CLI / TUI / MCP
               |
Facade:     Vault (DI + lifecycle)
               |
Use Cases:  ObjectService (write)  QueryService (read)  Projector (sync)
               |                        |                     |
Domain:     Object  TypeSchema  ObjectID  DomainEvent
               |                        |                     |
Infra:      ObjectRepository        ObjectIndex
            (LocalObjectRepository)  (SQLiteObjectIndex)
            (Markdown files)         (SQLite)
```

檔案是 source of truth。SQLite 是加速層。讀跟寫走不同的路，但最終都回到同一個事實——你硬碟上的那些 Markdown 檔案。
