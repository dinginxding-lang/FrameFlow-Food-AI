export type Category = 'snack' | 'seasoning';
export type Tone = 'recommend' | 'selling' | 'scene' | 'review';
export type Duration = 15 | 30 | 60;
export type Product = {
  name: string;
  category: Category;
  highlights: string;
  audience: string;
  scenarios: string;
  price: string;
  restrictions: string;
  tone: Tone;
  duration: Duration;
};
export type RecognizedProduct = {
  name: string;
  category: Category | null;
  highlights: string;
};
export type Shot = { range: string; visual: string; narration: string; caption: string };
export type Script = { title: string; hook: string; narration: string; shots: Shot[]; tags: string[]; notice: string };
export type GenerationMode = 'ai' | 'demo';
