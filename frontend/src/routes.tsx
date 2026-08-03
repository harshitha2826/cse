// src/routes.tsx
import { lazy } from 'react';
import { Navigate, RouteObject } from 'react-router-dom';

// Lazy load pages for code‑splitting
const Home = lazy(() => import('./pages/Home'));
const Auth = lazy(() => import('./pages/Auth'));
const Dashboard = lazy(() => import('./pages/Dashboard'));

export const routes: RouteObject[] = [
  { path: '/', element: <Home /> },
  { path: '/auth/*', element: <Auth /> },
  { path: '/dashboard/*', element: <Dashboard /> },
  { path: '*', element: <Navigate to='/' replace /> },
];
