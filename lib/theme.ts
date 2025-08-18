export const theme = {
  colors: {
    // Primary colors - Softer blue tones
    primary: {
      50: 'hsl(210, 40%, 98%)',
      100: 'hsl(210, 40%, 95%)',
      200: 'hsl(214, 35%, 88%)',
      300: 'hsl(213, 37%, 78%)',
      400: 'hsl(215, 35%, 68%)',
      500: 'hsl(215, 40%, 58%)', // Main primary - softer
      600: 'hsl(215, 40%, 52%)',
      700: 'hsl(215, 40%, 46%)',
      800: 'hsl(215, 40%, 40%)',
      900: 'hsl(215, 40%, 30%)',
      950: 'hsl(215, 40%, 20%)',
    },
    
    // Secondary/Accent colors
    secondary: {
      50: 'hsl(220, 100%, 96%)',
      100: 'hsl(220, 100%, 91%)',
      200: 'hsl(220, 95%, 83%)',
      300: 'hsl(220, 97%, 72%)',
      400: 'hsl(220, 95%, 65%)',
      500: 'hsl(220, 100%, 50%)', // Main secondary
      600: 'hsl(220, 100%, 45%)',
      700: 'hsl(220, 100%, 40%)',
      800: 'hsl(220, 100%, 35%)',
      900: 'hsl(220, 100%, 25%)',
      950: 'hsl(220, 100%, 15%)',
    },

    // Success colors
    success: {
      50: 'hsl(142, 76%, 96%)',
      100: 'hsl(142, 76%, 91%)',
      200: 'hsl(142, 76%, 83%)',
      300: 'hsl(142, 76%, 72%)',
      400: 'hsl(142, 76%, 65%)',
      500: 'hsl(142, 76%, 50%)',
      600: 'hsl(142, 76%, 45%)',
      700: 'hsl(142, 76%, 40%)',
      800: 'hsl(142, 76%, 35%)',
      900: 'hsl(142, 76%, 25%)',
      950: 'hsl(142, 76%, 15%)',
    },

    // Warning colors
    warning: {
      50: 'hsl(48, 96%, 96%)',
      100: 'hsl(48, 96%, 91%)',
      200: 'hsl(48, 96%, 83%)',
      300: 'hsl(48, 96%, 72%)',
      400: 'hsl(48, 96%, 65%)',
      500: 'hsl(48, 96%, 50%)',
      600: 'hsl(48, 96%, 45%)',
      700: 'hsl(48, 96%, 40%)',
      800: 'hsl(48, 96%, 35%)',
      900: 'hsl(48, 96%, 25%)',
      950: 'hsl(48, 96%, 15%)',
    },

    // Error colors
    error: {
      50: 'hsl(0, 85%, 96%)',
      100: 'hsl(0, 85%, 91%)',
      200: 'hsl(0, 85%, 83%)',
      300: 'hsl(0, 85%, 72%)',
      400: 'hsl(0, 85%, 65%)',
      500: 'hsl(0, 85%, 50%)',
      600: 'hsl(0, 85%, 45%)',
      700: 'hsl(0, 85%, 40%)',
      800: 'hsl(0, 85%, 35%)',
      900: 'hsl(0, 85%, 25%)',
      950: 'hsl(0, 85%, 15%)',
    },

    // Neutral colors
    neutral: {
      50: 'hsl(210, 20%, 98%)',
      100: 'hsl(210, 20%, 96%)',
      200: 'hsl(214, 16%, 90%)',
      300: 'hsl(214, 16%, 83%)',
      400: 'hsl(214, 16%, 72%)',
      500: 'hsl(214, 16%, 60%)',
      600: 'hsl(214, 16%, 48%)',
      700: 'hsl(214, 16%, 36%)',
      800: 'hsl(214, 16%, 24%)',
      900: 'hsl(214, 16%, 12%)',
      950: 'hsl(214, 16%, 6%)',
    },

    // Background colors
    background: {
      primary: 'hsl(0, 0%, 100%)',
      secondary: 'hsl(210, 20%, 98%)',
      tertiary: 'hsl(210, 20%, 96%)',
      dark: 'hsl(214, 16%, 6%)',
      darkSecondary: 'hsl(214, 16%, 12%)',
      darkTertiary: 'hsl(214, 16%, 24%)',
    },

    // Text colors
    text: {
      primary: 'hsl(214, 16%, 12%)',
      secondary: 'hsl(214, 16%, 36%)',
      tertiary: 'hsl(214, 16%, 48%)',
      inverse: 'hsl(0, 0%, 100%)',
      muted: 'hsl(214, 16%, 60%)',
    },

    // Border colors
    border: {
      light: 'hsl(214, 16%, 90%)',
      medium: 'hsl(214, 16%, 83%)',
      dark: 'hsl(214, 16%, 72%)',
      darkMode: 'hsl(214, 16%, 24%)',
    },
  },

  // Spacing scale
  spacing: {
    xs: '0.25rem',    // 4px
    sm: '0.5rem',     // 8px
    md: '1rem',       // 16px
    lg: '1.5rem',     // 24px
    xl: '2rem',       // 32px
    '2xl': '3rem',    // 48px
    '3xl': '4rem',    // 64px
    '4xl': '6rem',    // 96px
    '5xl': '8rem',    // 128px
  },

  // Border radius
  borderRadius: {
    none: '0',
    sm: '0.125rem',   // 2px
    md: '0.25rem',    // 4px
    lg: '0.5rem',     // 8px
    xl: '0.75rem',    // 12px
    '2xl': '1rem',    // 16px
    '3xl': '1.5rem',  // 24px
    full: '9999px',
  },

  // Shadows
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  },

  // Transitions
  transitions: {
    fast: '150ms ease-in-out',
    normal: '300ms ease-in-out',
    slow: '500ms ease-in-out',
  },

  // Typography
  typography: {
    fontSizes: {
      xs: '0.75rem',    // 12px
      sm: '0.875rem',   // 14px
      base: '1rem',     // 16px
      lg: '1.125rem',   // 18px
      xl: '1.25rem',    // 20px
      '2xl': '1.5rem',  // 24px
      '3xl': '1.875rem', // 30px
      '4xl': '2.25rem',  // 36px
      '5xl': '3rem',     // 48px
      '6xl': '3.75rem',  // 60px
      '7xl': '4.5rem',   // 72px
    },
    fontWeights: {
      light: '300',
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
      extrabold: '800',
    },
    lineHeights: {
      tight: '1.25',
      normal: '1.5',
      relaxed: '1.75',
    },
  },
};

