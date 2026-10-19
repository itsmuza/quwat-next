Go outside of this project and read quwat/docs/ai first!

# Quwat Frontend Modification Instructions

This client project is being migrated from nestar-next to quwat-next

## Rules

- Preserve current project architecture
- Keep graphql/apollo integration
- Do not rewrite the whole app
- Improve UI incrementally

## Backend context

Before making any changes, read files inside docs/ai which belongs to backend application

## Workflow

1. Analyze before editing.
2. Backend is running on port http://localhost:3007/graphql now.
3. Make small incremental changes.
4. Run typecheck after each phase.
5. Do not remove working logic unless replaced safely.
6. Update quwat/docs/ai/COMPLETED_TASKS.md after major changes.

## Package Manager

- Use yarn for all frontend commands.
- Do not use npm or pnpm.
- Install dependencies with:

```bash
yarn install
```
