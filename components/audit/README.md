# Audit Components

This directory contains the refactored audit components for the web audit application. The components have been broken down into smaller, focused pieces for better maintainability and scalability.

## Structure

```
components/audit/
├── audit-main.tsx          # Main container component
├── components/             # Sub-components
│   ├── ProjectHeader.tsx   # Project header with controls
│   ├── ProjectMetrics.tsx  # Project statistics and metrics
│   ├── ProcessStatusCard.tsx # Crawling/analysis status display
│   ├── BatchProgressCard.tsx # Batch analysis progress
│   ├── CustomUrlsCard.tsx  # Custom URLs analysis display
│   ├── PagesTable.tsx      # Pages table with filtering/sorting
│   └── index.ts           # Component exports
├── image-analysis-table.tsx # Image analysis results
├── links-analysis-table.tsx # Links analysis results
├── project-form.tsx        # Project creation/editing form
├── project-manager.tsx     # Project management interface
└── README.md              # This file
```

## Component Overview

### `audit-main.tsx`
**Main container component** that orchestrates all audit functionality.

**Responsibilities:**
- State management for the entire audit session
- Data fetching and API communication
- Redux integration
- Polling for real-time updates
- Coordinating between sub-components

**Key Features:**
- Real-time crawling status updates
- Batch analysis with progress tracking
- Error handling and user feedback
- Session management

### `ProjectHeader.tsx`
**Header section** with project controls and navigation.

**Features:**
- Start/Stop/Recrawl buttons
- Project editing link
- Manual refresh functionality
- Status-aware button visibility

### `ProjectMetrics.tsx`
**Project statistics dashboard** showing key metrics.

**Metrics Displayed:**
- Project status (pending, crawling, completed, etc.)
- Pages crawled vs total pages
- Pages analyzed count
- Total images found (clickable for details)
- Total links found (clickable for details)
- Internal vs external link breakdown

### `ProcessStatusCard.tsx`
**Real-time process status** display during crawling.

**Features:**
- Live crawling status
- Recent pages crawled list
- Process action indicators

### `BatchProgressCard.tsx`
**Batch analysis progress** tracking.

**Features:**
- Progress bar visualization
- Success/failure/timeout counts
- Real-time status updates

### `CustomUrlsCard.tsx`
**Custom URLs analysis** results display.

**Features:**
- Present/missing URL indicators
- Copy URL functionality
- External link opening
- Visual status badges

### `PagesTable.tsx`
**Comprehensive pages table** with advanced functionality.

**Features:**
- Search and filtering
- Sorting by title, status, or score
- Batch selection and analysis
- Individual page actions
- Real-time status updates
- Analysis progress indicators

## Best Practices

### 1. Component Organization
- **Single Responsibility**: Each component has one clear purpose
- **Props Interface**: All components use TypeScript interfaces for props
- **Consistent Naming**: PascalCase for components, camelCase for props
- **Export Structure**: Use index.ts for clean imports

### 2. State Management
- **Local State**: UI-specific state (filters, selections) stays in components
- **Redux State**: Global state (sessions, projects) managed in Redux
- **Props Drilling**: Minimized through component composition

### 3. Performance Optimization
- **Memoization**: Use React.memo for expensive components
- **Debouncing**: Search inputs debounced to prevent excessive API calls
- **Polling**: Intelligent polling based on component state
- **Lazy Loading**: Large components loaded on demand

### 4. Error Handling
- **Graceful Degradation**: Components handle missing data gracefully
- **User Feedback**: Toast notifications for user actions
- **Loading States**: Skeleton components during data fetching
- **Retry Logic**: Automatic retry for failed operations

### 5. Accessibility
- **ARIA Labels**: Proper accessibility attributes
- **Keyboard Navigation**: Full keyboard support
- **Screen Reader**: Semantic HTML structure
- **Color Contrast**: WCAG compliant color schemes

## Usage Examples

### Basic Usage
```tsx
import { AuditMain } from '@/components/audit/audit-main';

function AuditPage() {
  return <AuditMain />;
}
```

### Custom Components
```tsx
import { ProjectMetrics, ProjectHeader } from '@/components/audit/components';

function CustomAuditView() {
  return (
    <div>
      <ProjectHeader {...headerProps} />
      <ProjectMetrics {...metricsProps} />
    </div>
  );
}
```

## Data Flow

1. **Initialization**: `audit-main.tsx` fetches project data
2. **State Setup**: Redux session initialized with project ID
3. **Real-time Updates**: Polling for crawling/analysis status
4. **User Interactions**: Components trigger actions through props
5. **State Updates**: Redux state updated, components re-render
6. **Feedback**: Toast notifications and loading states

## API Integration

### Endpoints Used
- `GET /api/audit-projects/{id}` - Project data
- `GET /api/audit-projects/{id}/results` - Analysis results
- `GET /api/audit-projects/{id}/crawl-status` - Crawling status
- `POST /api/scrape/start` - Start crawling
- `POST /api/audit-projects/{id}/analyze` - Start analysis
- `POST /api/audit-projects/{id}/stop` - Stop crawling

### Error Handling
- Network timeouts with retry logic
- Graceful degradation for missing data
- User-friendly error messages
- Automatic recovery from failed states

## Styling

### Design System
- **Tailwind CSS**: Utility-first styling
- **Consistent Spacing**: 4px grid system
- **Color Palette**: Slate/gray tones with semantic colors
- **Responsive Design**: Mobile-first approach
- **Dark Mode**: Full dark mode support

### Component Styling
- **Gradient Backgrounds**: Subtle gradients for visual hierarchy
- **Hover Effects**: Interactive feedback
- **Loading States**: Animated spinners and skeletons
- **Status Indicators**: Color-coded badges and icons

## Testing Considerations

### Unit Tests
- Component rendering
- Props validation
- Event handlers
- State updates

### Integration Tests
- API interactions
- Redux state changes
- Component communication
- User workflows

### E2E Tests
- Complete audit workflows
- Error scenarios
- Performance under load
- Cross-browser compatibility

## Future Improvements

### Planned Enhancements
1. **Virtual Scrolling**: For large page lists
2. **Advanced Filtering**: Date ranges, custom criteria
3. **Export Functionality**: PDF/CSV reports
4. **Real-time Collaboration**: Multi-user support
5. **Performance Monitoring**: Analytics and metrics

### Technical Debt
1. **Type Safety**: Stricter TypeScript interfaces
2. **Testing Coverage**: Increase test coverage
3. **Documentation**: More detailed API docs
4. **Performance**: Bundle size optimization
5. **Accessibility**: Enhanced a11y features

## Contributing

When contributing to these components:

1. **Follow the established patterns**
2. **Add TypeScript interfaces** for new props
3. **Include proper error handling**
4. **Add loading states** for async operations
5. **Test on mobile devices**
6. **Update this documentation**

## Dependencies

### Core Dependencies
- React 19+
- Next.js 15+
- TypeScript 5+
- Tailwind CSS 3+
- Lucide React (icons)

### State Management
- Redux Toolkit
- React Redux

### UI Components
- Radix UI primitives
- Custom UI components

### Utilities
- React Toastify
- Axios
- Date-fns 