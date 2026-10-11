# AI Agent Prompt: Build a Premium Expense Tracker with Next.js, Supabase, Analytics, and PWA Support

## 1. Project Overview

Act as a senior full-stack engineer, product designer, and UX architect. Build a complete, production-ready personal expense tracking web application using **Next.js, TypeScript, Supabase, and an Apple-inspired design system**.

The application should help users record, organize, track, analyze, and understand their personal spending through a beautiful, intuitive, responsive interface. It should feel like a premium native application, with the simplicity, refinement, consistency, and attention to detail associated with Apple's products.

This must be a fully functional application, not merely a visual prototype. All expenses, tags, categories, and user-specific preferences must persist in Supabase and be securely associated with the authenticated user.

The application must include:

- Personal expense management.
- Secure authentication and account-specific data storage.
- Comprehensive financial analytics and visualizations.
- Custom categories and tags.
- Importing and exporting expenses.
- Light mode, dark mode, and system theme support.
- Progressive Web App (PWA) functionality.
- A responsive, accessible, mobile-first experience.
- A clean, maintainable codebase.

**Important:** Before implementation, inspect the existing project and understand its structure, dependencies, conventions, and current state. If a project already exists, extend it rather than unnecessarily rebuilding it.

## 2. Technology Stack

Use the following technologies unless there is a strong technical reason to recommend an alternative.

- **Framework:** Latest stable Next.js using the App Router.
- **Language:** TypeScript with strict type checking.
- **UI:** React and Tailwind CSS.
- **Component primitives:** shadcn/ui with accessible Radix UI primitives where appropriate.
- **Icons:** Lucide React, using consistent icon sizing and stroke weights.
- **Backend and database:** Supabase PostgreSQL.
- **Authentication:** Supabase Auth with secure server-side session handling and the recommended Next.js integration.
- **Database security:** PostgreSQL Row Level Security (RLS).
- **Charts:** Recharts or another well-maintained React charting library.
- **Forms:** React Hook Form with Zod validation.
- **Date handling:** date-fns or an equivalent reliable library.
- **PWA:** Web app manifest, service worker, installation support, and appropriate caching strategies.
- **Package manager:** Use the package manager already present in the project. If starting from scratch, prefer pnpm.

Use stable, compatible package versions. Consult current official documentation instead of relying on outdated APIs or examples.

Avoid unnecessary dependencies and abstractions. Choose libraries that solve real problems and keep the application maintainable.

## 3. Design Philosophy: Apple-Inspired UI/UX

The design quality is one of the highest priorities of this project.

Follow the principles of Apple's Human Interface Guidelines while adapting them appropriately for a modern web application. The goal is not to copy a particular Apple application but to achieve a similarly refined, intuitive, and cohesive user experience.

### Visual direction

The application should feature:

- A clean, minimal, premium aesthetic.
- Generous whitespace and carefully controlled visual density.
- Strong typography and clear information hierarchy.
- Refined spacing, alignment, and proportions.
- Subtle borders, restrained shadows, and tasteful surface treatments.
- Rounded corners used consistently, not excessively.
- Smooth, purposeful transitions and micro-interactions.
- A restrained accent color and a cohesive semantic color palette.
- High-quality empty states, loading states, dialogs, forms, and notifications.
- Financial information that is immediately understandable without visual clutter.

Use system-aware typography, preferably Apple's system font stack where appropriate, with suitable fallbacks on other platforms. Do not assume Apple's proprietary fonts are available on every device.

### Avoid generic AI-generated UI

Do not produce a generic SaaS dashboard full of oversized cards, excessive gradients, random colors, unnecessary glassmorphism, or decorative elements that serve no purpose.

Avoid making every section a separate floating card. Use typography, spacing, dividers, background surfaces, and grouping to establish hierarchy.

The interface should feel intentionally designed, not assembled from unrelated components.

### Design system

Establish a centralized design system with:

- Design tokens for colors, typography, spacing, radii, borders, shadows, and motion.
- Semantic color tokens that adapt between light and dark modes.
- Consistent button, input, select, dialog, dropdown, tooltip, badge, and table styles.
- Standardized chart colors and formatting.
- Consistent interactive states, including hover, focus, pressed, disabled, and loading.
- Reusable layout primitives and responsive breakpoints.
- Clear rules for typography scale and spacing.

