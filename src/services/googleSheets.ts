/**
 * Google Sheets через Apps Script Web App
 * 
 * НЕ требует Google Cloud Console или API ключей!
 * Работает через опубликованный Apps Script URL.
 */

const CONFIG_KEY = 'appsScriptConfig';

interface Config {
  scriptUrl: string;
}

function getConfig(): Config {
  const saved = localStorage.getItem(CONFIG_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      return { scriptUrl: '' };
    }
  }
  return { scriptUrl: '' };
}

export function saveConfig(scriptUrl: string): void {
  localStorage.setItem(CONFIG_KEY, JSON.stringify({ scriptUrl }));
}

export function clearConfig(): void {
  localStorage.removeItem(CONFIG_KEY);
}

export function isConnected(): boolean {
  const config = getConfig();
  return !!config.scriptUrl;
}

export function getCurrentConfig(): Config {
  return getConfig();
}

// Проверка подключения
export async function testConnection(): Promise<{ success: boolean; title?: string; sheets?: string[]; error?: string }> {
  const config = getConfig();
  if (!config.scriptUrl) {
    return { success: false, error: 'URL веб-приложения не указан' };
  }

  try {
    const url = `${config.scriptUrl}?action=test`;
    const response = await fetch(url);
    
    if (!response.ok) {
      return { success: false, error: `Ошибка ${response.status}` };
    }

    const data = await response.json();
    
    if (data.error) {
      return { success: false, error: data.error };
    }

    return { 
      success: true, 
      title: data.title,
      sheets: data.sheets
    };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Не удалось подключиться' 
    };
  }
}

// Универсальная функция GET
async function fetchData(action: string): Promise<any[]> {
  const config = getConfig();
  if (!config.scriptUrl) {
    throw new Error('Не настроено подключение');
  }

  const url = `${config.scriptUrl}?action=${action}`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error);
    }
    
    return data;
  } catch (error) {
    console.error(`Ошибка получения ${action}:`, error);
    throw error;
  }
}

// Универсальная функция POST
async function postData(action: string, data: any): Promise<void> {
  const config = getConfig();
  if (!config.scriptUrl) {
    throw new Error('Не настроено подключение');
  }

  try {
    const response = await fetch(config.scriptUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action, data }),
      redirect: 'follow'
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const result = await response.json();
    
    if (result.error) {
      throw new Error(result.error);
    }
  } catch (error) {
    throw error;
  }
}

// ==================== ТИПЫ ====================

export interface Employee {
  id: string;
  personalNumber: string;
  fullName: string;
  password: string;
  status: string;
  position: string;
  hireDate: string;
  blocked: boolean;
  phone: string;
  lastActivity: string;
  note: string;
}

export interface Nomenclature {
  id: string;
  name: string;
  category: string;
  unit: string;
  manufacturer: string;
  active: boolean;
  currentPrice: number;
  packageQuantity: number;
}

