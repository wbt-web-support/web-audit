# Dashboard Components

This folder contains all dashboard-related components for the Web Audit application.

## Structure

```
dashboard/
├── dashboard-main.tsx         # Main dashboard component with logic
├── dashboard-stats-cards.tsx  # Statistics cards component
├── recent-sessions.tsx        # Recent sessions list component
├── index.ts                   # Export file for clean imports
└── README.md                  # This file
```

## Components

### DashboardMain
The main dashboard component that:
- Fetches dashboard statistics from `/api/dashboard/stats`
- Handles loading and error states
- Orchestrates the display of stats cards and recent sessions
- Provides a retry mechanism on errors

### DashboardStatsCards
Displays key metrics in card format:
- Total Sessions
- Pages Analyzed  
- Average Score
- Quick Actions (New Session, View Audits)

### RecentSessions
Shows the latest audit sessions with:
- Session status indicators
- Page counts (crawled/analyzed)
- Quick view buttons
- Empty state with call-to-action

## Usage

```tsx
import { DashboardMain } from '@/dashboard';

export default function DashboardPage() {
  return <DashboardMain />;
}
```

## API Dependencies

The dashboard requires:
- `/api/dashboard/stats` - Returns dashboard statistics
- User authentication (checked at page level)

## Features

- **Client-side rendering**: Faster navigation and better UX
- **Error handling**: Graceful error states with retry options
- **Loading states**: Smooth loading indicators
- **Responsive design**: Works on all screen sizes
- **Modular architecture**: Easy to maintain and extend 