Implement the design system before building individual pages so that the entire application remains visually consistent.

### Official design and development resources

Use these resources throughout the design and implementation process:

1. Apple Human Interface Guidelines: https://developer.apple.com/design/human-interface-guidelines/
2. Apple design foundations, including color, typography, materials, layout, and accessibility: https://developer.apple.com/design/human-interface-guidelines/foundations
3. Apple accessibility guidelines: https://developer.apple.com/design/human-interface-guidelines/accessibility
4. shadcn/ui component documentation: https://ui.shadcn.com/docs
5. Tailwind CSS documentation: https://tailwindcss.com/docs
6. Lucide icon library: https://lucide.dev/icons/
7. Next.js documentation: https://nextjs.org/docs/app
8. Supabase Next.js authentication guide: https://supabase.com/docs/guides/auth/quickstarts/nextjs
9. Next.js PWA guide: https://nextjs.org/docs/app/guides/progressive-web-apps
10. Recharts documentation: https://recharts.org/en-US/

Treat Apple's guidelines as the primary reference for visual hierarchy, accessibility, typography, color, consistency, and interaction design. Use shadcn/ui as a foundation, not as a substitute for thoughtful product design.

## 4. Authentication and User Accounts

Implement a secure authentication system using Supabase Auth.

### Required functionality

- User registration using email and password.
- Login and logout.
- Email verification where configured.
- Password reset and recovery.
- Persistent, securely managed sessions.
- Appropriate loading, validation, and error states.
- Protected application routes.
- Redirect unauthenticated users to the login page.
- Redirect authenticated users away from authentication pages when appropriate.
- A user profile or settings page.
- A clear account deletion workflow, with appropriate confirmation.

Keep the initial authentication flow simple and polished. Do not introduce social login or multi-factor authentication unless requested or justified.

### Security requirements

Each user must have a private account, and their expenses must only be accessible to that user.

- Associate each expense, custom tag, category, and user-specific preference with the authenticated user's Supabase ID, where applicable.
- Enable RLS on every user-owned database table.
- Create policies that restrict reading, inserting, updating, and deleting records to their authorized owner.
- Validate the authenticated user on the server for protected operations.
- Never trust a user ID supplied by the client as proof of authorization.
- Never expose the Supabase service-role key or other privileged secrets to the browser.
- Store credentials in environment variables.
- Use the current recommended Supabase SSR and cookie-based authentication patterns for Next.js.
- Avoid insecure token storage or manually implemented authentication.
- Validate all inputs on the server, even if client-side validation is also present.

The database must enforce ownership independently of the UI. Hiding another user's data in the frontend is not sufficient security.

## 5. Expense Management

Expense management is the core functionality and must be fast, intuitive, and reliable.

### Create an expense

Provide a well-designed form or modal that allows users to add an expense with the following fields:

- Amount.
- Currency.
- Expense title or description.
- Category.
- Transaction date.
- Optional merchant or payee.
- Payment method.
- Tags.
- Optional notes.
- Optional recurring-expense indicator.

The amount, currency, description, category, and date should be validated appropriately. Treat currency as a real monetary value and avoid floating-point arithmetic for financial calculations.

The user should be able to add an expense quickly without navigating through multiple unnecessary steps.

### Manage expenses

Users must be able to:

- View all expenses in a clean, searchable list.
- Add new expenses.
- Edit existing expenses.
- Delete expenses with confirmation.
- Duplicate an expense to speed up data entry.
- View expense details.
- Sort by date, amount, category, and other relevant fields.
- Search by title, merchant, description, or notes.
- Filter by date range, category, tag, payment method, and amount.
- Combine multiple filters.
- Clear all filters easily.
- Paginate or progressively load large datasets.
- View helpful empty states when no transactions match the filters.

Provide both a comfortable desktop table or list view and a mobile-friendly layout. Do not squeeze a wide desktop table into a narrow mobile viewport.

### Expense categories

Provide sensible default categories, such as:

- Food & Dining.
- Groceries.
- Transportation.
- Shopping.
- Housing & Rent.
- Utilities.
- Health & Medical.
- Entertainment.
- Travel.
- Education.
- Subscriptions.
- Personal Care.
- Gifts & Donations.
- Other.

