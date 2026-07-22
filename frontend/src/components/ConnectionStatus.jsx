import { useCallback, useEffect, useState } from "react";
import api from "../api/client";
import Icon from "./Icon";

export default function ConnectionStatus({ language = "en" }) {
  const [offline, setOffline] = useState(() => !navigator.onLine);
  const [checking, setChecking] = useState(false);

  const check = useCallback(async () => {
    if (!navigator.onLine) { setOffline(true); return; }
    setChecking(true);
    try { await api.get("/", { timeout: 5000 }); setOffline(false); }
    catch { setOffline(true); }
    finally { setChecking(false); }
  }, []);

  useEffect(() => {
    const online = () => check();
    const offlineNow = () => setOffline(true);
    window.addEventListener("online", online);
    window.addEventListener("offline", offlineNow);
    check();
    const timer = window.setInterval(check, 60000);
    return () => { window.clearInterval(timer); window.removeEventListener("online", online); window.removeEventListener("offline", offlineNow); };
  }, [check]);

  if (!offline) return null;
  const hi = language === "hi";
  return <div className="connection-status" role="status" aria-live="polite"><Icon name="shield" size={18} /><span><strong>{hi ? "कनेक्शन उपलब्ध नहीं है" : "Connection unavailable"}</strong><small>{hi ? "आपका लिखा हुआ ड्राफ्ट सुरक्षित रहेगा।" : "Your unfinished draft will stay saved."}</small></span><button type="button" onClick={check} disabled={checking}>{checking ? (hi ? "जाँच…" : "Checking…") : (hi ? "फिर जाँचें" : "Retry")}</button></div>;
}