// CSS Variables generator
export const generateCSSVariables = () => {
  const variables: Record<string, string> = {};
  
  // Generate color variables
  Object.entries(theme.colors).forEach(([category, colors]) => {
    if (typeof colors === 'object') {
      Object.entries(colors).forEach(([shade, value]) => {
        variables[`--color-${category}-${shade}`] = value;
      });
    }
  });

  // Generate spacing variables
  Object.entries(theme.spacing).forEach(([name, value]) => {
    variables[`--spacing-${name}`] = value;
  });

  // Generate border radius variables
  Object.entries(theme.borderRadius).forEach(([name, value]) => {
    variables[`--radius-${name}`] = value;
  });

  // Generate shadow variables
  Object.entries(theme.shadows).forEach(([name, value]) => {
    variables[`--shadow-${name}`] = value;
  });

  // Generate transition variables
  Object.entries(theme.transitions).forEach(([name, value]) => {
    variables[`--transition-${name}`] = value;
  });

  // Generate typography variables
  Object.entries(theme.typography.fontSizes).forEach(([name, value]) => {
    variables[`--font-size-${name}`] = value;
  });

  Object.entries(theme.typography.fontWeights).forEach(([name, value]) => {
    variables[`--font-weight-${name}`] = value;
  });

  Object.entries(theme.typography.lineHeights).forEach(([name, value]) => {
    variables[`--line-height-${name}`] = value;
  });

  return variables;
};

// Utility function to get CSS variable
export const getCSSVariable = (name: string): string => {
  return `var(${name})`;
};

// Common color combinations
export const colorSchemes = {
  primary: {
    background: 'var(--color-primary-50)',
    text: 'var(--color-primary-900)',
    border: 'var(--color-primary-200)',
    hover: 'var(--color-primary-100)',
  },
  secondary: {
    background: 'var(--color-secondary-50)',
    text: 'var(--color-secondary-900)',
    border: 'var(--color-secondary-200)',
    hover: 'var(--color-secondary-100)',
  },
  success: {
    background: 'var(--color-success-50)',
    text: 'var(--color-success-900)',
    border: 'var(--color-success-200)',
    hover: 'var(--color-success-100)',
  },
  warning: {
    background: 'var(--color-warning-50)',
    text: 'var(--color-warning-900)',
    border: 'var(--color-warning-200)',
    hover: 'var(--color-warning-100)',
  },
  error: {
    background: 'var(--color-error-50)',
    text: 'var(--color-error-900)',
    border: 'var(--color-error-200)',
    hover: 'var(--color-error-100)',
  },
};
