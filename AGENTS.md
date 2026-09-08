# Repository Rules

## Project and Architecture
- Preserve the `front-end/` and `back-end/` separation.
- Read relevant existing code before changes. Follow existing naming, folder, API, service, hook, controller, model, and UI conventions.
- Prefer extending existing implementations over creating parallel duplicates.
- Make the smallest maintainable change; avoid unrelated refactoring.

## Frontend
- Preserve React 19, TypeScript, Vite 8, React Router 6, Tailwind CSS 3, Radix UI, TanStack Query 5, Axios, React Hook Form, Zod, and Recharts.
- Reuse shared UI components and design conventions. Keep UI text predominantly Spanish unless context requires otherwise.
- Do not replace the design system or introduce a UI library without explicit approval.
- Distinguish demo/localStorage-backed teacher and classroom features from backend-persisted features. Claim persistence only when an actual API/database path exists.
- Use `frontend-validator` for affected frontend code.

## Backend
- Preserve Node.js/TypeScript, Express 4 REST conventions under `/api`, and Sequelize 6.
- Reuse existing routes, controllers, middleware, services, models, and utilities, including established express-validator, Helmet, CORS, Morgan, PDFKit, and ExcelJS patterns.
- Preserve authentication and role middleware. Validate input and handle errors consistently.
- Do not unnecessarily expose stack traces or sensitive internal data; never expose secrets.
- Use `backend-validator` for affected backend code.

## Database
- Treat PostgreSQL as the active runtime database. Treat SQLite references as legacy/examples unless current evidence proves otherwise.
- Do not assume Supabase configuration has active consumers; verify runtime use before relying on it.
- Inspect Sequelize models and associations before changing data structures.
- Require explicit approval for destructive schema/data operations. Never delete or rewrite real data to make tests pass.
- No versioned migration system is currently established: do not silently introduce risky schema changes. Flag changes requiring migrations/versioning.
- Use `database-validator` for database-related changes.

## Authentication and Authorization
- Preserve custom email/password authentication through Express using bcrypt and JWT unless explicitly asked to redesign it. Do not assume Supabase handles authentication.
- Preserve frontend protected routes, but enforce authorization through backend authentication and role middleware.
- Browser token/user storage currently uses localStorage; do not treat stored user or role values as authorization evidence.
- Do not trust user-supplied role or user identifiers without backend authorization checks.
- Check admin, teacher, student, and parent boundaries carefully. Do not invent permissions unsupported by requirements or existing code.

## Security and Minor Data
- Treat student/minor and representative information as sensitive. Apply least privilege.
- Never hardcode, print, log, commit, or expose passwords, JWT secrets, database URLs, private keys, tokens, or credentials.
- Treat plaintext credentials found in documentation as potentially compromised; never reuse, copy, or propagate them.
- Do not place secrets in frontend code or Vite-exposed environment variables.
- Use `security-reviewer` for security-sensitive changes.

## Testing and Validation
- Do not claim a change works based only on code inspection.
- Run the cheapest relevant checks first; prefer targeted validation before broad validation.
- Use existing frontend build/lint checks and backend build/tests when relevant.
- Backend tests may access PostgreSQL: inspect their environment and effects before running them.
- Require explicit approval for destructive or environment-affecting tests.
- Report validation results and any checks that could not be completed, with reasons.

## Design Work
- For significant frontend visual changes, use applicable available design skills: `gpt-taste`, `impeccable`, and `emil-design-eng`.
- Preserve usability, responsiveness, accessibility, and functional behavior.
- Active design skills do not authorize redesigning unrelated screens.

## Git and File Safety
- Do not commit, push, merge, rebase, or delete branches unless explicitly requested.
- Modify only files relevant to the task.
- Do not add generated, local-only, secret, or temporary files to version control.
- Before finishing, report relevant changed files and validation evidence.

## Documentation
- Prefer current code/configuration over conflicting outdated documentation.
- Explicitly report architecture/documentation inconsistencies instead of silently following stale documentation.
- Do not rewrite documentation outside the task scope.

## Communication
- Keep progress and final responses concise.
- Report important decisions, changed files, validation results, blockers, risks, and anything requiring approval.
- Do not narrate every file read or obvious command.

## Instruction Priority
- Explicit user instructions take precedence over conflicting skill guidance.
- Repository AGENTS.md rules remain active when specialized skills are used.
- Use personal skills for detailed procedures; do not duplicate those procedures here.
