# Project Workflow & Security

## Git & Commits
- **Commit Tool**: Use the `git-staged-commit` skill whenever possible to ensure consistency.
- **Standard**: Follow [Conventional Commits](https://www.conventionalcommits.org/).
  - `feat`: New features.
  - `fix`: Bug fixes.
  - `docs`: Documentation only.
  - `style`: Formatting, missing semi-colons, etc.
  - `refactor`: Code change that neither fixes a bug nor adds a feature.
  - `test`: Adding missing tests or correcting existing tests.
  - `chore`: Updating build tasks, package manager configs, etc.

## Environment Variables
- **Security**: Never commit `.env` or any file containing secrets. Ensure they are in `.gitignore`.
- **Backend**: Use `dotenv` to load variables. Access via `process.env`.
- **Frontend**: Variables must be prefixed with `VITE_` (e.g., `VITE_API_URL`). Access via `import.meta.env`.
- **Validation**: Prefer using Zod to validate environment variables at startup.

## Build & Analysis
- **Bundle Analysis**: Run `bun run analyze` (which executes `vite build --mode analyze`) before major frontend releases to monitor bundle size.
- **Production Build**: Always verify the build locally using `bun run build` after significant changes to shared or frontend code.
