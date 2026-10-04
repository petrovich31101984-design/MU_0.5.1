export type EmployeeStatus = 'Активен' | 'Неактивен' | 'Отпуск' | 'Уволен';
export type NomenclatureCategory = 'ЛС ПКУ' | 'ЛС' | 'Оборудование' | 'Расходный материал';
export type Unit = 'Ампулы' | 'Таблетки' | 'Флаконы' | 'Штуки' | 'Упаковки';
export type ReturnStatus = 'Новый' | 'Принят' | 'Отклонён' | 'Скорректирован';
export type ChatRole = 'Руководитель' | 'Кладовщик' | 'Сотрудник';

export interface Employee {
  id: string;
  personalNumber: string;
  fullName: string;
  status: EmployeeStatus;
  position: string;
  hireDate: string;
  blocked: boolean;
  phone: string;
  lastActivity: string;
  note: string;
}

export interface NomenclatureItem {
  id: string;
  name: string;
  category: NomenclatureCategory;
  unit: Unit;
  manufacturer: string;
  active: boolean;
  currentPrice: number;
}

export interface Arrival {
  id: string;
  employeeId: string;
  date: string;
  month: string;
  amount: number;
  shifts: number;
  addedBy: string;
  type: 'Плановый' | 'Дополнительный';
  comment: string;
}

export interface Expense {
  id: string;
  employeeId: string;
  date: string;
  callDate: string;
  month: string;
  nomenclatureId: string;
  quantity: number;
  patientName: string;
  patientBirthDate: string;
  callId: string;
}

export interface ReturnOperation {
  id: string;
  employeeId: string;
  date: string;
  nomenclatureId: string;
  quantity: number;
  status: ReturnStatus;
  correctedBy: string;
  correctedQuantity: number | null;
  comment: string;
  reason: string;
}

export interface ChatMessage {
  id: string;
  fromId: string;
  fromName: string;
  toId: string;
  toName: string;
  role: ChatRole;
  text: string;
  date: string;
  read: boolean;
  priority: 'Обычное' | 'Важное';
}

export interface AuditEntry {
  id: string;
  date: string;
  userId: string;
  userName: string;
  role: string;
  sheet: string;
  recordId: string;
  action: string;
  field: string;
  oldValue: string;
  newValue: string;
}

export interface Notification {
  id: string;
  type: 'overconsumption' | 'inactive' | 'return' | 'message' | 'report';
  title: string;
  message: string;
  date: string;
  read: boolean;
  employeeId?: string;
}

export interface StockItem {
  nomenclatureId: string;
  name: string;
  unit: Unit;
  quantity: number;
  pricePerUnit: number;
  totalValue: number;
}

export interface EmployeeStock {
  employeeId: string;
  items: StockItem[];
  totalValue: number;
}

export interface MonthlyReport {
  employeeId: string;
  fullName: string;
  callsCount: number;
  arrival: number;
  expense: number;
  balance: number;
}
