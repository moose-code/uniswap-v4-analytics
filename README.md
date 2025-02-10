# shadcn/ui monorepo template

This template is for creating a monorepo with shadcn/ui.

## Usage

```bash
pnpm dlx shadcn@latest init
```

## Adding components

To add components to your app, run the following command at the root of your `web` app:

```bash
pnpm dlx shadcn@latest add button -c apps/web
```

This will place the ui components in the `packages/ui/src/components` directory.

## Tailwind

Your `tailwind.config.ts` and `globals.css` are already set up to use the components from the `ui` package.

## Using components

To use the components in your app, import them from the `ui` package.

```tsx
import { Button } from "@workspace/ui/components/ui/button";
```

# Refactoring Tasks

## Data Fetching & GraphQL

- [ ] Consolidate GraphQL queries into a single source of truth
- [ ] Create proper GraphQL types using codegen
- [ ] Implement proper error handling for GraphQL queries
- [ ] Add loading states and error boundaries
- [ ] Consider implementing query caching (React Query/SWR)
- [ ] Optimize refetch intervals based on data update frequency
- [ ] Add retry logic for failed requests
- [ ] Implement proper pagination for large datasets

## State Management

- [ ] Consider using a state management solution (Zustand/Jotai) for shared state
- [ ] Reduce prop drilling by implementing context where appropriate
- [ ] Create custom hooks for reusable state logic
- [ ] Implement proper state persistence where needed
- [ ] Add proper type safety for all state

## Code Organization & DRY

- [ ] Extract common table components (currently duplicated in Pools/Hooks)
- [ ] Create shared utilities for number formatting and date handling
- [ ] Extract common animation logic into reusable hooks
- [ ] Create shared types for common data structures
- [ ] Implement proper constants organization
- [ ] Extract common styling patterns into reusable components

## Performance

- [ ] Implement proper memo-ization for expensive calculations
- [ ] Optimize re-renders using React.memo where appropriate
- [ ] Add proper suspense boundaries
- [ ] Implement proper code splitting
- [ ] Consider implementing virtual scrolling for large tables
- [ ] Optimize bundle size

## UI/UX Improvements

- [ ] Add proper loading skeletons
- [ ] Implement proper error states with retry options
- [ ] Add proper tooltips for complex data
- [ ] Implement proper mobile responsiveness
- [ ] Add proper accessibility features
- [ ] Implement proper dark mode support

## Testing

- [ ] Add unit tests for utilities
- [ ] Add component tests
- [ ] Add integration tests
- [ ] Add e2e tests
- [ ] Add proper test coverage reporting
- [ ] Implement proper testing patterns

## Developer Experience

- [ ] Add proper documentation
- [ ] Implement proper logging
- [ ] Add proper development tools
- [ ] Improve type safety
- [ ] Add proper CI/CD
- [ ] Add proper linting and formatting rules

## Specific Component Improvements

- [ ] Refactor HooksSummary and PoolsSummary into a shared component
- [ ] Extract table logic into a reusable component
- [ ] Create proper loading states for data fetching
- [ ] Implement proper error handling for all components
- [ ] Add proper types for all props

## Data Management

- [ ] Implement proper data normalization
- [ ] Add proper data validation
- [ ] Implement proper data transformation layers
- [ ] Add proper data caching
- [ ] Implement proper data refresh strategies

## Architecture Improvements

- [ ] Consider implementing proper domain separation
- [ ] Add proper service layer
- [ ] Implement proper dependency injection
- [ ] Add proper error boundaries
- [ ] Consider implementing proper module federation

## Security

- [ ] Add proper input validation
- [ ] Implement proper XSS protection
- [ ] Add proper CSRF protection
- [ ] Implement proper rate limiting
- [ ] Add proper security headers

## Monitoring & Analytics

- [ ] Add proper error tracking
- [ ] Implement proper performance monitoring
- [ ] Add proper analytics
- [ ] Implement proper logging
- [ ] Add proper metrics

## Technical Debt

- [ ] Remove unused code
- [ ] Fix any type assertions
- [ ] Improve error handling
- [ ] Fix any console warnings
- [ ] Address TODOs in codebase

## Future Considerations

- [ ] Consider implementing SSR where beneficial
- [ ] Add proper i18n support
- [ ] Consider implementing proper PWA support
- [ ] Add proper SEO optimization
- [ ] Consider implementing proper offline support
