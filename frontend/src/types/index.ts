// User Types
export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  userType: UserType;
  profileImage?: string;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export enum UserType {
  CLIENT = 'CLIENT',
  PROVIDER = 'PROVIDER'
}

export interface AuthRequest {
  email: string;
  password: string;
  userType: UserType;
}

export interface AuthResponse {
  success: boolean;
  user?: User;
  token?: string;
  message?: string;
}

// Service Types
export interface Service {
  id: string;
  clientId: string;
  providerId?: string;
  category: ServiceCategory;
  location: Location;
  destination?: Location;
  price: number;
  distance: number;
  estimatedTime: number;
  status: ServiceStatus;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  rating?: number;
  review?: string;
}

export interface ServiceCategory {
  id: string;
  name: string;
  displayName: string;
  description: string;
  icon: string;
  basePrice: number;
  isActive: boolean;
}

export enum ServiceStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

// Location Types
export interface Location {
  latitude: number;
  longitude: number;
  address: string;
  city?: string;
  state?: string;
  country?: string;
}

// Route Types
export interface Route {
  id: string;
  origin: Location;
  destination: Location;
  distance: number;
  duration: number;
  polyline: string;
  steps: RouteStep[];
  createdAt: Date;
}

export interface RouteStep {
  id: string;
  instruction: string;
  distance: number;
  duration: number;
  location: Location;
  maneuver?: string;
}

export interface RouteUpdate {
  vehicleLocation: VehicleLocation;
  remainingDistance: number;
  estimatedArrival: number;
  nextInstruction: RouteInstruction;
}

export interface RouteInstruction {
  instruction: string;
  distance: number;
  duration: number;
  location: Location;
}

// Vehicle Types
export interface VehicleLocation {
  vehicleId: string;
  location: Location;
  speed: number;
  heading: number;
  timestamp: number;
  status: VehicleStatus;
}

export enum VehicleStatus {
  APPROACHING = 'APPROACHING',
  EN_ROUTE = 'EN_ROUTE',
  ARRIVED = 'ARRIVED'
}

export interface DriverInfo {
  id: string;
  name: string;
  phone: string;
  vehicleModel: string;
  vehiclePlate: string;
  rating: number;
  photo?: string;
}

// Payment Types
export interface PaymentMethod {
  id: string;
  type: PaymentMethodType;
  name: string;
  description: string;
  icon: string;
  isDefault: boolean;
  isActive: boolean;
}

export enum PaymentMethodType {
  PIX = 'PIX',
  CREDIT_CARD = 'CREDIT_CARD',
  DEBIT_CARD = 'DEBIT_CARD',
  CASH = 'CASH'
}

export interface Payment {
  id: string;
  serviceId: string;
  amount: number;
  paymentMethodId: string;
  status: PaymentStatus;
  transactionId?: string;
  createdAt: Date;
  completedAt?: Date;
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED'
}

// Rating Types
export interface ServiceRating {
  id: string;
  serviceId: string;
  clientId: string;
  providerId: string;
  rating: number;
  comment?: string;
  categories: RatingCategory[];
  createdAt: Date;
  isCompleted: boolean;
}

export interface RatingCategory {
  id: string;
  name: string;
  description: string;
  isPositive: boolean;
}

export interface RatingRequest {
  serviceId: string;
  rating: number;
  comment?: string;
  categoryIds: string[];
}

export interface RatingResponse {
  ratingId: string;
  success: boolean;
  message: string;
}

// Chat Types
export interface ChatMessage {
  id: string;
  serviceId: string;
  senderId: string;
  receiverId: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
  messageType: MessageType;
}

export enum MessageType {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  LOCATION = 'LOCATION'
}

// Provider Types
export interface ServiceProviderProfile {
  id: string;
  userId: string;
  vehicleInfo: VehicleInfo;
  workingHours: WorkingHours;
  earnings: ProviderEarnings;
  rating: number;
  totalServices: number;
  isOnline: boolean;
  isAvailable: boolean;
}

export interface VehicleInfo {
  model: string;
  year: number;
  plate: string;
  color: string;
  capacity: number;
}

export interface WorkingHours {
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
}

export interface DaySchedule {
  isWorking: boolean;
  startTime?: string;
  endTime?: string;
}

export interface ProviderEarnings {
  today: number;
  thisWeek: number;
  thisMonth: number;
  total: number;
}

// UI State Types
export interface LoadingState {
  isLoading: boolean;
  message?: string;
}

export interface ErrorState {
  hasError: boolean;
  message?: string;
  code?: string;
}

// Navigation Types
export type RootStackParamList = {
  Splash: undefined;
  Auth: undefined;
  ClientHome: undefined;
  ProviderHome: undefined;
  ClientTracking: { service: Service };
  ProviderTracking: { service: Service };
  Payment: { service: Service };
  Rating: { service: Service };
  Profile: undefined;
  Chat: { service: Service };
};
