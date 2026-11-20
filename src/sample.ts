import type { Product, Script } from './types';

export const initialProduct: Product = {
  name: '香辣拌饭酱', category: 'seasoning',
  highlights: '香辣口味；适合拌米饭、拌面；净含量 200g',
  audience: '上班族、喜欢香辣口味的人', scenarios: '午餐、晚餐、快手拌饭',
  price: '', restrictions: '', tone: 'recommend', duration: 30,
};

export function demoScript(p: Product): Script {
  const name = p.name.trim() || (p.category === 'snack' ? '这款零食' : '这款调味料');
  const isSnack = p.category === 'snack';
  const claims = p.highlights.split(/[；;，,\n]/).map(x => x.trim()).filter(Boolean);
  const highlight = claims.slice(0, 2).join('，') || '包装上标注的商品特点';
  const scene = p.scenarios.trim() || (isSnack ? '休闲时刻' : '日常做饭');
  const intro = isSnack ? `想给${scene}准备点零食？看看${name}。` : `想给${scene}换换口味？可以了解一下${name}。`;
  const detail = `商品资料写到：${highlight}。实际口味和体验以产品信息及个人感受为准。`;
  const end = `如果你喜欢这类${isSnack ? '零食' : '调味搭配'}，可以先看看配料、规格和适用场景再决定。`;
  const words = `${intro}${detail}${end}`;
  const segments = [intro, detail, end];
  const ranges = p.duration === 15 ? ['0–4 秒', '4–10 秒', '10–15 秒'] : p.duration === 30 ? ['0–7 秒', '7–22 秒', '22–30 秒'] : ['0–12 秒', '12–44 秒', '44–60 秒'];
  return {
    title: `${name}｜${isSnack ? '休闲零食' : '日常调味'}分享`, hook: intro,
    narration: words,
    shots: [
      {range: ranges[0], visual: '商品包装正面特写，清晰展示品牌和规格', narration: segments[0], caption: intro},
      {range: ranges[1], visual: isSnack ? '展示产品细节、开袋与实际食用场景' : '展示调味料外观、用量与搭配食物', narration: segments[1], caption: highlight},
      {range: ranges[2], visual: '商品包装及真实信息，画面收尾', narration: segments[2], caption: '查看配料与商品规格'},
    ],
    tags: isSnack ? ['零食分享', '美食推荐', '休闲零食'] : ['调味料', '美食分享', '家常美食'],
    notice: '示例模板，不是 AI 生成；仅根据输入资料组合，不代表已验证商品功效或口味。',
  };
}
