import { useEffect, useRef, useState } from 'react';
import { AudioLines, BookOpen, Check, ChevronRight, CircleHelp, Clapperboard, Clipboard, Download, FileText, Film, ImagePlus, LoaderCircle, Package, Play, RefreshCcw, Scissors, Sparkles, UploadCloud, WandSparkles } from 'lucide-react';
import type { Category, Duration, GenerationMode, Product, Script, Tone } from './types';
import { demoScript, initialProduct } from './sample';

const labels: Record<Tone, string> = { recommend: '种草推荐', selling: '带货成交', scene: '场景故事', review: '客观介绍' };
const durations: Duration[] = [15, 30, 60];
const defaults = ['香辣风味', '包装便携', '适合追剧', '适合拌饭', '适合拌面', '规格清晰'];

function downloadFile(name: string, content: string, type = 'text/plain;charset=utf-8') {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement('a'); a.href = url; a.download = name; a.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function safeName(value: string) { return value.trim().replace(/[\\/:*?"<>|]/g, '_').slice(0, 50) || '商品'; }
function textExport(s: Script) {
  return `标题：${s.title}\n\n开头：${s.hook}\n\n完整口播：\n${s.narration}\n\n分镜：\n${s.shots.map((x, i) => `${i + 1}. ${x.range}\n画面：${x.visual}\n口播：${x.narration}\n字幕：${x.caption}`).join('\n\n')}\n\n标签：${s.tags.join(' ')}\n提醒：${s.notice}`;
}

export default function App() {
  const [product, setProduct] = useState<Product>(() => {
    try { const stored = JSON.parse(localStorage.getItem('frameflow-product') || 'null'); return stored && typeof stored.name === 'string' ? { ...initialProduct, ...stored } : initialProduct; }
    catch { return initialProduct; }
  });
  const [mode, setMode] = useState<GenerationMode>('demo');
  const [script, setScript] = useState<Script | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [copied, setCopied] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoName, setVideoName] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageName, setImageName] = useState('');
  const videoRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLInputElement>(null);
  const videoUrlRef = useRef<string | null>(null);
  const imageUrlRef = useRef<string | null>(null);

  useEffect(() => { localStorage.setItem('frameflow-product', JSON.stringify(product)); }, [product]);
  useEffect(() => () => {
    if (videoUrlRef.current) URL.revokeObjectURL(videoUrlRef.current);
    if (imageUrlRef.current) URL.revokeObjectURL(imageUrlRef.current);
  }, []);

  const update = <K extends keyof Product>(key: K, value: Product[K]) => setProduct(previous => ({ ...previous, [key]: value }));
  const upload = (file: File | undefined, kind: 'video' | 'image') => {
    if (!file) return;
    if (kind === 'video' && !file.type.startsWith('video/')) { setMessage('请上传视频文件。'); return; }
    if (kind === 'image' && !file.type.startsWith('image/')) { setMessage('请上传图片文件。'); return; }
    if (file.size > 500 * 1024 * 1024) { setMessage('文件超过本地预览限制（500MB）。'); return; }
    const next = URL.createObjectURL(file);
    if (kind === 'video') {
      if (videoUrlRef.current) URL.revokeObjectURL(videoUrlRef.current);
      videoUrlRef.current = next; setVideoUrl(next); setVideoName(file.name);
    } else {
      if (imageUrlRef.current) URL.revokeObjectURL(imageUrlRef.current);
      imageUrlRef.current = next; setImageUrl(next); setImageName(file.name);
    }
    setMessage('素材已导入，仅用于当前浏览器预览；不会自动上传到服务器。');
  };

  async function generate() {
    setMessage('');
    if (product.name.trim().length < 2 || product.highlights.trim().length < 5) {
      setMessage('请填写商品名称（至少 2 字）和真实卖点（至少 5 字）。'); return;
    }
    if (mode === 'demo') { setScript(demoScript(product)); setMessage('已生成规则模板示例。切换至「AI 生成」可调用真实模型。'); return; }
    setBusy(true);
    try {
      const res = await fetch('/api/generate', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(product) });
      const data = await res.json() as { script?: Script; error?: string };
      if (!res.ok || !data.script) throw new Error(data.error || '生成失败');
      setScript(data.script);
      setMessage('AI 文案生成完成。发布前请核实商品信息及实际口播时长。');
    } catch (err) { setMessage(err instanceof Error ? err.message : '服务不可用'); }
    finally { setBusy(false); }
  }

  async function copyNarration() {
    if (!script) return;
    try { await navigator.clipboard.writeText(script.narration); setCopied(true); window.setTimeout(() => setCopied(false), 1600); }
    catch { setMessage('复制失败，请手动选中文案复制。'); }
  }

  return (
    <div className="app-shell">
      <aside className="rail">
        <div className="brand-icon"><Clapperboard size={24}/></div>
        <div className="rail-link active"><WandSparkles size={21}/><span>口播创作</span></div>
        <div className="rail-link"><Film size={21}/><span>素材预览</span></div>
        <div className="rail-spacer"/>
        <div className="rail-footer"><CircleHelp size={18}/><span>V1.0</span></div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <div><span className="breadcrumb">工作台</span><ChevronRight size={14}/><strong>食品 AI 带货创作</strong><span className="top-subtitle">专为零食 · 调味料设计</span></div>
          <div className="top-actions"><span className="saved-dot"/> 商品信息自动保存在本机 <span className="version">BETA V1</span></div>
        </header>
        <main>
          <div className="page-heading"><div><span className="eyebrow"><Sparkles size={14}/> CONTENT STUDIO</span><h1>让好商品，有好故事。</h1><p>输入真实卖点，生成适合食品短视频的口播、字幕文案和拍摄分镜。</p></div><div className="heading-art"><AudioLines size={48}/></div></div>
          <div className="content-grid">
            <section className="editor-panel">
              <div className="panel-heading"><div className="heading-left"><Package size={19}/><h2>商品信息</h2></div><span className="panel-note">01 / 创作设置</span></div>
              <div className="category-tabs" role="group" aria-label="商品品类">
                <button className={product.category === 'snack' ? 'category active' : 'category'} onClick={() => update('category', 'snack' as Category)}>🍿 零食类</button>
                <button className={product.category === 'seasoning' ? 'category active' : 'category'} onClick={() => update('category', 'seasoning' as Category)}>🌶️ 调味料类</button>
              </div>
              <div className="field"><label htmlFor="name">商品名称 <em>*</em></label><input id="name" maxLength={100} value={product.name} onChange={e => update('name', e.target.value)} placeholder="例如：香辣拌饭酱"/></div>
              <div className="field"><label htmlFor="highlights">真实卖点和商品参数 <em>*</em></label><textarea id="highlights" maxLength={2500} rows={4} value={product.highlights} onChange={e => update('highlights', e.target.value)} placeholder="填写已核实的配料、口味、规格、包装特点等，一项一行"/><p className="helper">仅使用你提供的真实商品信息，不编造功效、销量和价格。</p></div>
              <div className="chips">{defaults.filter(x => !product.highlights.includes(x)).slice(0, 4).map(x => <button key={x} onClick={() => update('highlights', `${product.highlights.trim()}${product.highlights.trim() ? '；' : ''}${x}`)}>+ {x}</button>)}</div>
              <div className="field-row"><div className="field"><label htmlFor="audience">目标人群</label><input id="audience" maxLength={800} value={product.audience} onChange={e => update('audience', e.target.value)} placeholder="例如：上班族"/></div><div className="field"><label htmlFor="scenarios">使用场景</label><input id="scenarios" maxLength={800} value={product.scenarios} onChange={e => update('scenarios', e.target.value)} placeholder="例如：追剧、做饭"/></div></div>
              <div className="field-row"><div className="field"><label htmlFor="price">价格 / 活动（可选）</label><input id="price" maxLength={800} value={product.price} onChange={e => update('price', e.target.value)} placeholder="仅填已核实信息"/></div><div className="field"><label htmlFor="restrictions">禁用措辞（可选）</label><input id="restrictions" maxLength={800} value={product.restrictions} onChange={e => update('restrictions', e.target.value)} placeholder="例如：不提最低价"/></div></div>
              <div className="section-divider"/>
              <div className="subhead"><h3>创作风格</h3><span>选择口播语气</span></div>
              <div className="tone-grid">{(Object.keys(labels) as Tone[]).map(t => <button key={t} className={product.tone === t ? 'tone selected' : 'tone'} onClick={() => update('tone', t)}>{product.tone === t && <Check size={13}/>} {labels[t]}</button>)}</div>
              <div className="subhead mt"><h3>视频时长</h3><span>以实际语速为准</span></div>
              <div className="duration-list">{durations.map(d => <button key={d} className={product.duration === d ? 'duration selected' : 'duration'} onClick={() => update('duration', d)}>{d} 秒</button>)}</div>
              <div className="section-divider"/>
              <div className="subhead"><h3>生成方式</h3><span>API 密钥只保存在后端</span></div>
              <div className="mode-picker"><button onClick={() => setMode('demo')} className={mode === 'demo' ? 'selected' : ''}>示例模板 <small>无需密钥</small></button><button onClick={() => setMode('ai')} className={mode === 'ai' ? 'selected' : ''}>AI 生成 <small>需要配置 API</small></button></div>
              <button className="generate" disabled={busy} onClick={generate}>{busy ? <LoaderCircle size={18} className="spin"/> : <Sparkles size={18}/>} {busy ? '正在生成文案…' : '生成商品口播与分镜'} <ChevronRight size={18}/></button>
              {message && <p className="status" role="status">{message}</p>}
            </section>
            <div className="right-stack">
              <section className="preview-panel">
                <div className="panel-heading"><div className="heading-left"><Film size={19}/><h2>素材预览</h2></div><span className="panel-note">仅本地预览</span></div>
                <div className="media-container">
                  {videoUrl ? <video key={videoUrl} src={videoUrl} controls playsInline /> : imageUrl ? <img src={imageUrl} alt="商品预览"/> : <div className="empty-media"><div className="media-orb"><Play size={29} fill="currentColor"/></div><strong>把商品变成视频故事</strong><span>上传素材，预览视频或图片</span></div>}
                </div>
                <div className="upload-actions"><button onClick={() => videoRef.current?.click()}><UploadCloud size={16}/> 导入视频</button><button onClick={() => imageRef.current?.click()}><ImagePlus size={16}/> 导入商品图</button></div>
                <input ref={videoRef} type="file" accept="video/*" hidden onChange={e => { upload(e.target.files?.[0], 'video'); e.target.value = ''; }}/>
                <input ref={imageRef} type="file" accept="image/*" hidden onChange={e => { upload(e.target.files?.[0], 'image'); e.target.value = ''; }}/>
                {(videoName || imageName) && <p className="asset-name">当前素材：{videoName || imageName}</p>}
                <div className="preview-disclaimer"><Scissors size={15}/> 本版提供素材预览与分镜脚本；暂不支持实际视频剪辑或 MP4 导出。</div>
              </section>
              <section className="result-panel">
                <div className="panel-heading"><div className="heading-left"><FileText size={19}/><h2>生成结果</h2></div>{script && <span className="result-badge">{mode === 'ai' ? 'AI' : '示例'} · {product.duration} 秒</span>}</div>
                {script ? <div className="script-content">
                  <div className="script-header"><div><span className="eyebrow">SCRIPT / 口播文案</span><h3>{script.title}</h3></div><button className="icon-button" aria-label="重新生成" title="重新生成" onClick={generate}><RefreshCcw size={17}/></button></div>
                  <div className="script-box"><span>完整口播稿</span><p>{script.narration}</p></div>
                  <div className="result-actions"><button onClick={copyNarration}>{copied ? <Check size={16}/> : <Clipboard size={16}/>} {copied ? '已复制' : '复制口播'}</button><button onClick={() => downloadFile(`${safeName(product.name)}-口播.txt`, textExport(script))}><Download size={16}/> 导出 TXT</button><button onClick={() => downloadFile(`${safeName(product.name)}-脚本.json`, JSON.stringify({ product, script }, null, 2), 'application/json;charset=utf-8')}><Download size={16}/> JSON</button></div>
                  <div className="storyboard-title"><h3>视频分镜脚本</h3><span>{script.shots.length} 个镜头</span></div>
                  <div className="storyboard">{script.shots.map((shot, i) => <div className="shot" key={`${i}-${shot.range}`}><div className="shot-index">{String(i + 1).padStart(2, '0')}</div><div><span className="shot-time">{shot.range}</span><p><b>画面：</b>{shot.visual}</p><p><b>口播：</b>{shot.narration}</p><p><b>字幕：</b>{shot.caption}</p></div></div>)}</div>
                  <div className="tags">{script.tags.map((tag, i) => <span key={`${tag}-${i}`}>#{tag}</span>)}</div>
                  <div className="notice"><BookOpen size={16}/>{script.notice}</div>
                </div> : <div className="empty-result"><div className="result-illustration"><WandSparkles size={31}/></div><strong>创意，从一份好文案开始</strong><span>完善左侧商品信息，点击「生成商品口播与分镜」</span><div className="empty-pills"><span>口播脚本</span><span>分镜建议</span><span>屏幕字幕</span></div></div>}
              </section>
            </div>
          </div>
          <footer><span>FrameFlow Food AI · 第一版原型</span><span>食品营销内容请核实真实商品资料及平台规范。</span></footer>
        </main>
      </div>
    </div>
  );
}
