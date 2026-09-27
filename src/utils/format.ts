// 前端格式化工具
export function formatDate(input: string | Date | undefined): string {
  if (!input) return '';
  const d = typeof input === 'string' ? new Date(input) : input;
  if (isNaN(d.getTime())) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function formatDateTime(input: string | Date | undefined): string {
  if (!input) return '';
  const d = typeof input === 'string' ? new Date(input.replace(' ', 'T')) : input;
  if (isNaN(d.getTime())) return String(input);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const h = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${day} ${h}:${min}`;
}

export function relativeTime(input: string | Date | undefined): string {
  if (!input) return '';
  const d = typeof input === 'string' ? new Date(input.replace(' ', 'T')) : input;
  if (isNaN(d.getTime())) return '';
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return '刚刚';
  if (diff < 3600) return `${Math.floor(diff / 60)} 分钟前`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} 小时前`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)} 天前`;
  return formatDate(d);
}

export function formatAge(age: number, unit: 'month' | 'year' | string | undefined): string {
  if (!age && age !== 0) return '未知';
  const u = unit || 'year';
  if (u === 'month') {
    if (age < 12) return `${age} 个月`;
    const y = Math.floor(age / 12);
    const m = age % 12;
    return m ? `${y} 岁 ${m} 个月` : `${y} 岁`;
  }
  return `${age} 岁`;
}

export const CATEGORY_LABELS: Record<string, string> = {
  dog: '狗狗',
  cat: '猫咪',
  other: '其他',
};

export const GENDER_LABELS: Record<string, string> = {
  male: '男孩',
  female: '女孩',
  unknown: '未知',
};

export const PET_STATUS_LABELS: Record<string, string> = {
  pending: '待审核',
  available: '可领养',
  adopted: '已领养',
  rejected: '已驳回',
  offline: '已下架',
};

export const ADOPTION_STATUS_LABELS: Record<string, string> = {
  pending: '审核中',
  approved: '已通过',
  rejected: '已驳回',
  completed: '已完成',
  cancelled: '已取消',
};

export const ROLE_LABELS: Record<string, string> = {
  user: '领养者',
  org: '救助机构',
  admin: '管理员',
};
