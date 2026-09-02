# Playwright TypeScript project guidance

- Use POM and reusable components.
- Prefer getByRole/getByLabel/getByText over CSS/XPath.
- Never add fixed sleeps.
- Keep tests independent and parallel-safe.
- Never put secrets in source control.
- Test data must be deterministic and unique per test.
- Keep product-specific values in data files, not page objects.
- Attach meaningful diagnostics on failures.
- Do not make runtime test execution dependent on an AI service.
