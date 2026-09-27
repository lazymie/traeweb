// 前后端共享类型定义

export type UserRole = 'user' | 'org' | 'admin';

export type UserStatus = 'active' | 'disabled';

export interface User {
  id: number;
  username: string;
  nickname: string;
  email: string;
  phone?: string;
  role: UserRole;
  avatar?: string;
  bio?: string;
  status: UserStatus;
  createdAt: string;
}

export type PetCategory = 'dog' | 'cat' | 'other';
export type PetGender = 'male' | 'female' | 'unknown';
export type PetStatus = 'pending' | 'available' | 'adopted' | 'rejected' | 'offline';
export type AgeUnit = 'month' | 'year';

export interface Pet {
  id: number;
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
  publisherId: number;
  status: PetStatus;
  reviewNote?: string;
  viewCount: number;
  favoriteCount: number;
  createdAt: string;
  updatedAt: string;
}

export type AdoptionStatus = 'pending' | 'approved' | 'rejected' | 'completed' | 'cancelled';

export interface Followup {
  id: number;
  adoptionId: number;
  content: string;
  createdAt: string;
}

export interface Adoption {
  id: number;
  petId: number;
  applicantId: number;
  reason: string;
  experience: string;
  contact: string;
  status: AdoptionStatus;
  reviewNote?: string;
  followups: Followup[];
  createdAt: string;
  updatedAt: string;
}

export type AnnouncementStatus = 'published' | 'offline';

export interface Announcement {
  id: number;
  title: string;
  content: string;
  excerpt: string;
  pinned: boolean;
  status: AnnouncementStatus;
  publisherId: number;
  createdAt: string;
}

export interface Comment {
  id: number;
  petId: number;
  userId: number;
  content: string;
  parentId?: number;
  createdAt: string;
}

export interface Favorite {
  id: number;
  userId: number;
  petId: number;
  createdAt: string;
}

// API 通用响应
export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

export interface Pagination<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
}

// 鉴权相关
export interface AuthUser extends User {
  token: string;
}

export interface LoginPayload {
  username: string;
  password: string;
}

export interface RegisterPayload {
  username: string;
  password: string;
  nickname: string;
  email: string;
  phone?: string;
  role?: UserRole;
}

// 宠物筛选查询
export interface PetQuery {
  keyword?: string;
  category?: PetCategory;
  breed?: string;
  gender?: PetGender;
  ageMin?: number;
  ageMax?: number;
  location?: string;
  status?: PetStatus;
  sort?: 'latest' | 'popular';
  page?: number;
  pageSize?: number;
}

// 后台统计数据
export interface AdminStats {
  totalPets: number;
  availablePets: number;
  pendingPets: number;
  adoptedPets: number;
  totalUsers: number;
  totalApplications: number;
  pendingApplications: number;
  completedAdoptions: number;
  adoptionRate: number;
  petsByCategory: { category: string; count: number }[];
  applicationsTrend: { date: string; count: number }[];
}