Allow users to select a category when adding or editing an expense.

Consider supporting custom categories, with safeguards against accidentally deleting categories that are still associated with existing transactions.

## 6. Tags and Organization

Tags are a core feature, not an optional enhancement.

Allow users to create, edit, assign, remove, and reuse custom tags.

Examples include:

- Vacation.
- Work.
- Family.
- Essential.
- Non-essential.
- One-time.
- Reimbursable.
- Tax-deductible.

Requirements:

- An expense can have multiple tags.
- Tags should have a name and an optional color.
- Tag names should be unique within an individual user's account, following a clearly defined normalization rule.
- Users can create tags directly from the expense form where appropriate.
- Display tags as subtle, readable badges.
- Allow filtering expenses by one or more tags.
- Support tag-based analytics.
- Provide a tag management page or section.
- Allow users to rename or recolor tags without losing their expense associations.
- Handle tag deletion without accidentally deleting expenses.

Design the data model so that tags can be reused efficiently across many expenses.

## 7. Dashboard and Financial Overview

Create a premium dashboard that gives users a meaningful overview of their spending immediately after login.

### Summary metrics

Include:

- Total spending for the selected period.
- Spending for the current month.
- Spending for the previous month.
- Average daily spending.
- Number of transactions.
- Largest expense.
- Most-used category.
- Spending change compared with the previous equivalent period.

Where appropriate, show percentage and absolute changes, with clear explanations of what is being compared.

Do not label spending as income, profit, savings, or balance unless the application actually tracks the necessary financial data.

### Dashboard layout

Use a clear visual hierarchy:

1. Greeting and current period selector.
2. Prominent spending summary.
3. Comparison with the previous period.
4. Spending trend chart.
5. Category breakdown.
6. Recent transactions.
7. Top tags or notable spending insights.

Allow users to navigate to the complete analytics page and the full expense list.

Include a quick-add expense action that is easy to find and use on both desktop and mobile.

Avoid overwhelming the dashboard with every possible metric. Show the most useful information first.

All metrics must be calculated using actual Supabase data, not hardcoded demonstration values.

## 8. Comprehensive Analytics — A Major Product Priority

Analytics should be one of the strongest and most polished features of the application.

The objective is to help users understand their spending patterns, identify trends, and make better-informed personal budgeting decisions.

Create a dedicated analytics page with interactive charts, date controls, filters, and meaningful summaries.

### A. Spending over time

Implement:

- Daily spending for shorter date ranges.
- Weekly spending.
- Monthly spending.
- Quarterly spending.
- Yearly spending.
- Comparison between two equivalent periods.
- Custom date-range selection.

Provide sensible chart granularity based on the selected date range.

Users should be able to hover over or tap chart data points to view exact amounts and dates.

### B. Category analytics

Show:

- Spending by category.
- Percentage of total spending per category.
- Highest-spending categories.
- Category comparisons across periods.
- Category-specific trends over time.

Use donut charts, horizontal bar charts, or other appropriate visualizations. Select chart types based on readability rather than decoration.

Provide an accessible legend and a complementary tabular representation where useful.

### C. Tag analytics

Allow users to analyze expenses by their assigned tags.

Include:

- Total spending for each tag.
- Percentage of spending associated with a tag.
- Spending trends for a selected tag.
- Comparisons between selected tags.
- A filtered transaction list for each tag.

An expense can have multiple tags, so **never sum tag totals and present the result as overall spending** without accounting for overlapping transactions.

### D. Spending patterns

Where sufficient data exists, calculate:

- Average daily spending.
- Average transaction value.
- Highest-spending day or month.
- Most frequent spending categories.
- Spending distribution across weekdays.
- Largest transactions.
- Recurring spending patterns, if recurring data is available.

Clearly explain how each metric is calculated.

### E. Period comparisons

Allow users to compare:

- This month versus last month.
- This year versus last year.
- A selected period versus the previous equivalent period.
- Spending for a selected category across different periods.

Handle zero-value baselines correctly. Do not show misleading percentage changes when the previous period has no spending; use a clear alternative such as "No previous-period spending."

### F. Searchable analytics

Analytics should respond to relevant filters, including:

