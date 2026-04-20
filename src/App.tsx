import { Navigate, Route, Routes } from "react-router-dom";
import EditorRoute from "./routes/EditorRoute";
import ShareRoute from "./routes/ShareRoute";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<EditorRoute />} />
      <Route path="/s/:payload" element={<ShareRoute />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
