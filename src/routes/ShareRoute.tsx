import { decodeShareString } from "@/lib/share/encode";
import { useDocumentStore } from "@/store/documentStore";
import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

export default function ShareRoute() {
  const { payload } = useParams<{ payload: string }>();
  const navigate = useNavigate();
  const setDoc = useDocumentStore((s) => s.setDoc);

  useEffect(() => {
    if (!payload) {
      navigate("/", { replace: true });
      return;
    }
    const doc = decodeShareString(payload);
    if (doc) {
      setDoc(doc);
    }
    navigate("/", { replace: true });
  }, [payload, navigate, setDoc]);

  return (
    <div className="h-full flex items-center justify-center text-muted">Loading shared scene…</div>
  );
}
