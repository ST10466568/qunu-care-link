# Hopewell Community Clinic Management System

## Overview

This is a full-stack clinic management system for Hopewell Community Clinic in Qunu Village, Eastern Cape. The application provides comprehensive appointment booking, patient management, and staff administration features. It serves both patients who can book appointments online and clinic staff who can manage appointments, patients, and administrative tasks.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The frontend is built using React with TypeScript and modern tooling:
- **React Router** for client-side navigation with protected and public routes
- **TanStack Query** for server state management and API caching
- **shadcn/ui components** built on Radix UI primitives for consistent design
- **Tailwind CSS** for styling with custom design system variables
- **Vite** as the build tool with HMR for development

### Backend Architecture
The backend follows a RESTful API pattern using Express.js:
- **Express.js** server with TypeScript for type safety
- **JWT-based authentication** with bcrypt for password hashing
- **Role-based access control** supporting patient and staff user types
- **RESTful API endpoints** for CRUD operations on all entities
- **Middleware pattern** for authentication and request logging

### Database Design
The system uses PostgreSQL with Drizzle ORM for type-safe database operations:
- **PostgreSQL** as the primary database
- **Drizzle ORM** for schema definition and query building
- **UUID primary keys** for all entities to ensure uniqueness
- **Timestamp tracking** for created_at and updated_at fields
- **Relational data model** linking patients, staff, services, appointments, and time slots

### Authentication System
Multi-tier authentication supporting different user roles:
- **JWT tokens** with 7-day expiration for session management
- **Dual user system** - unified authentication with role-specific profiles
- **Patient accounts** for appointment booking and history viewing
- **Staff accounts** with role-based permissions (doctor, nurse, admin)
- **Password hashing** using bcryptjs with salt rounds

### Component Architecture
Modular component structure with clear separation of concerns:
- **Page-level components** for main routes (Index, Auth, Dashboard, NotFound)
- **Feature-specific components** in dashboard subdirectory
- **Reusable UI components** from shadcn/ui library
- **Context providers** for global state management (AuthContext)
- **Custom hooks** for common functionality (useToast, useIsMobile)

### State Management
Combination of local state and server state management:
- **React Context** for authentication state and user session
- **TanStack Query** for server state caching and synchronization
- **Local component state** for form inputs and UI interactions
- **Real-time updates** through refetching after mutations

### API Design
RESTful API with consistent patterns:
- **Authentication endpoints** (/api/auth/*) for signup and signin
- **Protected routes** requiring valid JWT tokens
- **CRUD operations** for all entities with proper HTTP methods
- **Error handling** with consistent JSON error responses
- **Request logging** middleware for API monitoring

## External Dependencies

### Database Services
- **PostgreSQL** - Primary database for data persistence
- **Neon Database** - Serverless PostgreSQL hosting (@neondatabase/serverless)

### Authentication & Security
- **bcryptjs** - Password hashing and verification
- **jsonwebtoken** - JWT token generation and verification

### UI & Styling
- **Radix UI** - Accessible component primitives for all UI elements
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Icon library for consistent iconography
- **class-variance-authority** - Utility for managing component variants

### Development Tools
- **Vite** - Frontend build tool and development server
- **TypeScript** - Type safety across the entire application
- **Drizzle Kit** - Database migrations and schema management
- **ESBuild** - Server-side bundling for production

### Third-party Integrations
- **Supabase** - Used for additional authentication features and edge functions
- **React Hook Form** - Form state management and validation
- **Zod** - Schema validation for type-safe form handling
- **Date-fns** - Date manipulation and formatting utilities