import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { Layout } from './components/layout/Layout';
import { OverviewPage } from './pages/OverviewPage';
import { DeviationsPage } from './pages/DeviationsPage';
import { InvestigationPage } from './pages/InvestigationPage';
import { RecommendationsPage } from './pages/RecommendationsPage';
import { PrecedentsPage } from './pages/PrecedentsPage';
import { CapaPage } from './pages/CapaPage';
import { EffectivenessPage } from './pages/EffectivenessPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { MemoryPage } from './pages/MemoryPage';
import { InspectorPage } from './pages/InspectorPage';

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<OverviewPage />} />
            <Route path="overview" element={<Navigate to="/" replace />} />
            <Route path="deviations" element={<DeviationsPage />} />
            <Route path="investigation" element={<InvestigationPage />} />
            <Route path="recommendations" element={<RecommendationsPage />} />
            <Route path="precedents" element={<PrecedentsPage />} />
            <Route path="capa" element={<CapaPage />} />
            <Route path="effectiveness" element={<EffectivenessPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="memory" element={<MemoryPage />} />
            <Route path="inspector" element={<InspectorPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
};

export default App;
