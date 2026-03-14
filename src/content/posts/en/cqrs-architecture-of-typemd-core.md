---
title: "CQRS Architecture of TypeMD Core"
description: "Why does a local-first CLI tool need CQRS? From read-write separation and Repository abstractions to domain events — how TypeMD core's architecture evolved."
date: 2026-03-14
tags: [architecture, devlog]
---

TypeMD is a local-first knowledge management tool. Objects are stored as Markdown files, indexed in SQLite, everything on your local disk. Why would something this simple need CQRS?

Because it lives in two worlds.

## Two worlds

TypeMD reads data in two ways. The first is reading directly from Markdown files — the source of truth, always correct, but slow. The second is querying the SQLite index — an acceleration layer, fast but potentially stale.

Writes also have two targets. Creating an object means writing a file and updating the index. Removing a relation means modifying a file's frontmatter and cleaning up index records.

Initially, all of this was mixed together. The `Vault` struct directly manipulated the filesystem and SQLite, with methods spanning hundreds of lines peppered with `os.WriteFile` calls and SQL statements. It worked, but every new feature meant wrestling with the existing code.

## Separating reads and writes

CQRS (Command Query Responsibility Segregation) is a straightforward idea: reads and writes take different paths.

In TypeMD, this becomes two services:

**ObjectService** handles all write operations — creating objects, saving, linking relations, unlinking:

```go
type ObjectService struct {
    repo       ObjectRepository
    index      ObjectIndex
    dispatcher *EventDispatcher
}
```

**QueryService** handles all read operations — querying, searching, resolving IDs, listing relations:

```go
type QueryService struct {
    repo  ObjectRepository
    index ObjectIndex
}
```

Both depend on `ObjectRepository` and `ObjectIndex`, but use them differently. ObjectService writes files + updates the index (dual write). QueryService queries the index + reads files when needed.

## Repository and Index: two interfaces

Clean separation requires clean abstractions. We defined two interfaces:

**ObjectRepository** abstracts the source of truth. It returns domain entities (`*Object`, `*TypeSchema`), not raw bytes:

```go
type ObjectRepository interface {
    Get(id string) (*Object, error)
    Save(obj *Object, keyOrder []string) error
    Create(obj *Object, keyOrder []string) error
    Walk() ([]*Object, error)
    // ... type schema, template, shared property operations
}
```

The concrete implementation, `LocalObjectRepository`, handles all filesystem details — path conventions, YAML serialization, frontmatter parsing. Callers don't need to know where objects live or what format they're in.

**ObjectIndex** abstracts the acceleration layer. Queries return lightweight `ObjectResult` projections, not full domain entities:

```go
type ObjectResult struct {
    ID         string
    Type       string
    Filename   string
    Properties map[string]any
    Body       string
}
```

Need the full entity? Go back to `ObjectRepository.Get(id)` and read the file. The index is responsible for "finding," not "giving you everything."

## Vault becomes a Facade

Before the refactor, `Vault` was a God Object that did everything. After, it does just two things:

1. **DI container** — assembles all dependencies:

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

2. **Facade** — external consumers (CLI, TUI, MCP) access functionality through `vault.Objects.Create(...)` and `vault.Queries.Search(...)`, without needing to know how many services exist behind the scenes.

## Projector: keeping the index in sync

Files are the source of truth. The index is derived data. They can fall out of sync — a user edits a Markdown file directly, a `git pull` brings in new objects, or the index database gets deleted.

The `Projector` projects Repository state into the Index:

```go
type Projector struct {
    repo  ObjectRepository
    index ObjectIndex
}

func (p *Projector) Sync() (*SyncResult, error) {
    objects, _ := p.repo.Walk()  // read all files
    // diff with index, upsert/remove as needed
}
```

It doesn't care about business logic — only synchronization. The timing is simple too: on startup when the index needs updating, or when the user requests `--reindex`.

## Domain events

Entity operations now produce events. `Object.SetProperty()` returns a `PropertyChanged` event. `ObjectService.Create()` collects all events and dispatches them after a successful operation:

```go
// Entity layer — produces events
func (o *Object) SetProperty(key string, value any, schema *TypeSchema) (DomainEvent, error) {
    old := o.Properties[key]
    o.Properties[key] = value
    return PropertyChanged{ObjectID: o.ID, Key: key, Old: old, New: value}, nil
}

// Use case layer — collects and dispatches
func (s *ObjectService) SetProperty(id, key string, value any) error {
    // ... load object, validate, set property ...
    s.dispatcher.Dispatch(events)
    return nil
}
```

Six event types are currently defined:

| Event | When |
|-------|------|
| `ObjectCreated` | New object created |
| `ObjectSaved` | Existing object saved |
| `PropertyChanged` | Property value changed |
| `ObjectLinked` | Relation created |
| `ObjectUnlinked` | Relation removed |
| `TagAutoCreated` | Tag auto-created during sync |

There are few subscribers for now — the TUI uses events to refresh the screen. But this foundation opens up possibilities for the future: webhooks, a plugin system, real-time sync.

## Is this architecture right for a small project?

Honestly, if TypeMD only ever had one consumer (the CLI), CQRS would probably be overkill. But there are now three consumers: CLI, TUI, and MCP Server, with a Web UI planned.

Read-write separation lets each consumer take only what it needs. The CLI mostly uses ObjectService. The TUI heavily relies on QueryService to drive the UI. The MCP Server uses both.

Repository abstractions make testing easier. BDD tests don't need a real filesystem or SQLite — mock Repository and Index are enough.

Domain events let the TUI update the screen after object changes without polling.

These benefits together are worth the extra interfaces and structs.

## The big picture

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

Files are the source of truth. SQLite is the acceleration layer. Reads and writes take different paths, but they all lead back to the same fact — those Markdown files on your disk.
