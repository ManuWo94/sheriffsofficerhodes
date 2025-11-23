# Sheriff's Office Rhodes - MDT System

## Overview

This is a comprehensive Sheriff's Office Management Data Terminal (MDT) system themed around the 1899 Western era (inspired by Red Dead Redemption's Rhodes Sheriff's Office). The application provides a full-featured law enforcement management system with case tracking, jail management, weapons registry, personnel administration, and more. Built as a modern web application with a distinctive dark Western aesthetic combined with contemporary MDT panel interfaces.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack:**
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized production builds
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state management
- **UI Framework**: Radix UI primitives with shadcn/ui component library
- **Styling**: Tailwind CSS with custom Western-themed design system

**Design System:**
- Custom color palette featuring deep browns, warm golds, and aged leather tones
- Typography hierarchy using Google Fonts: Playfair Display (serif headers), Inter (body text), Roboto Mono (data tables)
- Responsive MDT panel layout with fixed sidebar navigation (240px desktop, collapsible mobile)
- Card-based content organization with consistent spacing system (Tailwind units: 4, 6, 8, 12)

**Component Structure:**
- Modular page-based architecture (Dashboard, Cases, Jail, Fines, Laws, Weapons, Personnel, Notes, Audit)
- Reusable UI components from shadcn/ui (buttons, dialogs, tables, forms, badges, etc.)
- Custom sidebar navigation component with rank display
- Authentication wrapper protecting all routes

### Backend Architecture

**Technology Stack:**
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Database**: PostgreSQL via Neon serverless driver
- **Session Management**: In-memory session store with token-based authentication

**API Design:**
- RESTful API endpoints organized by resource type
- Session-based authentication with 24-hour token expiration
- Automatic session cleanup via periodic intervals
- Centralized audit logging for all CRUD operations

**Authentication & Authorization:**
- Login system with username/password
- Rank-based permission system (7 levels from Trainee to Sheriff)
- Delete permissions restricted to Sheriff, Chief Deputy, and Deputy Sergeant
- Task assignment permissions for Sheriff, Deputy Sheriff, and Deputy Sergeant
- Forced password change on first login
- Session tokens stored in localStorage with HTTP headers

### Database Schema

**Core Tables:**
- **users**: User accounts with username, password, rank, and password change flags
- **cases**: Case files with status tracking (offen, in Bearbeitung, abgeschlossen)
- **jail_records**: Inmate tracking with countdown timers and release management
- **fines**: Fine/violation records with amounts and remarks
- **city_laws**: Single-record table for city laws text content
- **weapons**: Weapon registry with status (registriert, beschlagnahmt, zurückgegeben)
- **tasks**: Task assignment system with status tracking
- **global_notes**: Shared notes visible to all users
- **user_notes**: Personal notes per user
- **audit_logs**: Comprehensive activity logging for compliance

**Data Relationships:**
- Person summary derived from case records (no separate persons table)
- Audit logs reference entity types and IDs for traceability
- Tasks can be assigned to specific users with priority levels

### State Management Patterns

**Client-Side:**
- TanStack Query for server state caching and synchronization
- React Context for authentication state (AuthContext)
- Local component state for form inputs and UI interactions
- Query invalidation on mutations to ensure data freshness

**Server-Side:**
- In-memory storage interface abstraction for data operations
- Session state managed in Map with expiration timestamps
- Audit log creation on all data modifications

### External Dependencies

**UI Libraries:**
- @radix-ui/* - Headless accessible UI primitives (dialogs, dropdowns, tooltips, etc.)
- shadcn/ui - Pre-built component library using Radix UI
- lucide-react - Icon system
- Tailwind CSS - Utility-first styling framework

**Data Management:**
- @tanstack/react-query - Server state management
- drizzle-orm - Type-safe ORM
- @neondatabase/serverless - PostgreSQL driver for Neon database
- drizzle-zod - Schema validation using Zod

**Forms & Validation:**
- react-hook-form - Form state management
- @hookform/resolvers - Form validation resolvers
- zod - Schema validation

**Utilities:**
- date-fns - Date manipulation and formatting (German locale)
- class-variance-authority - CSS variant management
- clsx + tailwind-merge - Conditional className utilities
- wouter - Lightweight routing

**Development Tools:**
- Vite - Build tool and dev server
- TypeScript - Type safety
- ESBuild - Production bundling
- Replit-specific plugins for development environment integration

**Database:**
- Neon PostgreSQL (serverless) - Production database
- Drizzle Kit - Database migrations and schema management
- connect-pg-simple - PostgreSQL session store (available but using in-memory)

### Security Considerations

- Passwords stored as plain text (note: production systems should use bcrypt/argon2)
- Session tokens with 24-hour expiration
- Permission checks on delete and assignment operations
- Audit logging for accountability
- Client-side and server-side role validation