- Date range.
- Category.
- Tag.
- Payment method.
- Merchant, where appropriate.

Use consistent filter behavior across analytics and transaction pages.

### G. Insights

Provide concise, data-driven insights, such as:

- "Dining spending increased by 18% compared with the previous month."
- "Transportation accounted for 12% of your spending this month."
- "Your highest-spending day was Saturday."

Generate these insights from actual transaction data. Do not fabricate trends, assume a user's financial goals, or generate claims unsupported by the available records.

If there is insufficient data, explain what information is needed rather than showing fake insights.

### Analytics implementation requirements

- Use real Supabase data, never hardcoded dashboard metrics in production.
- Centralize and reuse financial aggregation logic.
- Ensure charts update when filters change.
- Avoid unnecessary database queries and duplicate calculations.
- Use server-side aggregation or optimized database queries for large datasets where appropriate.
- Format currencies, dates, percentages, and zero values consistently.
- Provide skeletons, empty states, and error states.
- Ensure charts are responsive and usable on touch devices.
- Support keyboard access and meaningful labels for charts.

## 9. Import and Export

Provide reliable data portability so users can back up their expenses or migrate from another expense tracker.

### Import

Support CSV import as the initial priority.

The import process should include:

1. Select or drag and drop a CSV file.
2. Validate the file type and size.
3. Parse and preview the records.
4. Map source columns to application fields.
5. Preview normalized dates, amounts, categories, and tags.
6. Identify invalid records and potential duplicates.
7. Let users choose how to handle duplicate records.
8. Show a summary before confirming the import.
9. Import valid records safely.
10. Display a completion report, including successful, skipped, and failed records.

Requirements:

- Validate every imported row.
- Never silently discard invalid data.
- Never import data into another user's account.
- Preserve the original file and source data unless the user explicitly chooses otherwise.
- Handle large files without freezing the interface.
- Provide clear error messages with row numbers and reasons.
- Use database transactions or an equivalent reliable approach where appropriate.
- Handle partial failures transparently.

Support common CSV date and amount formats where feasible. If a source uses a different currency or an ambiguous date format, ask the user to confirm the interpretation.

Consider supporting JSON backup and restore as well.

### Export

Support:

- Export all expenses to CSV.
- Export filtered expenses to CSV.
- Export a selected date range.
- Export expenses with categories and tags.
- Export all relevant records to a JSON backup.
- Include a clear explanation of which fields are exported.

Exports should use a documented, consistent schema that can be imported again wherever practical.

Escape CSV fields correctly, handle commas and quotes, and protect against spreadsheet formula injection when generating spreadsheet-compatible files.

Ensure that exports contain only the authenticated user's authorized data.

## 10. Light Mode, Dark Mode, and System Theme

Provide a polished theme system with three settings:

- Light.
- Dark.
- System.

Requirements:

- Add a clear theme selector in the settings or account menu.
- Respect the operating system preference when System is selected.
- Persist the user's explicit theme preference.
- Apply theme changes without requiring a page reload.
- Prevent theme flashing during initial page rendering.
- Ensure dialogs, dropdowns, forms, tables, tooltips, and charts all support both themes.
- Use semantic design tokens instead of scattered hardcoded colors.
- Ensure text and important UI elements remain readable in both themes.
- Ensure chart grids, axes, tooltips, and legends adapt to the current theme.

The dark theme should be intentionally designed, not simply produced by inverting the light theme.

Use dark neutral surfaces, restrained borders, and carefully tuned contrast. Avoid excessive pure-black backgrounds unless the overall design calls for them.

## 11. Progressive Web App (PWA)

Make the application installable as a Progressive Web App.

Follow the official Next.js PWA documentation:

https://nextjs.org/docs/app/guides/progressive-web-apps

### Required PWA features

- Web app manifest.
- Application name and short name.
- Appropriate application icons in the required sizes.
- Standalone display mode.
- Theme and background colors.
- Installability on supported browsers and devices.
- Appropriate service worker.
- Offline fallback experience.
- Responsive layouts and touch-friendly interactions.
- A clear installation prompt or install guidance when supported.
- Correct update handling for the service worker.

### Offline behavior and data safety

The application must not pretend that a transaction has been saved to Supabase when the network request has failed.

