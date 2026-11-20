import { useState } from 'react';
import type { FormEvent } from 'react';

type Settings = { baseUrl: string; model: string; keyConfigured: boolean };
const labels: Record<string, string> = {
  idle: '未检测', checking: '检测中', healthy: '正常', timeout: '超时', not_configured: '未配置密钥',
  upstream_error: '上游请求失败', invalid_response: '响应格式异常', connection_error: '连接失败', unavailable: '检测失败',
};

export default function Admin() {
  const [token, setToken] = useState('');
  const [settings, setSettings] = useState<Settings | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [busy, setBusy] = useState(false);
  const [health, setHealth] = useState('idle');
  const [upstream, setUpstream] = useState<number>();
  const [message, setMessage] = useState('');

  async function request(path: string, options: RequestInit = {}) {
    const response = await fetch(path, {
      ...options, signal: AbortSignal.timeout(12_000),
      headers: { Authorization: `Bearer ${token.trim()}`, ...options.headers },
    });
    const data = await response.json();
    if (!response.ok && data.error) throw new Error(data.error);
    return { response, data };
  }

  async function check() {
    setHealth('checking');
    setUpstream(undefined);
    try {
      const { response, data } = await request('/api/health/model');
      const state = data?.state;
      setHealth(response.ok && state === 'healthy' && data.ok === true ? 'healthy'
        : !response.ok && typeof state === 'string' && Object.hasOwn(labels, state)
          && !['idle', 'checking', 'healthy'].includes(state) ? state : 'unavailable');
      if (Number.isInteger(data?.upstreamStatus)) setUpstream(data.upstreamStatus);
    } catch (error) {
      setHealth(error instanceof Error && error.name === 'TimeoutError' ? 'timeout' : 'unavailable');
    }
  }

  async function run(action: () => Promise<void>) {
    setBusy(true);
    setMessage('');
    try { await action(); }
    catch (error) { setMessage(error instanceof Error ? error.message : '请求失败。'); }
    finally { setBusy(false); }
  }

  function login(event: FormEvent) {
    event.preventDefault();
    void run(async () => {
      const { response, data } = await request('/api/admin/model');
      if (!response.ok) throw new Error('无法读取模型配置。');
      setSettings(data);
      await check();
    });
  }

  function save(event: FormEvent) {
    event.preventDefault();
    if (!settings) return;
    void run(async () => {
      const { response, data } = await request('/api/admin/model', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: settings.model, baseUrl: settings.baseUrl, ...(apiKey.trim() ? { apiKey: apiKey.trim() } : {}) }),
      });
      if (!response.ok) throw new Error('保存失败。');
      setSettings(data);
      setApiKey('');
      setMessage('模型配置已保存并生效。');
      await check();
    });
  }

  return <main className="admin-page">
    <a className="admin-link" href="/">← 返回创作台</a>
    <h1>后台管理</h1>
    {!settings ? <form className="editor-panel" onSubmit={login}>
      <label className="field">管理令牌<input type="password" required autoComplete="off" disabled={busy} value={token} onChange={event => setToken(event.target.value)}/></label>
      <button className="model-health-refresh" disabled={busy}>进入后台</button>
    </form> : <section className="editor-panel">
      <h2>模型配置</h2>
      <div className="model-health-row">
        <span role="status" className={`model-health ${health === 'healthy' ? 'healthy' : ['idle', 'checking'].includes(health) ? '' : 'failed'}`}>
          <span className="model-health-dot" aria-hidden="true"/>模型 API：{labels[health]}{upstream ? `（${upstream}）` : ''}
        </span>
        <button type="button" className="model-health-refresh" disabled={busy} onClick={() => void run(check)}>重新检测</button>
      </div>
      <p className="model-health-note">检测已保存配置的文本接口，不验证图片识别。</p>
      <form onSubmit={save}>
        <label className="field">API 基础地址<input type="url" required disabled={busy} value={settings.baseUrl} onChange={event => setSettings({ ...settings, baseUrl: event.target.value })}/></label>
        <label className="field">模型名称<input required disabled={busy} value={settings.model} onChange={event => setSettings({ ...settings, model: event.target.value })}/></label>
        <label className="field">API 密钥（{settings.keyConfigured ? '已配置，留空则保留' : '未配置'}）<input type="password" autoComplete="off" disabled={busy} value={apiKey} onChange={event => setApiKey(event.target.value)}/></label>
        <button className="model-health-refresh" disabled={busy}>保存并检测</button>
      </form>
    </section>}
    {message && <p className="admin-message" role="status">{message}</p>}
  </main>;
}
