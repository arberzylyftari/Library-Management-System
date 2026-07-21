import { Navigate, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "@/components/protected-route";
import { AppLayout } from "@/layouts/app-layout";
import { AdminPage } from "@/pages/AdminPage";
import { AskPage } from "@/pages/AskPage";
import { BooksPage } from "@/pages/BooksPage";
import { LoginPage } from "@/pages/LoginPage";
import { RecommendationsPage } from "@/pages/RecommendationsPage";
import { RegisterPage } from "@/pages/RegisterPage";

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/books" element={<BooksPage />} />
          <Route path="/ask" element={<AskPage />} />
          <Route path="/recommendations" element={<RecommendationsPage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute adminOnly />}>
        <Route element={<AppLayout />}>
          <Route path="/admin" element={<AdminPage />} />
        </Route>
      </Route>

      <Route path="/" element={<Navigate to="/books" replace />} />
      <Route path="*" element={<Navigate to="/books" replace />} />
    </Routes>
  );
}

export default App;