For the initial implementation, prioritize safe online transactions and useful offline access to the app shell, static assets, and non-sensitive cached resources.

If offline expense creation is implemented, explicitly design a reliable local queue with:

- Clear pending, synced, and failed states.
- Safe synchronization after reconnection.
- Duplicate prevention.
- Conflict handling.
- User-visible retry options.
- Appropriate protection for locally stored financial data.

Do not cache authenticated financial responses in a shared cache or allow one account's data to appear after another account signs in on the same device.

Do not store passwords, session secrets, or privileged credentials in local storage.

Treat PWA security and financial-data privacy as essential requirements.

## 12. Currency, Dates, and Financial Accuracy

Design the data model to support multiple currencies, even if the initial user interface starts with a single preferred currency.

Requirements:

- Allow users to select their preferred currency.
- Use appropriate currency symbols and locale-aware formatting.
- Store the currency alongside each transaction.
- Use precise numeric storage suitable for financial amounts, such as PostgreSQL NUMERIC.
- Avoid JavaScript floating-point arithmetic for financial totals.
- Define a consistent policy for currency conversion.
- Never combine amounts in different currencies into a single total without an explicit conversion policy and exchange-rate source.
- Allow users to choose their preferred date format or locale if appropriate.
- Store transaction timestamps and calendar dates using appropriate database types and time-zone rules.
- Ensure daily and monthly analytics use the user's intended time zone.
- Handle month boundaries, leap years, and daylight-saving transitions correctly.

If exchange-rate conversion is outside the initial scope, display separate currency totals rather than inventing exchange rates.

## 13. Database Design

Design a clean, normalized Supabase PostgreSQL schema. At a minimum, consider the following tables.

### `profiles`

- `id`, referencing the authenticated Supabase user.
- `display_name`.
- `preferred_currency`.
- `preferred_locale` or time-zone preference.
- `theme_preference`.
- `created_at`.
- `updated_at`.

### `expenses`

- `id`, using a UUID.
- `user_id`, referencing the authenticated user.
- `title`.
- `description` or notes, if kept separately.
- `amount`, stored with an appropriate precise numeric type.
- `currency`.
- `category_id`, if categories are normalized into a separate table.
- `merchant`.
- `payment_method`.
- `transaction_date`.
- `is_recurring`, if recurring expenses are supported.
- `created_at`.
- `updated_at`.

### `categories`

- `id`.
- `user_id`, with a clearly defined strategy for system-provided defaults.
- `name`.
- `icon`, if supported.
- `color`, if supported.
- `created_at`.
- `updated_at`.

### `tags`

- `id`.
- `user_id`.
- `name`.
- `color`.
- `created_at`.
- `updated_at`.

### `expense_tags`

- `expense_id`.
- `tag_id`.

Use a composite primary key or unique constraint to prevent duplicate associations.

If categories are optional, define how uncategorized expenses behave. If categories and tags can be deleted, establish safe foreign-key and deletion rules.

Add appropriate indexes for user ownership, transaction dates, categories, and frequently used filters.

Use constraints for valid amounts and relationships.

### Database security

- Enable RLS on every user-owned table.
- Ensure every read and mutation checks ownership.
- Prevent users from attaching another user's tags or categories to their expenses.
- Use secure policies for inserts, updates, and deletes.
- Restrict profile updates to the authenticated profile owner.
- Avoid broad, permissive policies.
- Ensure database relationships maintain data integrity.

Do not assume that a UUID or an unguessable identifier is an authorization mechanism.

### Database deliverables

- Create version-controlled SQL migrations.
- Define tables, relationships, constraints, indexes, and RLS policies.
- Document how to initialize the Supabase database.
- Provide the required environment variable names.
- Generate or maintain accurate TypeScript database types.
- Keep the schema aligned with the actual features implemented.

## 14. Application Architecture

Use a modular, maintainable structure appropriate for a growing Next.js application.

Organize code by feature or domain where that improves clarity. Separate:

- Application routes and layouts.
- Reusable UI components.
- Expense management.
- Analytics and aggregation logic.
- Authentication.
- Supabase browser and server clients.
- Database types and queries.
- Validation schemas.
- Import and export utilities.
- Theme management.
- PWA configuration.

