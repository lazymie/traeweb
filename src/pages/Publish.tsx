import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, PawPrint, ImagePlus, X, Heart, Stethoscope } from 'lucide-react';
import { uploadFile, post } from '@/utils/api';
import { useAuthStore } from '@/store/auth';
import { toast } from '@/store/toast';
import type { PetCategory, PetGender, AgeUnit, Pet } from '../../shared/types';
import { cn } from '@/lib/utils';

const STEPS = [
  { num: 1, title: '基本信息', icon: PawPrint },
  { num: 2, title: '健康档案', icon: Stethoscope },
  { num: 3, title: '照片上传', icon: ImagePlus },
  { num: 4, title: '预览提交', icon: Check },
];

const CATEGORIES: { v: PetCategory; label: string }[] = [
  { v: 'dog', label: '狗狗' },
  { v: 'cat', label: '猫咪' },
  { v: 'other', label: '其他' },
];

const GENDERS: { v: PetGender; label: string }[] = [
  { v: 'male', label: '男孩' },
  { v: 'female', label: '女孩' },
  { v: 'unknown', label: '未知' },
];

interface FormState {
  title: string;
  category: PetCategory;
  breed: string;
  age: number;
  ageUnit: AgeUnit;
  gender: PetGender;
  health: string;
  vaccination: string;
  sterilized: boolean;
  personality: string;
  description: string;
  location: string;
  images: string[];
}

const DEFAULT: FormState = {
  title: '', category: 'cat', breed: '', age: 1, ageUnit: 'year',
  gender: 'unknown', health: '', vaccination: '', sterilized: false,
  personality: '', description: '', location: '', images: [],
};

