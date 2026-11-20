import { useState } from 'react';
import type { FormEvent } from 'react';

type Settings = { id: string; baseUrl: string; model: string; keyConfigured: boolean };
const labels: Record<string, string> = {
  idle: '未检测', checking: '检测中', healthy: '正常', timeout: '超时', not_configured: '未配置密钥',
  upstream_error: '上游请求失败', invalid_response: '响应格式异常', connection_error: '连接失败', unavailable: '检测失败',
};

export default function Admin() {
  const [token, setToken] = useState('');
  const [settings, setSettings] = useState<Settings | null>(null);
  const [catalog, setCatalog] = useState<{ activeId: string; models: Settings[] } | null>(null);
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

  async function check(id: string) {
    setHealth('checking');
    setUpstream(undefined);
    try {
      const { response, data } = await request(`/api/health/model?id=${encodeURIComponent(id)}`);
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
      const active = data.models.find((item: Settings) => item.id === data.activeId);
      setCatalog(data);
      setSettings(active);
      await check(active.id);
    });
  }

  function choose(item: Settings) {
    setSettings(item);
    setApiKey('');
    setHealth('idle');
    setUpstream(undefined);
    setMessage('');
  }

  async function update(action: 'save' | 'activate' | 'delete', item: Settings) {
    const body = { action, id: item.id || undefined, ...(action === 'save' ? {
      model: item.model, baseUrl: item.baseUrl, apiKey: apiKey.trim() || undefined,
    } : {}) };
    const { response, data } = await request('/api/admin/model', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    });
    if (!response.ok) throw new Error('更新模型失败。');
    setCatalog(data);
    const selected = data.models.find((model: Settings) => model.id === data.selectedId);
    choose(selected);
    setMessage(action === 'activate' ? '已启用此模型。' : action === 'delete' ? '已删除模型。' : '模型配置已保存。');
    if (action !== 'delete') await check(selected.id);
  }

  function save(event: FormEvent) {
    event.preventDefault();
    if (settings) void run(() => update('save', settings));
  }

  return <main className="admin-page">
    <a className="admin-link" href="/">← 返回创作台</a>
    <h1 className="admin-brand-heading"><img src="/logo.svg" alt="" width="36" height="36" />模型服务</h1>
    {!settings || !catalog ? <form className="editor-panel" onSubmit={login}>
      <label className="field">管理令牌<input type="password" required autoComplete="off" disabled={busy} value={token} onChange={event => setToken(event.target.value)}/></label>
      <button className="model-health-refresh" disabled={busy}>进入后台</button>
    </form> : <section className="editor-panel">
      <h2>模型列表</h2>
      <label className="field">选择模型<select value={settings.id} disabled={busy} onChange={event => {
        const item = catalog.models.find(model => model.id === event.target.value);
        if (item) choose(item);
      }}>
        {!settings.id && <option value="">新增模型（未保存）</option>}
        {catalog.models.map(item => <option key={item.id} value={item.id}>{item.model} — {item.baseUrl}{item.id === catalog.activeId ? '（使用中）' : ''}</option>)}
      </select></label>
      <div className="model-health-row">
        <button type="button" className="model-health-refresh" disabled={busy} onClick={() => choose({ id: '', model: '', baseUrl: '', keyConfigured: false })}>新增模型</button>
        {settings.id && settings.id !== catalog.activeId && <>
          <button type="button" className="model-health-refresh" disabled={busy} onClick={() => void run(() => update('activate', settings))}>启用此模型</button>
          <button type="button" className="model-health-refresh" disabled={busy} onClick={() => { if (window.confirm('确定删除此模型配置？')) void run(() => update('delete', settings)); }}>删除</button>
        </>}
      </div>
      <div className="model-health-row">
        <span role="status" className={`model-health ${health === 'healthy' ? 'healthy' : ['idle', 'checking'].includes(health) ? '' : 'failed'}`}>
          <span className="model-health-dot" aria-hidden="true"/>模型 API：{labels[health]}{upstream ? `（${upstream}）` : ''}
        </span>
        <button type="button" className="model-health-refresh" disabled={busy || !settings.id} onClick={() => void run(() => check(settings.id))}>重新检测</button>
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