Use Server Components by default where appropriate. Use Client Components only for interactive functionality that requires them, such as charts, filters, modals, and client-side form behavior.

Keep authorization and sensitive operations on the server where appropriate. Do not expose database credentials or privileged business logic in client bundles.

Generate or maintain accurate TypeScript database types. Avoid `any` unless there is a documented and justified reason.

Use reusable, typed utilities for currency formatting, date ranges, category aggregation, and tag aggregation.

Avoid oversized components, duplicated business logic, unnecessary global state, and abstractions that make simple functionality harder to maintain.

## 15. Required Application Pages

Implement the following routes or their equivalent in the existing routing structure:

- `/login` — sign-in.
- `/signup` — account registration.
- `/forgot-password` — password recovery.
- `/dashboard` — financial overview.
- `/expenses` — transaction list, search, sorting, and filtering.
- `/expenses/new` — create expense, or an equivalent modal-based workflow.
- `/expenses/[id]` — expense details and editing.
- `/analytics` — detailed financial analytics.
- `/categories` — category management.
- `/tags` — tag management.
- `/import-export` — data import and export.
- `/settings` — preferences, currency, theme, and account settings.

Choose the most intuitive navigation structure for desktop and mobile.

Desktop may use a refined sidebar or similarly effective navigation. Mobile should use a compact navigation pattern that preserves access to the most important functions without crowding the screen.

The exact route structure can be adapted when necessary, but all required functionality must remain accessible.

## 16. UX Details and Interaction Quality

Pay attention to the small details that distinguish a premium product from a basic CRUD application.

Implement:

- Clear success and error feedback.
- Thoughtful loading skeletons.
- Empty states with useful calls to action.
- Confirmation for destructive operations.
- Inline validation with actionable messages.
- Optimistic updates only where safe and reversible.
- Undo support for suitable actions, if practical.
- Keyboard navigation and visible focus indicators.
- Accessible labels for icon-only controls.
- Helpful tooltips for unfamiliar metrics.
- Search that responds quickly.
- Filters that can be cleared or reset easily.
- Consistent dialog and dropdown behavior.
- Responsive charts and tables.
- Subtle, purposeful motion.
- Reduced-motion support.
- Proper handling of long names, large amounts, and empty descriptions.

Do not use alerts or browser-native confirmation dialogs as the default design for ordinary application interactions. Use consistent accessible dialogs, toast notifications, or inline feedback.

Avoid unnecessary animations and avoid delaying common actions for visual effects.

## 17. Accessibility and Responsive Design

Target WCAG 2.2 AA where applicable.

Ensure:

- Sufficient contrast in light and dark modes.
- Keyboard-accessible forms, menus, dialogs, and charts.
- Proper semantic HTML.
- Clear focus states.
- Appropriate accessible names and descriptions.
- Screen-reader-friendly form errors and status messages.
- Information is never communicated by color alone.
- Motion can be reduced.
- Touch targets are comfortable on mobile.
- The interface works at narrow widths and increased zoom.
- Layouts remain functional on desktop, tablet, and mobile.

Use accessible component primitives and follow the Apple Human Interface Guidelines for clear, predictable interactions.

## 18. Performance and Reliability

The application should feel fast even when the user has thousands of expenses.

- Use efficient database queries.
- Fetch only the fields needed.
- Apply pagination or another suitable loading strategy.
- Avoid downloading every expense merely to compute a dashboard summary.
- Debounce search input where appropriate.
- Use database aggregation when beneficial.
- Avoid redundant network requests.
- Keep client-side JavaScript under control.
- Optimize chart rendering.
- Handle slow networks and failed requests gracefully.
- Avoid unnecessary hydration.
- Ensure filters and date ranges do not trigger excessive queries.
- Add appropriate database indexes.
- Handle concurrent updates safely.

Do not introduce caching that risks stale financial information or cross-account data leakage.

## 19. Development Workflow for the AI Agent

Work systematically and make real progress in the codebase.

### Phase 1: Understand the project

- Inspect the repository and existing architecture.
- Review `package.json`, dependencies, environment configuration, and existing routes.
- Identify reusable components and existing conventions.
- Check whether Supabase is already configured.
- Identify missing requirements and potential technical risks.
- Do not overwrite existing work without understanding its purpose.