export default function Publish() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormState>(DEFAULT);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm(s => ({ ...s, [k]: v }));

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const uploaded: string[] = [];
      for (const file of Array.from(files)) {
        const res = await uploadFile(file);
        uploaded.push(res.url);
      }
      set('images', [...form.images, ...uploaded]);
      toast.success(`已上传 ${uploaded.length} 张图片`);
    } catch (e: any) {
      toast.error(e.message || '上传失败');
    } finally {
      setUploading(false);
    }
  };

  const canNext = () => {
    if (step === 1) return form.title.trim() && form.breed.trim();
    if (step === 2) return true;
    if (step === 3) return form.images.length > 0;
    return true;
  };

  const next = () => canNext() && setStep(s => Math.min(4, s + 1));
  const prev = () => setStep(s => Math.max(1, s - 1));

  const onSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await post<Pet>('/pets', form);
      toast.success('提交成功，等待管理员审核');
      navigate(`/pets/${res.id}`);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container py-8 md:py-12 max-w-4xl">
      <div className="mb-8">
        <span className="heading-eyebrow">发布领养信息</span>
        <h1 className="mt-2 font-serif text-3xl md:text-4xl font-bold text-ink-900">
          帮助一个毛孩子找家
        </h1>
        <p className="mt-2 text-sm text-ink-700">您的信息提交后将进入审核，通过后将在平台展示</p>
      </div>

      {/* 步骤指示器 */}
      <div className="mb-10 flex items-center justify-between">
        {STEPS.map((s, i) => (
          <div key={s.num} className="flex-1 flex items-center">
            <div className="flex flex-col items-center gap-2">
              <div
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-full font-mono text-sm transition-colors',
                  step > s.num ? 'bg-sage-500 text-cream-50' :
                  step === s.num ? 'bg-coral-400 text-cream-50 shadow-soft' :
                  'bg-warm-100 text-ink-500'
                )}
              >
                {step > s.num ? <Check size={16} /> : s.num}
              </div>
              <span className={cn(
                'text-xs font-medium',
                step >= s.num ? 'text-ink-900' : 'text-ink-500'
              )}>{s.title}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={cn(
                'flex-1 h-0.5 mx-2 mb-5 transition-colors',
                step > s.num ? 'bg-sage-500' : 'bg-warm-100'
              )} />
            )}
          </div>
        ))}
      </div>

      <div className="card p-6 md:p-8">
        {/* Step 1 基本信息 */}
        {step === 1 && (
          <div className="space-y-5 animate-fade-in">
            <div>
              <label className="block text-sm font-medium mb-2">标题 <span className="text-coral-400">*</span></label>
              <input
                type="text" value={form.title}
                onChange={e => set('title', e.target.value)}
                placeholder="给这个毛孩子起个吸引人的名字，如「橘子」"
                className="input-base"
                maxLength={30}
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">种类</label>
                <div className="grid grid-cols-3 gap-2">
                  {CATEGORIES.map(c => (
                    <button
                      key={c.v}
                      type="button"
                      onClick={() => set('category', c.v)}
                      className={cn(
                        'rounded-xl py-2.5 text-sm font-medium transition-colors',
                        form.category === c.v ? 'bg-coral-400 text-cream-50 shadow-soft' : 'bg-warm-100 text-ink-700'
                      )}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">品种 <span className="text-coral-400">*</span></label>
                <input
                  type="text" value={form.breed}
                  onChange={e => set('breed', e.target.value)}
                  placeholder="如：橘猫、金毛..."
                  className="input-base"
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">年龄</label>
                <input
                  type="number" min={0} value={form.age}
                  onChange={e => set('age', Number(e.target.value))}
                  className="input-base"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">单位</label>
                <select
                  value={form.ageUnit}
                  onChange={e => set('ageUnit', e.target.value as AgeUnit)}
                  className="input-base"
                >
                  <option value="year">岁</option>
                  <option value="month">月</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">性别</label>
                <div className="grid grid-cols-3 gap-1">
                  {GENDERS.map(g => (
                    <button
                      key={g.v}
                      type="button"
                      onClick={() => set('gender', g.v)}
                      className={cn(
                        'rounded-lg py-2 text-xs font-medium transition-colors',
                        form.gender === g.v ? 'bg-coral-400 text-cream-50' : 'bg-warm-100 text-ink-700'
                      )}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">所在地</label>
              <input
                type="text" value={form.location}
                onChange={e => set('location', e.target.value)}
                placeholder="如：北京市朝阳区"
                className="input-base"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">性格特点</label>
              <input
                type="text" value={form.personality}
                onChange={e => set('personality', e.target.value)}
                placeholder="如：亲人、爱撒娇、活泼"
                className="input-base"
              />
            </div>
          </div>
        )}

        {/* Step 2 健康档案 */}
        {step === 2 && (
          <div className="space-y-5 animate-fade-in">
            <div>
              <label className="block text-sm font-medium mb-2">健康状况</label>
              <textarea
                value={form.health}
                onChange={e => set('health', e.target.value)}
                rows={2}
                placeholder="如：健康，体内外已驱虫"
                className="input-base resize-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">免疫情况</label>
              <textarea
                value={form.vaccination}
                onChange={e => set('vaccination', e.target.value)}
                rows={2}
                placeholder="如：已完成猫三联+狂犬疫苗"
                className="input-base resize-none"
              />
            </div>
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-warm-100/60">
              <input
                type="checkbox" id="sterilized"
                checked={form.sterilized}
                onChange={e => set('sterilized', e.target.checked)}
                className="h-5 w-5 accent-coral-400"
              />
              <label htmlFor="sterilized" className="text-sm text-ink-900 cursor-pointer">
                已绝育 <span className="text-ink-500">（未绝育也可后续承诺绝育）</span>
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">它的故事 / 详细描述</label>
              <textarea
                value={form.description}
                onChange={e => set('description', e.target.value)}
                rows={5}
                placeholder="介绍一下这只宠物的来历、性格、适合什么样的家庭..."
                className="input-base resize-none"
              />
            </div>
          </div>
        )}

        {/* Step 3 照片上传 */}
        {step === 3 && (
          <div className="space-y-5 animate-fade-in">
            <div>
              <label className="block text-sm font-medium mb-2">上传宠物照片</label>
              <p className="text-xs text-ink-500 mb-3">至少 1 张，建议 3-5 张，包含正面、侧面等</p>
              <label className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-warm-200 hover:border-coral-400 hover:bg-coral-400/5 py-10 cursor-pointer transition-colors">
                <ImagePlus size={32} className="text-ink-500" />
                <span className="text-sm text-ink-700">{uploading ? '上传中...' : '点击或拖拽上传图片'}</span>
                <span className="text-xs text-ink-500">支持 jpg / png / webp，单张 ≤ 5MB</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={e => handleFileUpload(e.target.files)}
                />
              </label>
            </div>

            {form.images.length > 0 && (
              <div>
                <p className="text-xs text-ink-500 mb-2">已上传 {form.images.length} 张</p>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {form.images.map((src, i) => (
                    <div key={i} className="relative group aspect-square rounded-xl overflow-hidden">
                      <img src={src} alt={`upload ${i + 1}`} className="h-full w-full object-cover" />
                      {i === 0 && (
                        <span className="absolute left-1 top-1 badge bg-coral-400 text-cream-50 text-[10px]">封面</span>
                      )}
                      <button
                        type="button"
                        onClick={() => set('images', form.images.filter((_, idx) => idx !== i))}
                        className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-ink-900/60 text-cream-50 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 4 预览 */}
        {step === 4 && (
          <div className="space-y-5 animate-fade-in">
            <div className="rounded-2xl bg-warm-100/60 p-4">
              <p className="text-sm text-ink-700">
                请确认以下信息无误后提交。提交后信息将进入审核流程，审核通过后将在前台展示。
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              <div className="aspect-square rounded-2xl overflow-hidden bg-warm-100">
                {form.images[0] && <img src={form.images[0]} alt="封面" className="h-full w-full object-cover" />}
              </div>
              <div>
                <h3 className="font-serif text-2xl font-bold">{form.title || '(未填写标题)'}</h3>
                <p className="text-sm text-ink-500 mt-1">
                  {form.breed} · {form.age}{form.ageUnit === 'month' ? '个月' : '岁'} · {GENDERS.find(g => g.v === form.gender)?.label}
                </p>
                <dl className="mt-4 space-y-2 text-sm">
                  <DLRow label="种类" value={CATEGORIES.find(c => c.v === form.category)?.label} />
                  <DLRow label="所在地" value={form.location || '未填写'} />
                  <DLRow label="性格" value={form.personality || '未填写'} />
                  <DLRow label="健康" value={form.health || '未填写'} />
                  <DLRow label="免疫" value={form.vaccination || '未填写'} />
                  <DLRow label="绝育" value={form.sterilized ? '是' : '否'} />
                  <DLRow label="照片" value={`${form.images.length} 张`} />
                </dl>
              </div>
            </div>

            {form.description && (
              <div className="rounded-2xl bg-cream-50 border border-warm-100 p-4">
                <p className="text-xs font-mono uppercase text-ink-500 mb-1">详细描述</p>
                <p className="text-sm text-ink-900 whitespace-pre-wrap">{form.description}</p>
              </div>
            )}
          </div>
        )}

        {/* 底部按钮 */}
        <div className="mt-8 flex items-center justify-between pt-6 border-t border-warm-100">
          <button onClick={prev} disabled={step === 1} className="btn-ghost disabled:opacity-40 disabled:pointer-events-none">
            <ArrowLeft size={14} /> 上一步
          </button>
          {step < 4 ? (
            <button onClick={next} disabled={!canNext()} className="btn-primary">
              下一步 <ArrowRight size={14} />
            </button>
          ) : (
            <button onClick={onSubmit} disabled={submitting} className="btn-primary">
              {submitting ? '提交中...' : '提交审核'} <Check size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function DLRow({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-ink-500">{label}</dt>
      <dd className="text-ink-900 text-right">{value || '—'}</dd>
    </div>
  );
}
