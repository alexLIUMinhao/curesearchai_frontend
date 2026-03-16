import { createBrowserRouter, Navigate } from 'react-router-dom';
import { WorkspacePage } from '../pages/WorkspacePage';
import { StudioPage } from '../pages/StudioPage';

export const router = createBrowserRouter([
  { path: '/', element: <WorkspacePage /> },
  { path: '/studio/:workflowId', element: <StudioPage /> },
  { path: '*', element: <Navigate to="/" replace /> },
]);
