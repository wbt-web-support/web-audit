- [x] Setup Redux Toolkit for global state management (2024-06-09)
  - Installed @reduxjs/toolkit and react-redux
  - Created app/store.ts
  - Wrapped app in Provider in app/layout.tsx
  - Documented usage in README.md 

## [2024-06-09] Integrate Google PageSpeed Insights for Performance Analysis (in progress)
- [x] Add backend logic to call PageSpeed Insights API in parallel with other analyses
- [x] Store results in performance_analysis field in DB
- [x] Document setup and usage in README
- [ ] Add frontend display of performance results (TODO) 

## Completed Tasks

- [2024-06-08] Implemented all_links_analysis: backend now collects all internal/external links during crawl, stores in audit_projects.all_links_analysis, and dashboard UI displays a summary/table of all links. Includes migration and README update. 