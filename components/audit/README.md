# Audit Components

This directory contains the components for the website audit functionality.

## Components

### AuditMain
The main audit dashboard component that displays project information, pages, and analysis results.

**Location:** `audit-main.tsx`

**Features:**
- Project status and crawling progress
- Page analysis management
- Batch operations (analyze, delete)
- Search and filtering
- Real-time status updates

### ImageAnalysisTable
A dedicated component for displaying and filtering image analysis results.

**Location:** `image-analysis-table.tsx`

**Features:**
- Image preview with thumbnails
- Filtering by image format (JPG, PNG, WebP, SVG, etc.)
- Duplicate detection and filtering
- Copy functionality for image URLs and page URLs
- Size and format information display
- Toggle between filtered and all images view

**Props:**
```typescript
interface ImageAnalysisTableProps {
  images: ImageAnalysis[];
}

interface ImageAnalysis {
  src: string;
  alt?: string;
  size?: number | null;
  format?: string;
  is_small?: boolean | null;
  page_url: string;
}
```

### LinksAnalysisTable
A dedicated component for displaying link analysis results.

**Location:** `links-analysis-table.tsx`

**Features:**
- Internal and external link categorization
- Duplicate link filtering
- Copy functionality for page URLs
- Link type and anchor text display
- Unique link counting

**Props:**
```typescript
interface LinksAnalysisTableProps {
  links: LinkAnalysis[];
}

interface LinkAnalysis {
  href: string;
  type: string;
  text?: string;
  page_url: string;
}
```

## Usage

```typescript
import { AuditMain, ImageAnalysisTable, LinksAnalysisTable } from '@/components/audit';

// Use the main audit component
<AuditMain />

// Use individual analysis tables
<ImageAnalysisTable images={imageData} />
<LinksAnalysisTable links={linkData} />
```

## File Structure

```
components/audit/
├── audit-main.tsx          # Main audit dashboard
├── image-analysis-table.tsx # Image analysis table component
├── links-analysis-table.tsx # Links analysis table component
├── index.ts                # Component exports
└── README.md              # This documentation
```

## Benefits of Component Separation

1. **Modularity**: Each component has a single responsibility
2. **Reusability**: Analysis tables can be used independently
3. **Maintainability**: Easier to update and debug individual features
4. **Performance**: Smaller bundle sizes and better code splitting
5. **Testing**: Individual components can be tested in isolation 