export interface Arrival {
  id: string;
  employeeId: string;
  date: string;
  month: string;
  amount: number;
  shifts: number;
  addedBy: string;
  type: string;
  comment: string;
  items?: Array<{ nomenclatureId: string; quantity: number; price: number; total: number }>;
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

export interface ExpenseItem {
  nomenclatureId: string;
  name: string;
  category: string;
  quantity: number;
  pricePerUnit: number;
  total: number;
}

export interface ExpenseSheet {
  id: string;
  employeeId: string;
  employeeName: string;
  patientName: string;
  patientBirthDate: string;
  date: string;
  month: string;
  callCategory: string;
  therapyName: string;
  therapyCost: number;
  items: ExpenseItem[];
  totalAmount: number;
  archived: boolean;
}

export interface ReturnOperation {
  id: string;
  employeeId: string;
  date: string;
  nomenclatureId: string;
  quantity: number;
  status: string;
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
  role: string;
  text: string;
  date: string;
  read: boolean;
  priority: string;
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

// ==================== ФУНКЦИИ ЧТЕНИЯ ====================

export async function getEmployees(): Promise<Employee[]> {
  const data = await fetchData('getEmployees');
  return data.map((row: any) => ({
    id: row['ID'] || '',
    personalNumber: row['Персональный номер'] || '',
    fullName: row['ФИО'] || '',
    password: row['Пароль'] || '',
    status: row['Статус'] || 'Активен',
    position: row['Должность'] || '',
    hireDate: row['Дата найма'] || '',
    blocked: row['Заблокирован'] === 'ДА',
    phone: row['Телефон'] || '',
    lastActivity: row['Последний вход'] || '',
    note: row['Примечание'] || '',
  }));
}

export async function getNomenclature(): Promise<Nomenclature[]> {
  const data = await fetchData('getNomenclature');
  const prices = await fetchData('getPrices');
  
  return data.map((row: any) => {
    const currentPriceRow = prices.find((p: any) => 
      p['Номенклатура_ID'] === row['ID'] && 
      (!p['Дата окончания'] || p['Дата окончания'] === '')
    );
    
    return {
      id: row['ID'] || '',
      name: row['Название'] || '',
      category: row['Категория'] || 'Лекарство',
      unit: row['Ед. измерения'] || 'Штуки',
      manufacturer: row['Производитель'] || '',
      active: row['Актуальна'] === 'ДА',
      currentPrice: parseFloat(currentPriceRow?.['Цена за ед. (₽)'] || '0'),
      packageQuantity: parseInt(row['Количество в упаковке'] || '1'),
    };
  });
}

export async function getArrivals(): Promise<Arrival[]> {
  const data = await fetchData('getArrivals');
  return data.map((row: any) => ({
    id: row['ID'] || '',
    employeeId: row['Сотрудник_ID'] || '',
    date: row['Дата'] || '',
    month: row['Месяц'] || '',
    amount: parseFloat(row['Сумма (₽)'] || '0'),
    shifts: parseInt(row['Количество смен'] || '0'),
    addedBy: row['Кем внесено'] || '',
    type: row['Тип'] || 'Плановый',
    comment: row['Комментарий'] || '',
    items: row.items || [],
  }));
}

export async function getExpenses(): Promise<Expense[]> {
  const data = await fetchData('getExpenses');
  return data.map((row: any) => ({
    id: row['ID'] || '',
    employeeId: row['Сотрудник_ID'] || '',
    date: row['Дата внесения'] || '',
    callDate: row['Дата вызова'] || '',
    month: row['Месяц'] || '',
    nomenclatureId: row['Номенклатура_ID'] || '',
    quantity: parseInt(row['Количество'] || '0'),
    patientName: row['Пациент ФИО'] || '',
    patientBirthDate: row['Пациент ДР'] || '',
    callId: row['Вызов_ID'] || '',
  }));
}

export async function getReturns(): Promise<ReturnOperation[]> {
  const data = await fetchData('getReturns');
  return data.map((row: any) => ({
    id: row['ID'] || '',
    employeeId: row['Сотрудник_ID'] || '',
    date: row['Дата создания'] || '',
    nomenclatureId: row['Номенклатура_ID'] || '',
    quantity: parseInt(row['Количество'] || '0'),
    status: row['Статус'] || 'Новый',
    correctedBy: row['Кем скорректировано'] || '',
    correctedQuantity: row['Скорректированное кол-во'] ? parseInt(row['Скорректированное кол-во']) : null,
    comment: row['Комментарий'] || '',
    reason: row['Причина'] || '',
  }));
}

export async function getChatMessages(): Promise<ChatMessage[]> {
  const data = await fetchData('getChat');
  return data.map((row: any) => ({
    id: row['ID'] || '',
    fromId: row['От кого (ID)'] || '',
    fromName: row['От кого (ФИО)'] || '',
    toId: row['Кому (ID)'] || '',
    toName: row['Кому (ФИО)'] || '',
    role: row['Роль'] || 'Сотрудник',
    text: row['Текст'] || '',
    date: row['Дата и время'] || '',
    read: row['Прочитано'] === 'ДА',
    priority: row['Приоритет'] || 'Обычное',
  }));
}

export async function getAuditLog(): Promise<AuditEntry[]> {
  const data = await fetchData('getAuditLog');
  return data.map((row: any) => ({
    id: row['ID'] || '',
    date: row['Дата и время'] || '',
    userId: row['Пользователь ID'] || '',
    userName: row['Пользователь ФИО'] || '',
    role: row['Роль'] || '',
    sheet: row['Лист'] || '',
    recordId: row['Запись_ID'] || '',
    action: row['Действие'] || '',
    field: row['Поле'] || '',
    oldValue: row['Было'] || '',
    newValue: row['Стало'] || '',
  }));
}

// ==================== ФУНКЦИИ ЗАПИСИ ====================

export async function addEmployee(employee: Partial<Employee>): Promise<void> {
  await postData('addEmployee', employee);
}

export async function updateEmployee(id: string, data: Partial<Employee>): Promise<void> {
  await postData('updateEmployee', { id, data });
}

export async function deleteEmployee(id: string): Promise<void> {
  await postData('deleteEmployee', { id });
}

export async function addArrival(arrival: Partial<Arrival>): Promise<void> {
  await postData('addArrival', arrival);
}

export async function updateArrival(id: string, data: Partial<Arrival>): Promise<void> {
  await postData('updateArrival', { id, data });
}

export async function deleteArrival(id: string): Promise<void> {
  await postData('deleteArrival', { id });
}

export async function getExpenseSheets(): Promise<ExpenseSheet[]> {
  const data = await fetchData('getExpenseSheets');
  return data.map((row: any) => ({
    id: row['ID'] || '',
    employeeId: row['Сотрудник_ID'] || '',
    employeeName: row['Сотрудник'] || '',
    patientName: row['Пациент'] || '',
    patientBirthDate: row['Дата рождения пациента'] || '',
    date: row['Дата'] || '',
    month: row['Месяц'] || '',
    callCategory: row['Категория выезда'] || '',
    therapyName: row['Название терапии'] || '',
    therapyCost: parseFloat(row['Стоимость терапии'] || '0'),
    items: row.items || [],
    totalAmount: parseFloat(row['Итого по препаратам'] || '0'),
    archived: row['Архив'] === 'ДА',
  }));
}

export async function addExpenseSheet(sheet: Partial<ExpenseSheet>): Promise<void> {
  await postData('addExpenseSheet', sheet);
}

export async function updateExpenseSheet(id: string, data: Partial<ExpenseSheet>): Promise<void> {
  await postData('updateExpenseSheet', { id, data });
}

export async function archiveExpenseSheet(id: string): Promise<void> {
  await postData('archiveExpenseSheet', { id });
}

export async function createTestExpenseSheets(): Promise<void> {
  const now = new Date();
  const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const monthStr = `${previousMonth.getFullYear()}-${String(previousMonth.getMonth() + 1).padStart(2, '0')}`;
  
  const testSheets: Partial<ExpenseSheet>[] = [
    {
      id: `EXP-TEST-${Date.now()}-1`,
      employeeId: 'EMP-001',
      employeeName: 'Иванов Иван Иванович',
      patientName: 'Петров Пётр Петрович',
      patientBirthDate: '1980-05-15',
      date: `${previousMonth.getFullYear()}-${String(previousMonth.getMonth() + 1).padStart(2, '0')}-10`,
      month: monthStr,
      callCategory: 'Первичный',
      therapyName: 'Детоксикация',
      therapyCost: 5000,
      items: [
        { nomenclatureId: 'NOM-001', name: 'Налоксон', category: 'ЛС ПКУ', quantity: 2, pricePerUnit: 150, total: 300 },
        { nomenclatureId: 'NOM-002', name: 'Физраствор', category: 'Расходный материал', quantity: 1, pricePerUnit: 50, total: 50 }
      ],
      totalAmount: 350,
      archived: false
    },
    {
      id: `EXP-TEST-${Date.now()}-2`,
      employeeId: 'EMP-002',
      employeeName: 'Сидорова Мария Ивановна',
      patientName: 'Кузнецов Алексей Сергеевич',
      patientBirthDate: '1975-08-22',
      date: `${previousMonth.getFullYear()}-${String(previousMonth.getMonth() + 1).padStart(2, '0')}-15`,
      month: monthStr,
      callCategory: 'Повторный',
      therapyName: 'Кодирование',
      therapyCost: 8000,
      items: [
        { nomenclatureId: 'NOM-003', name: 'Дисульфирам', category: 'ЛС', quantity: 1, pricePerUnit: 450, total: 450 },
        { nomenclatureId: 'NOM-004', name: 'Шприцы', category: 'Расходный материал', quantity: 5, pricePerUnit: 20, total: 100 }
      ],
      totalAmount: 550,
      archived: false
    },
    {
      id: `EXP-TEST-${Date.now()}-3`,
      employeeId: 'EMP-003',
      employeeName: 'Козлов Дмитрий Александрович',
      patientName: 'Смирнова Елена Владимировна',
      patientBirthDate: '1990-12-03',
      date: `${previousMonth.getFullYear()}-${String(previousMonth.getMonth() + 1).padStart(2, '0')}-20`,
      month: monthStr,
      callCategory: 'Курс',
      therapyName: 'Реабилитация',
      therapyCost: 15000,
      items: [
        { nomenclatureId: 'NOM-005', name: 'Налтрексон', category: 'ЛС', quantity: 1, pricePerUnit: 1200, total: 1200 },
        { nomenclatureId: 'NOM-006', name: 'Витамины', category: 'ЛС', quantity: 1, pricePerUnit: 300, total: 300 },
        { nomenclatureId: 'NOM-007', name: 'Капельницы', category: 'Оборудование', quantity: 3, pricePerUnit: 150, total: 450 }
      ],
      totalAmount: 1950,
      archived: false
    }
  ];

  await postData('createTestExpenseSheets', testSheets);
}

export async function addExpense(expense: Partial<Expense>): Promise<void> {
  await postData('addExpense', expense);
}

export async function addReturn(returnOp: Partial<ReturnOperation>): Promise<void> {
  await postData('addReturn', returnOp);
}

export async function addChatMessage(message: Partial<ChatMessage>): Promise<void> {
  await postData('addChatMessage', message);
}

export async function addAuditLog(log: Partial<AuditEntry>): Promise<void> {
  await postData('addAuditLog', log);
}

export async function updateNomenclature(id: string, data: any): Promise<void> {
  await postData('updateNomenclature', { id, ...data });
}

export async function addNomenclature(item: Partial<Nomenclature>): Promise<void> {
  await postData('addNomenclature', item);
}

export async function deleteNomenclature(id: string): Promise<void> {
  await postData('deleteNomenclature', { id });
}
