# web/AGENTS.md

`web/` 안에서 일할 때 루트 `AGENTS.md` 에 더해 적용된다.
- 아래 블록은 Next.js 가 제공하는 공식 안내다 (설치된 16.4 버전 기준 문서는 `web/node_modules/next/dist/docs/`, `npm install` 후 생긴다). 지우지 않는다. `next dev` 가 다시 만든다.
- 화면과 UI 부품 작업은 `shadcn-ui` 스킬(`.agents/skills/shadcn-ui/`)의 규칙을 따른다.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
