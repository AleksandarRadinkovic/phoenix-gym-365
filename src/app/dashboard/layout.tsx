// src/app/dashboard/layout.tsx
// Samo za interni panel: tamna boja trake preglednika i prikaz do samog dna ekrana
// na iPhone-u (da donji meni ne "lebdi" iznad prostora za gestu).

import type { ReactNode } from 'react';
import type { Viewport } from 'next';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#09090b',
};

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return children;
}
