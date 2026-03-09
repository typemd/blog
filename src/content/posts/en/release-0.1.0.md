---
title: "TypeMD 0.1.0 — Think in Objects, Manage Your Knowledge"
description: "The first official release is here. From typed schemas and bidirectional relations to a TUI browser, TypeMD 0.1.0 lets you manage knowledge your way."
date: 2026-03-09
tags: [release, devlog]
---

After a week of intense vibe coding, the first official release of TypeMD — **0.1.0** — is out today.

In the [previous post](/posts/why-typemd/), I talked about why I'm building this tool: your knowledge should live in your own files, with your own structure. 0.1.0 is the first time that idea becomes something you can actually use. It's not perfect, but the foundation is solid.

## Your knowledge, your types

Most note-taking tools let you write notes, but don't let you define *what something is*. TypeMD is different — you define types first, then create objects.

Say you're an avid reader. You can define a `book` type:

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

Each book becomes a Markdown file carrying the structure you defined. Not some app's proprietary database format — just plain text.

## Links, not just tags

The most common way to organize in knowledge tools is tags and folders. But real knowledge is *linked* — a book has an author, an author has written multiple books, a concept references other concepts.

TypeMD's relation system lets you create bidirectional links:

```bash
tmd relation link book/clean-code-01jqr... author person/robert-martin-01jqr...
```

The inverse link is created automatically. You can also use wiki-link syntax `[[person/robert-martin-01jqr...]]` inside Markdown body to reference other objects, and backlinks are tracked automatically.

## Browse your knowledge base in the terminal

The CLI is TypeMD's foundation, but sometimes you just want to browse. 0.1.0 ships with a TUI built with Bubble Tea — a three-panel layout that shows your object list, body, and properties at a glance.

You can edit inline, search, resize panels, and it auto-refreshes when files change externally. Press `?` to see all keybindings.

```bash
tmd tui
```

## Full-text search, find anything

Powered by SQLite FTS5, `tmd search` gives you full-text search across your entire knowledge base. Press `/` in the TUI to search there too. As your collection grows, this becomes essential.

## Let AI read your knowledge base

TypeMD ships with a built-in MCP server, letting AI assistants like Claude search and read your knowledge base directly.

```bash
tmd mcp
```

This means you can ask AI in conversation "What books have I read about software architecture?" and it will look up the answer from your knowledge base.

## Install

Homebrew (macOS/Linux):

```bash
brew install typemd/tap/typemd-cli
```

Or with Go:

```bash
go install github.com/typemd/typemd/cmd/tmd@latest
```

## What's next

0.1.0 is the starting point. The next release, 0.2.0, will enrich the type system — pinned properties, property emoji, and more, giving your knowledge structures greater expressiveness.

If this interests you, the project is open source at [github.com/typemd/typemd](https://github.com/typemd/typemd).
