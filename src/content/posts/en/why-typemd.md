---
title: "Why I'm Building My Own Knowledge Management Tool"
description: "The story behind TypeMD — where existing tools didn't fit my workflow, why files matter, and what 'thinking in objects' means."
date: 2026-03-07
tags: [devlog, philosophy]
---

Every knowledge management tool I've used makes the same trade-off: you get a slick interface, but your data lives on someone else's server, in someone else's format. Notion, Roam, Obsidian (to a lesser extent) — they all assume the tool *is* the system.

I wanted something different.

## Files as the source of truth

TypeMD starts from a simple premise: **your knowledge should live in plain Markdown files**, on your own machine, in your own Git repo. No lock-in. No database you can't read. No migration panic when the company pivots.

Each object — a book, a person, an idea — is a Markdown file with YAML frontmatter. The schema is defined in simple YAML type definitions. A SQLite index makes things fast, but it's derived; you can rebuild it anytime from the files alone.

```
objects/
  book/
    golang-in-action-01jqr3k5mp.md
  person/
    rob-pike-01jqr4n8xz.md
```

That's it. `cat` it. `grep` it. Version control it. It's just text.

## Thinking in objects, not files

But plain files aren't enough. The insight behind TypeMD is that knowledge has *structure*. A book has an author. An author has written multiple books. An idea references other ideas.

TypeMD gives you **typed objects with relations**. You define a type schema:

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

And the CLI understands these connections. You can query, link, and traverse your knowledge graph — all from the terminal.

## Why a CLI?

Because CLIs compose. You can pipe `tmd query` into `jq`. You can script bulk operations. You can integrate with your editor, your shell, your workflow.

But a CLI alone isn't enough either. TypeMD also ships an MCP server, so AI assistants like Claude can read and write your knowledge base directly. And there's a TUI (built with Bubble Tea) for when you want to browse interactively.

## What's been happening lately

The past few weeks have been about sharpening the foundation:

- **ULID-based filenames** — objects now get a ULID suffix (`book/golang-in-action-01jqr3k5mp.md`) so you never have naming collisions, even across synced repos.
- **Migration system** — `tmd migrate` lets you evolve type schemas over time without breaking existing objects.
- **Orphan cleanup** — the indexer now detects and removes stale relations automatically during sync.
- **Internationalized docs** — the documentation site now supports Traditional Chinese (zh-TW), because this project started in Taiwan and should be accessible here.

## What's next

The roadmap is clear but ambitious:

1. **Web UI** — a local web interface for visual browsing and editing
2. **Marketplace** — shareable type schemas and plugins
3. **Desktop app** — via Wails, wrapping the web UI in a native shell

But the core philosophy won't change: your files are yours. The tool serves the data, not the other way around.

---

If this resonates with you, the project is open source at [github.com/typemd/typemd](https://github.com/typemd/typemd). Stars, issues, and contributions are all welcome.
