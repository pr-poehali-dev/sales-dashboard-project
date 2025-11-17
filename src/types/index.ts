export type UserRole = 'ADMIN' | 'MANAGER' | 'TECHNOLOGIST' | 'WORKER' | 'USER';

export type OrderStatus = 'DRAFT' | 'ACCEPTED' | 'IN_PROGRESS' | 'QUALITY_CHECK' | 'COMPLETED' | 'SHIPPED';

export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type FileType = 'DRAWING' | 'SPECIFICATION' | 'PHOTO' | 'DOCUMENT';

export type StageStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';

export interface User {
  id: number;
  email: string;
  role: UserRole;
  name: string;
  createdAt: string;
}

export interface Order {
  id: number;
  orderNumber: string;
  clientName: string;
  description?: string;
  status: OrderStatus;
  priority: Priority;
  deadline: string;
  createdAt: string;
  updatedAt: string;
  userId: number;
  user?: User;
  files?: File[];
  stages?: ProductionStage[];
}

export interface File {
  id: number;
  filename: string;
  fileUrl: string;
  fileType: FileType;
  orderId: number;
  createdAt: string;
}

export interface ProductionStage {
  id: number;
  name: string;
  status: StageStatus;
  orderId: number;
  assignedTo?: number;
  assignedUser?: User;
  startDate?: string;
  endDate?: string;
  createdAt: string;
}

export interface OrderHistory {
  id: number;
  orderId: number;
  userId: number;
  user?: User;
  action: string;
  oldValue?: string;
  newValue?: string;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  role?: UserRole;
}

export interface CreateOrderRequest {
  clientName: string;
  description?: string;
  priority: Priority;
  deadline: string;
}

export interface UpdateOrderRequest {
  clientName?: string;
  description?: string;
  status?: OrderStatus;
  priority?: Priority;
  deadline?: string;
}

export interface CreateStageRequest {
  name: string;
  assignedTo?: number;
}

export interface UpdateStageRequest {
  name?: string;
  status?: StageStatus;
  assignedTo?: number;
  startDate?: string;
  endDate?: string;
}

export interface DashboardStats {
  totalOrders: number;
  activeOrders: number;
  completedOrders: number;
  overdueOrders: number;
  ordersByStatus: Record<OrderStatus, number>;
  ordersByPriority: Record<Priority, number>;
}
