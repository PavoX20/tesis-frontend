import { Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "@/layout/MainLayout";
import ViewCatalogo from "@/pages/Catalogo/ViewCatalogo";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />} />
      <Route path="/catalogo" element={<ViewCatalogo />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}