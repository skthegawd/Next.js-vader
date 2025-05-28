import { BACKEND_URL, WS_URL, API_URL, API_VERSION } from '../lib/config';

export default function EnvTest() {
  return (
    <div style={{ padding: 32 }}>
      <h1>Env Test</h1>
      <div><b>BACKEND_URL:</b> {BACKEND_URL}</div>
      <div><b>WS_URL:</b> {WS_URL}</div>
      <div><b>API_URL:</b> {API_URL}</div>
      <div><b>API_VERSION:</b> {API_VERSION}</div>
    </div>
  );
} 