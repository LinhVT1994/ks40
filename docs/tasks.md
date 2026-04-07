# Next.js Project Initialization

- [x] Initialize Next.js project with Tailwind CSS
  - [x] Set up Next.js app in a temporary folder to handle naming restrictions
  - [x] Move initialized files to current workspace
- [x] Verify project setup

# Architecture Design

- [x] Plan feature-driven architecture
  - [x] Analyze existing design files
  - [x] Create implementation plan for folder structure

- [x] Initialize base folder structure
  - [x] Create `src/features/` with auth, member, admin folders
  - [x] Create `src/components/`, `src/lib/`, `src/types/`
  - [x] Set up basic app routing groups `(auth)`, `(member)`, `(admin)`

# Database Setup

- [x] Configure PostgreSQL via Docker
  - [x] Create `docker-compose.yml` for Postgres
  - [x] Set up `.env` and `.env.example`
  - [x] Start database container

# UI Design System

- [/] Define color palette based on UI design
  - [x] Extract colors from `login.html`
  - [x] Propose color variables and Tailwind config

# Authentication Feature

- [x] Implement Login Page UI
  - [x] Create implementation plan for Login components
  - [x] Build global layout components (AuthLayout, Header, Footer)
  - [x] Build auth-specific components (LoginForm, GoogleLoginButton)
  - [x] Assemble `app/(auth)/login/page.tsx`

- [x] Implement Register Page UI
  - [x] Analyze `design/ui/register.html`
  - [x] Build `RegisterForm` component
  - [x] Assemble `app/(auth)/register/page.tsx`
  - [x] Refactor to Multi-step Flow
    - [x] Add state management to `RegisterForm`
    - [x] Step 1: Google + Email Input
    - [x] Step 2: Password + Confirmation Details

- [x] Implement Member Dashboard UI
  - [x] Build global layout components (MemberLayout, MemberHeader, MemberFooter)
  - [x] Build feature components (WelcomeSection, FeatureCards, RecentRequests)
  - [x] Assemble `app/(member)/dashboard/page.tsx`
  - [x] Enhance Dashboard Interactions
    - [x] Add Search Input to `FeatureCards`
    - [x] Add Grid/List View Toggles to `FeatureCards`
    - [x] Refine Card Visuals (Soft Shadows & Smooth Gradients)
    - [x] Perfect Light Mode visuals (Hidden gradients, subtle shadows)
    - [x] Move search bar to center and make it `rounded-full`
    - [x] Improve vertical spacing and overall "airiness" of the Dashboard layout
    - [x] Remove section heading "Tài liệu của bạn" for maximal minimalism
    - [x] Move Theme Toggle to User Avatar Popover
      - [x] Create `UserMenu` component with popover logic
      - [x] Integrate `UserMenu` into `MemberHeader`

- [x] Implement Forgot Password UI
  - [x] Build `ForgotPasswordForm` component
  - [x] Assemble `app/(auth)/forgot-password/page.tsx`
  - [x] Link from `LoginForm` to `/forgot-password`

# Core Features

- [x] Implement Dark Mode
  - [x] Install `next-themes`
  - [x] Create `ThemeProvider` component
  - [x] Wrap application with `ThemeProvider`
  - [x] Create `ThemeToggle` component to switch modes
- [x] Fix Dark Mode Toggle
  - [x] Investigate `next-themes` and Tailwind v4 compatibility
  - [x] Apply fix for `class` attribute selector