### Phase 2: Clarify requirements

Before making major architectural decisions, identify ambiguities that could materially affect the implementation.

Examples include:

- Whether the application tracks expenses only or also income and budgets.
- Which currency should be used by default.
- Whether recurring transactions are needed.
- Whether CSV import alone is sufficient or JSON backup is also required.
- Whether offline transaction creation is necessary.
- Whether the application is intended for a single personal account or future multi-user expansion.

**If you have any questions, uncertainties, or need clarification about the requirements, feel free to ask me.**

Ask concise, specific questions and explain why the answer matters. When a decision is minor and has a sensible default, state your assumption and proceed rather than blocking progress.

Do not ask me to confirm every implementation detail.

### Phase 3: Plan the implementation

Create a concise implementation plan covering:

- Architecture.
- Database schema.
- Authentication and security.
- Design tokens and reusable components.
- Core pages.
- Analytics.
- Import/export.
- PWA.
- Deployment.

Identify dependencies and implement features in a logical order.

### Phase 4: Build the foundation

- Configure the Next.js application.
- Set up TypeScript, Tailwind CSS, and component primitives.
- Establish the design system.
- Configure Supabase clients and authentication.
- Create database migrations and RLS policies.
- Implement route protection.
- Set up theme management.

### Phase 5: Build the core product

Implement expense management, categories, tags, dashboard, analytics, settings, and import/export.

Use real database records and implement complete create, read, update, and delete flows.

Ensure that all navigation elements, filters, buttons, dialogs, and forms perform their intended actions.

### Phase 6: Add PWA functionality

Implement the manifest, icons, service worker, installation experience, offline fallback, and secure caching strategy.

Ensure that the application remains safe when connectivity is lost and restored.

### Phase 7: Validate and refine

- Run TypeScript type checking, linting, and a production build.
- Review the UI against Apple's design principles.
- Check light and dark themes.
- Review responsive behavior on mobile, tablet, and desktop.
- Review accessibility and keyboard navigation.
- Verify Supabase authentication and RLS policies.
- Confirm financial calculations and currency handling.
- Review import/export behavior and error handling.
- Resolve errors and broken functionality before completion.

**Do not create E2E tests, unit tests, integration tests, Playwright tests, Vitest configuration, or a dedicated testing framework.** Keep validation lightweight and focused on building the application correctly.

### Phase 8: Document the application

Provide:

- Setup instructions.
- Required environment variables.
- Supabase configuration steps.
- Database migration instructions.
- Development and production commands.
- Build and validation commands.
- Deployment instructions.
- PWA installation guidance.
- Known limitations and future improvements.

Never claim a feature is implemented or verified unless it actually is.

## 20. Definition of Done

The application is considered complete when:

- Authentication works correctly.
- Every user's data is isolated and protected by RLS.
- Expense CRUD operations work and persist in Supabase.
- Categories and tags work correctly.
- Dashboard metrics are calculated from actual records.
- Analytics are accurate, interactive, and responsive.
- CSV import and export work reliably.
- JSON backup and restore are implemented if included in the agreed scope.
- Light, dark, and system themes work consistently.
- The PWA is installable on supported devices.
- Offline behavior is safe and clearly communicated.
- The UI is polished across mobile and desktop.
- Accessibility and error states are handled.
- Type checking, linting, and the production build succeed.
- Setup and deployment instructions are complete.

Do not spend time creating testing infrastructure. Focus on implementing and refining the actual product.

## 21. Final Instructions

Think like an experienced product engineer, not just a code generator.

Prioritize correctness, security, financial accuracy, thoughtful UX, and long-term maintainability. Make the application feel premium through restraint, consistency, and excellent interaction design rather than unnecessary visual effects.

Use the official documentation linked above, verify current APIs before implementing them, and make decisions based on actual project requirements.

Start by inspecting the existing codebase. Then present your understanding of the project, any important clarification questions, and a concise implementation plan before proceeding with the implementation.

If anything is unclear at any stage, feel free to ask me questions. Do not silently make major product decisions that could significantly change the scope or expected behavior of the application.

The final result should be a complete, polished, secure, and genuinely useful expense-tracking application—not just a dashboard mockup.