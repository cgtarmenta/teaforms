PR5 — Validation & Polish

- Admin pages:
  - `Admin › Users` (`/admin/users`): list, create, update role/active, delete (sysadmin only).
  - `Admin › Analytics` (`/admin/analytics`): totals, by-form, by-context (sysadmin only).
- Episodes UX:
  - Sorting (timestamp/form/context/author) + asc/desc.
  - Pagination preserved; date/time localized to current locale.
- PDF export:
  - Improved gridlines (row separators, column lines).
  - Multi-line wrapping with ellipsis (Form up to 3 lines; others up to 2).
- A11y:
  - `aria-current="page"` on active nav.
  - Higher-contrast active nav style.

Notes

- `GET /api/episodes` now supports `sort`, `order`, and `all=true` (the last requires sysadmin and returns all items without pagination).
- `GET /api/users` now requires `sysadmin` role (consistent with admin scope).
- i18n updated (default es) to include admin and sorting labels.

