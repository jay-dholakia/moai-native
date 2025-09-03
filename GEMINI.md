# Moai Native Gemini Manual

This document provides a comprehensive guide for interacting with the Moai Native codebase.

## Project Overview

Moai Native is a mobile application built with React Native and Expo. It's a feature-rich application that includes user authentication, social features, and various functionalities related to health and fitness. The application uses Supabase for its backend and database, and it has a well-defined design system to ensure a consistent user experience.

### Key Technologies

*   **Frontend:** React Native, Expo
*   **Backend:** Supabase
*   **State Management:** React Query, XState
*   **Routing:** Expo Router
*   **Styling:** A custom design system with a utility-first approach (similar to Tailwind CSS)
*   **Testing:** Maestro for E2E testing

### Architecture

The application follows a component-based architecture with a clear separation of concerns.

*   **`app/`**: Contains the main application logic, including routing and screens.
*   **`components/`**: Reusable UI components.
*   **`constants/`**: Application-wide constants, such as colors and fonts.
*   **`contexts/`**: React contexts for managing global state.
*   **`hooks/`**: Custom React hooks for encapsulating business logic.
*   **`lib/`**: Libraries and utility functions, including the Supabase client.
*   **`providers/`**: Application-wide providers for theming, data fetching, and authentication.
*   **`services/`**: Services for interacting with the Supabase backend.

## Building and Running

### Prerequisites

*   Node.js and npm
*   Expo CLI
*   An environment file (`.env`) with the following variables:
    *   `EXPO_PUBLIC_SUPABASE_URL`
    *   `EXPO_PUBLIC_SUPABASE_ANON_KEY`

### Development

To start the development server, run:

```bash
npm install
npm start
```

This will open the Expo developer tools in your browser. From there, you can run the application on a simulator or a physical device.

### Testing

The project uses Maestro for end-to-end testing. To run the tests, use the following commands:

*   Run all tests: `npm run test:e2e`
*   Run smoke tests: `npm run test:e2e:smoke`
*   Run tests for a specific feature: `npm run test:e2e:<feature>` (e.g., `npm run test:e2e:auth`)

### Linting and Type-Checking

To check for linting errors and type errors, run:

```bash
npm run lint
npm run type-check
```

## Development Conventions

### Coding Style

The project uses ESLint and Prettier to enforce a consistent coding style. Please make sure to run the linter before committing your changes.

### Testing

All new features should be accompanied by end-to-end tests. The tests are located in the `.maestro/` directory.

### Design System

The project has a well-defined design system, which is documented in the `DESIGN_SYSTEM.md` file. Please refer to this document when creating new UI components to ensure a consistent look and feel.
