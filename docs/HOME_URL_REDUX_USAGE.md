# Home Page URL Redux Store Usage

This document explains how to use the home page URL stored in the Redux store.

## Overview

The home page URL is stored in Redux under the `home` slice and can be accessed from any component in the application.

## Store Structure

```typescript
interface HomeState {
  websiteUrl: string;
}
```

## Actions Available

- `setWebsiteUrl(url: string)` - Set the website URL
- `clearWebsiteUrl()` - Clear the website URL
- `updateWebsiteUrl(url: string)` - Update the website URL

## Usage Examples

### 1. Access the URL in a Component

```typescript
import { useAppSelector } from '../app/stores/hooks';

function MyComponent() {
  const websiteUrl = useAppSelector((state) => state.home.websiteUrl);
  
  return (
    <div>
      {websiteUrl && <p>Website: {websiteUrl}</p>}
    </div>
  );
}
```

### 2. Update the URL from a Component

```typescript
import { useAppDispatch } from '../app/stores/hooks';
import { setWebsiteUrl } from '../app/stores/homeSlice';

function MyComponent() {
  const dispatch = useAppDispatch();
  
  const handleUrlChange = (newUrl: string) => {
    dispatch(setWebsiteUrl(newUrl));
  };
  
  return (
    <button onClick={() => handleUrlChange('https://example.com')}>
      Set Example URL
    </button>
  );
}
```

### 3. Clear the URL

```typescript
import { useAppDispatch } from '../app/stores/hooks';
import { clearWebsiteUrl } from '../app/stores/homeSlice';

function MyComponent() {
  const dispatch = useAppDispatch();
  
  const handleClear = () => {
    dispatch(clearWebsiteUrl());
  };
  
  return (
    <button onClick={handleClear}>
      Clear URL
    </button>
  );
}
```

## Store Integration

The home slice is automatically integrated into the main Redux store and can be accessed using the typed hooks:

- `useAppSelector` - For reading state
- `useAppDispatch` - For dispatching actions

## Persistence

The URL is stored in memory and will persist during the user's session. If you need persistence across browser sessions, consider implementing localStorage or sessionStorage integration.
