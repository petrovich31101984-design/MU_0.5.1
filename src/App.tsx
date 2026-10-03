import { useState, useEffect, useCallback, Component, type ReactNode } from 'react';
import * as gs from './services/googleSheets';

// Error Boundary для предотвращения белой страницы
export class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  
  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Ошибка приложения:', error, errorInfo);
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-white flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-8 border border-red-200 shadow-lg max-w-lg w-full">
            <div className="text-center">
              <div className="text-5xl mb-4">⚠️</div>
              <h2 className="text-xl font-bold text-slate-800 mb-2">Произошла ошибка</h2>
              <p className="text-red-600 text-sm mb-4">{this.state.error?.message}</p>
              <button 
                onClick={() => { this.setState({ hasError: false, error: null }); window.location.reload(); }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-white font-medium"
              >
                🔄 Перезагрузить страницу
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// Проверка подключения
const isConfigured = gs.isConnected();

// Logo URL - из репозитория
const LOGO_URL = 'https://raw.githubusercontent.com/petrovich31101984-design/MU_0.5.1/recover-medication-accounting-app-d0ce1/public/logo.png';

// ============ ХУК ДЛЯ РАБОТЫ С ДАННЫМИ ============
function useData() {
  const [employees, setEmployees] = useState<gs.Employee[]>([]);
  const [nomenclature, setNomenclature] = useState<gs.Nomenclature[]>([]);
  const [arrivals, setArrivals] = useState<gs.Arrival[]>([]);
  const [expenses, setExpenses] = useState<gs.Expense[]>([]);
  const [returns, setReturns] = useState<gs.ReturnOperation[]>([]);
  const [chatMessages, setChatMessages] = useState<gs.ChatMessage[]>([]);
  const [auditLog, setAuditLog] = useState<gs.AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [emps, noms, arrs, exps, rets, msgs, logs] = await Promise.all([
        gs.getEmployees(), gs.getNomenclature(), gs.getArrivals(),
        gs.getExpenses(), gs.getReturns(), gs.getChatMessages(), gs.getAuditLog(),
      ]);
      setEmployees(emps); setNomenclature(noms); setArrivals(arrs);
      setExpenses(exps); setReturns(rets); setChatMessages(msgs); setAuditLog(logs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return {
    employees, setEmployees, nomenclature, setNomenclature,
    arrivals, setArrivals, expenses, setExpenses,
    returns, setReturns, chatMessages, setChatMessages,
    auditLog, setAuditLog, loading, error, refresh,
  };
}

type Page = 'dashboard' | 'employees' | 'nomenclature' | 'operations' | 'stock' | 'chat' | 'reports' | 'audit' | 'settings';

// ============ СТРАНИЦА НАСТРОЙКИ ============
function SetupPage() {
  const [scriptUrl, setScriptUrl] = useState('');
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleConnect = async () => {
    setTesting(true); setResult(null);
    gs.saveConfig(scriptUrl);
    const testResult = await gs.testConnection();
    if (testResult.success) {
      setResult({ success: true, message: `✓ Подключено! Таблица: ${testResult.title}` });
      setTimeout(() => window.location.reload(), 1500);
    } else {
      setResult({ success: false, message: `✗ Ошибка: ${testResult.error}` });
    }
    setTesting(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="absolute inset-0 bg-red-500/10 blur-3xl rounded-full"></div>
            <img src={LOGO_URL} alt="АлкоСпас" className="relative w-56 h-56 object-contain drop-shadow-xl" />
          </div>
        </div>
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">
            <span className="bg-gradient-to-r from-red-500 to-red-700 bg-clip-text text-transparent">АлкоСпас</span>
          </h1>
          <p className="text-lg text-slate-700 mb-1">Система медицинского учета</p>
          <p className="text-sm text-slate-500">Выездное подразделение медицинской помощи</p>
        </div>

        <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-xl space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-slate-800 mb-3 flex items-center gap-2">
              <span className="w-7 h-7 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm">1</span>
              Создайте Google таблицу
            </h3>
            <div className="bg-slate-50 rounded-lg p-4 text-sm text-slate-700 space-y-2 border border-slate-200">
              <p>1. Перейдите в <a href="https://sheets.google.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Google Sheets</a></p>
              <p>2. Создайте новую таблицу</p>
              <p>3. Откройте <strong>Расширения → Apps Script</strong></p>
              <p>4. Вставьте код из <code className="bg-slate-200 px-2 py-0.5 rounded text-slate-800">public/google-apps-script-webapp.js</code></p>
              <p>5. Выполните функцию <code className="bg-slate-200 px-2 py-0.5 rounded text-slate-800">setupDatabase()</code></p>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-800 mb-3 flex items-center gap-2">
              <span className="w-7 h-7 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm">2</span>
              Разверните как веб-приложение
            </h3>
            <div className="bg-slate-50 rounded-lg p-4 text-sm text-slate-700 space-y-2 border border-slate-200">
              <p>1. В Apps Script нажмите <strong>Развернуть → Новое развертывание</strong></p>
              <p>2. Тип: <strong>Веб-приложение</strong></p>
              <p>3. Выполнять от имени: <strong>Меня</strong></p>
              <p>4. Доступ: <strong>Все</strong></p>
              <p>5. Нажмите <strong>Развернуть</strong> и скопируйте URL</p>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-800 mb-3 flex items-center gap-2">
              <span className="w-7 h-7 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm">3</span>
              Вставьте URL
            </h3>
            <div className="bg-slate-50 rounded-lg p-4 text-sm text-slate-700 border border-slate-200">
              <p>Скопированный URL вставьте в поле ниже и нажмите "Подключиться"</p>
            </div>
          </div>

          <div className="border-t border-slate-200 pt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">URL веб-приложения Apps Script</label>
              <input type="text" value={scriptUrl} onChange={(e) => setScriptUrl(e.target.value)}
                placeholder="https://script.google.com/macros/s/AKfycbx..."
                className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
            </div>
            {result && (
              <div className={`p-4 rounded-lg ${result.success ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
                {result.message}
              </div>
            )}
            <button onClick={handleConnect} disabled={testing || !scriptUrl}
              className="w-full px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 disabled:from-slate-300 disabled:to-slate-300 disabled:text-slate-500 rounded-lg text-white font-medium transition-all shadow-lg shadow-red-600/20 disabled:shadow-none">
              {testing ? <span className="flex items-center justify-center gap-2"><span className="animate-spin">⏳</span>Проверка...</span> : <span className="flex items-center justify-center gap-2">🔌 Подключиться</span>}
            </button>
          </div>
        </div>
        <div className="mt-8 text-center">
          <p className="text-xs text-slate-500">© {new Date().getFullYear()} АлкоСпас • Выездная наркологическая помощь</p>
        </div>
      </div>
    </div>
  );
}

// ============ ГЛАВНОЕ ПРИЛОЖЕНИЕ ============
export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const data = useData();

  if (!isConfigured) return <SetupPage />;

  if (data.loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <img src={LOGO_URL} alt="АлкоСпас" className="w-48 h-48 object-contain mx-auto mb-6 animate-pulse" />
          <div className="text-slate-800 text-xl font-semibold mb-2">Загрузка данных...</div>
          <div className="text-slate-500 text-sm">Подключение к Google Sheets</div>
          <div className="mt-6 flex justify-center gap-1.5">
            <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-3 h-3 bg-red-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
      </div>
    );
  }

  if (data.error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 border border-red-200 shadow-lg max-w-lg w-full">
          <img src={LOGO_URL} alt="АлкоСпас" className="w-32 h-32 object-contain mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-800 text-center mb-2">Ошибка подключения</h2>
          <p className="text-red-600 text-sm text-center mb-4">{data.error}</p>
          <div className="bg-slate-50 rounded-lg p-4 mb-4 border border-slate-200">
            <p className="text-sm text-slate-600 mb-2 font-medium">Проверьте:</p>
            <ul className="text-sm text-slate-700 space-y-1 list-disc list-inside">
              <li>URL веб-приложения Apps Script</li>
              <li>Доступ к таблице (публичный)</li>
              <li>Структуру таблицы (должны быть все листы)</li>
              <li>Интернет-соединение</li>
            </ul>
          </div>
          <button onClick={() => data.refresh()} className="w-full px-4 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 rounded-lg text-white font-medium shadow-lg shadow-red-600/20">🔄 Повторить попытку</button>
        </div>
      </div>
    );
  }

  const menuItems: { id: Page; label: string; icon: string }[] = [
    { id: 'dashboard', label: 'Панель руководителя', icon: '👨‍⚕️' },
    { id: 'employees', label: 'Сотрудники', icon: '👥' },
    { id: 'nomenclature', label: 'Номенклатура', icon: '💊' },
    { id: 'operations', label: 'Операции', icon: '📋' },
    { id: 'stock', label: 'Остатки', icon: '📦' },
    { id: 'chat', label: 'Сообщения', icon: '💬' },
    { id: 'reports', label: 'Отчёты', icon: '📈' },
    { id: 'audit', label: 'Журнал', icon: '📝' },
    { id: 'settings', label: 'Настройки', icon: '⚙️' },
  ];

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <Dashboard data={data} />;
      case 'employees': return <EmployeesPage data={data} />;
      case 'nomenclature': return <NomenclaturePage data={data} />;
      case 'operations': return <OperationsPage data={data} />;
      case 'stock': return <StockPage data={data} />;
      case 'chat': return <ChatPage data={data} />;
      case 'reports': return <ReportsPage data={data} />;
      case 'audit': return <AuditPage data={data} />;
      case 'settings': return <SettingsPage data={data} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-80' : 'w-20'} bg-white border-r border-slate-200 flex flex-col transition-all duration-300 fixed h-full z-40 shadow-sm`}>
        <div className="p-4 border-b border-slate-200 flex items-center gap-3">
          <img src={LOGO_URL} alt="АлкоСпас" className="w-10 h-10 rounded-lg object-contain shrink-0" />
          {sidebarOpen && (
            <div className="overflow-hidden">
              <h1 className="text-sm font-bold text-slate-800 whitespace-nowrap">АлкоСпас</h1>
              <p className="text-xs text-slate-500 leading-tight">Система медицинского учета</p>
              <p className="text-xs text-emerald-600 font-semibold">(v. 0.5)</p>
            </div>
          )}
        </div>
        <nav className="flex-1 py-4 overflow-y-auto">
          {menuItems.map(item => (
            <button key={item.id} onClick={() => setCurrentPage(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all ${
                currentPage === item.id
                  ? 'bg-blue-50 text-blue-700 border-r-4 border-blue-500'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}>
              <span className="text-xl shrink-0">{item.icon}</span>
              {sidebarOpen && <span className="text-sm font-medium whitespace-nowrap">{item.label}</span>}
            </button>
          ))}
        </nav>
        {sidebarOpen && (
          <div className="p-4 border-t border-slate-200">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
              <span className="text-xs text-slate-500">Подключено к Google Sheets</span>
            </div>
          </div>
        )}
      </aside>

      {/* Main */}
      <div className={`flex-1 ${sidebarOpen ? 'ml-80' : 'ml-20'} transition-all duration-300`}>
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-30 shadow-sm">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 rounded-lg hover:bg-slate-100 text-slate-600">
              {sidebarOpen ? '◀' : '▶'}
            </button>
            <h2 className="text-lg font-semibold text-slate-800">
              {menuItems.find(m => m.id === currentPage)?.label}
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => data.refresh()} className="p-2 rounded-lg hover:bg-slate-100 text-slate-600" title="Обновить данные">🔄</button>
            <div className="text-sm text-slate-500 hidden md:block">
              {new Date().toLocaleDateString('ru-RU', { weekday: 'short', day: 'numeric', month: 'short' })}
            </div>
          </div>
        </header>
        <main className="p-6">{renderPage()}</main>
      </div>
    </div>
  );
}

// ============ DASHBOARD ============
function Dashboard({ data }: { data: ReturnType<typeof useData> }) {
  const { employees, nomenclature, arrivals, expenses, returns } = data;
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  
  // Предыдущий месяц
  const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonth = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, '0')}`;
  
  // Названия месяцев
  const monthNames = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
  const lastMonthName = monthNames[lastMonthDate.getMonth()];
  const currentMonthName = monthNames[now.getMonth()];
  
  const activeEmployees = employees.filter(e => e.status === 'Активен');

  // Расчеты за предыдущий месяц
  const getArrival = (empId: string, month: string) => arrivals.filter(a => a.employeeId === empId && a.month === month).reduce((s, a) => s + a.amount, 0);
  const getExpenseValue = (empId: string, month: string) => expenses.filter(e => e.employeeId === empId && e.month === month).reduce((s, e) => {
    const nom = nomenclature.find(n => n.id === e.nomenclatureId);
    return s + (nom ? nom.currentPrice * e.quantity : 0);
  }, 0);
  const getExpenseCount = (empId: string, month: string) => expenses.filter(e => e.employeeId === empId && e.month === month).length;

  const totalArrivalLastMonth = activeEmployees.reduce((s, e) => s + getArrival(e.id, lastMonth), 0);
  const totalExpenseLastMonth = activeEmployees.reduce((s, e) => s + getExpenseValue(e.id, lastMonth), 0);
  const totalExpenseCountLastMonth = activeEmployees.reduce((s, e) => s + getExpenseCount(e.id, lastMonth), 0);
  
  // Остаток на начало текущего месяца = Приход за прошлый месяц - Расход за прошлый месяц
  const balanceStartCurrentMonth = totalArrivalLastMonth - totalExpenseLastMonth;
  
  const pendingReturns = returns.filter(r => r.status === 'Новый').length;

  // Состояния для уведомлений и сообщений
  const [notifications, setNotifications] = useState<Array<{ id: number; text: string; time: string; type: string }>>([]);
  const [messages, setMessages] = useState<Array<{ id: number; from: string; text: string; time: string }>>([]);

  const handleNotificationClick = (id: number) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  const handleMessageClick = (id: number) => {
    setMessages(messages.filter(m => m.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Приход за предыдущий месяц */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm border-l-4 border-l-emerald-500">
          <div className="text-sm italic text-slate-600 mb-2">Приход<br />(за предыдущий месяц)</div>
          <div className="text-2xl font-bold text-emerald-600 mb-1">{totalArrivalLastMonth.toLocaleString('ru-RU')} ₽</div>
          <div className="text-xs text-slate-500">
            {lastMonthDate.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })}
          </div>
        </div>
        {/* Расход за предыдущий месяц */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm border-l-4 border-l-red-500">
          <div className="text-sm italic text-slate-600 mb-2">Расход<br />(за предыдущий месяц)</div>
          <div className="text-2xl font-bold text-red-600 mb-1">{totalExpenseLastMonth.toLocaleString('ru-RU')} ₽</div>
          <div className="text-xs text-slate-500">
            {lastMonthDate.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })}
          </div>
        </div>
        {/* Остаток на начало текущего месяца */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm border-l-4 border-l-blue-500">
          <div className="text-sm italic text-slate-600 mb-2">Остаток<br />(на начало текущего месяца)</div>
          <div className="text-2xl font-bold text-blue-600 mb-1">{balanceStartCurrentMonth.toLocaleString('ru-RU')} ₽</div>
          <div className="text-xs text-slate-500">
            {now.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })}
          </div>
        </div>
        {/* Листов расхода за предыдущий месяц */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm border-l-4 border-l-orange-500">
          <div className="text-sm italic text-slate-600 mb-2">Листов расхода<br />(за предыдущий месяц)</div>
          <div className="text-2xl font-bold text-orange-600 mb-1">{totalExpenseCountLastMonth}</div>
          <div className="text-xs text-slate-500">
            {lastMonthDate.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })}
          </div>
        </div>
      </div>

      {/* Блоки уведомлений и сообщений */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Блок уведомлений */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm h-96 flex flex-col">
          <div className="p-5 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-800">🔔 Уведомления</h3>
            <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-semibold">
              {notifications.length}
            </span>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {notifications.length === 0 ? (
              <div className="text-center text-slate-400 mt-8">
                <div className="text-3xl mb-2">🔕</div>
                <p>Нет новых уведомлений</p>
              </div>
            ) : (
              notifications.map(notif => (
                <div
                  key={notif.id}
                  className={`p-4 rounded-lg border ${
                    notif.type === 'warning' ? 'bg-yellow-50 border-yellow-200' :
                    notif.type === 'alert' ? 'bg-red-50 border-red-200' :
                    'bg-blue-50 border-blue-200'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <p className="text-sm text-slate-800 font-medium">{notif.text}</p>
                      <p className="text-xs text-slate-500 mt-1">{notif.time}</p>
                    </div>
                    <span 
                      onClick={() => handleNotificationClick(notif.id)}
                      className="text-red-500 text-lg cursor-pointer hover:text-red-700 transition-colors"
                    >×</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Блок сообщений */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm h-96 flex flex-col">
          <div className="p-5 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-800">💬 Сообщения</h3>
            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
              {messages.length}
            </span>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 ? (
              <div className="text-center text-slate-400 mt-8">
                <div className="text-3xl mb-2">📭</div>
                <p>Нет новых сообщений</p>
              </div>
            ) : (
              messages.map(msg => (
                <div
                  key={msg.id}
                  className="p-4 rounded-lg border border-slate-200 bg-slate-50"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0">
                      {(msg.from || '').split(' ').map(n => n[0]).join('')}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-slate-800">{msg.from}</p>
                      <p className="text-sm text-slate-600 mt-1">{msg.text}</p>
                      <p className="text-xs text-slate-500 mt-1">{msg.time}</p>
                    </div>
                    <span 
                      onClick={() => handleMessageClick(msg.id)}
                      className="text-red-500 text-lg cursor-pointer hover:text-red-700 transition-colors"
                    >×</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {pendingReturns > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-center gap-3">
          <span className="text-2xl">↩️</span>
          <div className="flex-1">
            <span className="text-orange-700 font-semibold">Ожидают обработки возвратов:</span>
            <span className="text-orange-600 ml-2">{pendingReturns}</span>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-800">Сотрудники — общая сводка</h3>
          <div className="text-sm text-slate-600">
            Активных сотрудников: <span className="font-semibold text-emerald-600">{activeEmployees.length}</span>
          </div>
        </div>
        <div className="overflow-x-auto" style={{ maxHeight: '400px' }}>
          <table className="w-full">
            <thead className="sticky top-0 bg-slate-50 z-10">
              <tr className="border-b border-slate-200 text-left bg-slate-50">
                <th className="px-5 py-3 text-xs font-medium text-slate-600 uppercase">Сотрудник</th>
                <th className="px-5 py-3 text-xs font-medium text-slate-600 uppercase">Статус</th>
                <th className="px-5 py-3 text-xs font-medium text-slate-600 uppercase text-right">Приход</th>
                <th className="px-5 py-3 text-xs font-medium text-slate-600 uppercase text-right">Расход</th>
                <th className="px-5 py-3 text-xs font-medium text-slate-600 uppercase text-right">Остаток</th>
                <th className="px-5 py-3 text-xs font-medium text-slate-600 uppercase text-right">Листов расхода</th>
              </tr>
            </thead>
            <tbody>
              {employees
                .filter(e => e.status !== 'Уволен')
                .sort((a, b) => {
                  if (a.status === 'Активен' && b.status !== 'Активен') return -1;
                  if (a.status !== 'Активен' && b.status === 'Активен') return 1;
                  return 0;
                })
                .slice(0, 5)
                .map(emp => {
                  const arr = getArrival(emp.id, lastMonth);
                  const exp = getExpenseValue(emp.id, lastMonth);
                  const bal = arr - exp;
                  const expenseCount = getExpenseCount(emp.id, lastMonth);
                  return (
                  <tr key={emp.id} className="border-b border-slate-100 hover:bg-blue-50 hover:shadow-md transition-all duration-200 cursor-pointer">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white bg-blue-500">
                          {(emp.fullName || '').split(' ').slice(0, 2).map(n => n[0]).join('')}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-slate-800">{emp.fullName || 'Без имени'}</div>
                          <div className="text-xs text-slate-500">{emp.position || 'Не указана'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex flex-wrap gap-1">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          emp.status === 'Активен' ? 'bg-emerald-100 text-emerald-700' :
                          emp.status === 'Отпуск' ? 'bg-yellow-100 text-yellow-700' :
                          emp.status === 'Уволен' ? 'bg-red-100 text-red-700' :
                          'bg-slate-100 text-slate-600'
                        }`}>{emp.status}</span>
                        {emp.blocked && (
                          <span className="px-2 py-1 rounded-full text-xs bg-orange-100 text-orange-700">🔒 Заблокирован</span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3 text-right text-sm text-emerald-600">{arr.toLocaleString('ru-RU')} ₽</td>
                    <td className="px-5 py-3 text-right text-sm text-red-600">{exp.toLocaleString('ru-RU')} ₽</td>
                    <td className={`px-5 py-3 text-right text-sm font-semibold ${bal >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                      {bal.toLocaleString('ru-RU')} ₽
                    </td>
                    <td className="px-5 py-3 text-right text-sm text-orange-600">{expenseCount}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {employees.length === 0 && (
          <div className="p-8 text-center text-slate-500">
            <div className="text-3xl mb-2">👥</div>
            <p>Нет данных о сотрудниках</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ============ СОТРУДНИКИ ============
function EmployeesPage({ data }: { data: ReturnType<typeof useData> }) {
  const { employees, arrivals, expenses, nomenclature } = data;
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<gs.Employee | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<gs.Employee | null>(null);
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;



  // Фильтруем сотрудников
  const searchLower = search.toLowerCase().trim();
  
  // Сначала фильтруем по статусу и поиску (поиск по началу ФИО)
  const matched = searchLower === '' 
    ? employees.filter(e => e.status !== 'Уволен')
    : employees.filter(e => {
        if (e.status === 'Уволен') return false;
        const fullName = String(e.fullName ?? '').toLowerCase().trim();
        // Проверяем, начинается ли ФИО с введённых букв
        return fullName.startsWith(searchLower);
      });
  
  // Убираем дубликаты по ФИО — оставляем только первую запись с таким ФИО
  const seen = new Set<string>();
  const filtered = matched.filter(e => {
    const fullName = String(e.fullName ?? '').trim().toLowerCase();
    if (seen.has(fullName)) {
      return false;
    }
    seen.add(fullName);
    return true;
  });

  const getArrival = (empId: string) => arrivals.filter(a => a.employeeId === empId && a.month === currentMonth).reduce((s, a) => s + a.amount, 0);
  const getExpenseValue = (empId: string) => expenses.filter(e => e.employeeId === empId && e.month === currentMonth).reduce((s, e) => {
    const nom = nomenclature.find(n => n.id === e.nomenclatureId);
    return s + (nom ? nom.currentPrice * e.quantity : 0);
  }, 0);
  const getCalls = (empId: string) => new Set(expenses.filter(e => e.employeeId === empId && e.month === currentMonth).map(e => e.callId)).size;

  const handleAdd = (form: { fullName: string; personalNumber: string; password: string; position: string; phone: string }) => {
    // Проверка на дубликат ПЕРЕД добавлением
    const trimmedNumber = form.personalNumber.trim();
    const existingEmployee = employees.find(e => {
      const existingNumber = String(e.personalNumber ?? '').trim();
      return existingNumber === trimmedNumber;
    });
    
    if (existingEmployee) {
      return false; // Возвращаем false, чтобы модальное окно показало ошибку
    }
    
    setShowAdd(false); // Закрываем окно сразу
    gs.addEmployee({
      id: `EMP-${String(employees.length + 1).padStart(3, '0')}`,
      ...form, status: 'Активен', hireDate: new Date().toISOString().split('T')[0],
      blocked: false, lastActivity: '', note: '',
    }).then(() => data.refresh()).catch(err => {
      console.error('Ошибка добавления сотрудника:', err);
      alert('Ошибка при добавлении сотрудника. Попробуйте ещё раз.');
    });
    return true;
  };

  // ✏️ Редактирование данных сотрудника
  const handleEdit = (emp: gs.Employee) => {
    setEditingEmployee(emp);
  };

  // 🔒 Блокировка/разблокировка сотрудника
  const handleToggleBlock = async (id: string, block: boolean) => {
    if (confirm(block ? 'Заблокировать сотрудника?\n\nСотрудник не сможет войти в систему.' : 'Разблокировать сотрудника?')) {
      await gs.updateEmployee(id, { blocked: block });
      data.refresh();
    }
  };

  // 🚫 Увольнение — сотрудник уходит в архив, персональный номер освобождается
  const handleFire = async (id: string) => {
    const emp = employees.find(e => e.id === id);
    if (confirm(`Уволить сотрудника "${emp?.fullName}"?\n\nСотрудник будет перемещён в архив.\nПерсональный номер "${emp?.personalNumber}" будет освобождён.`)) {
      await gs.updateEmployee(id, { status: 'Уволен', personalNumber: '' });
      data.refresh();
    }
  };

  // 🗑️ Полное удаление из базы данных
  const handleDelete = async (id: string) => {
    const emp = employees.find(e => e.id === id);
    if (confirm(`УДАЛИТЬ сотрудника "${emp?.fullName}"?\n\n⚠️ Это действие нельзя отменить!\nСотрудник будет полностью удалён из базы данных.`)) {
      try {
        await gs.deleteEmployee(id);
        await data.refresh();
        alert(`✅ Сотрудник "${emp?.fullName}" успешно удалён`);
      } catch (error) {
        alert(`❌ Ошибка при удалении: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-3">
        <input type="text" placeholder="Поиск по ФИО..." value={search} onChange={e => setSearch(e.target.value)}
          className="flex-1 px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 shadow-sm" />
        <button onClick={() => setShowAdd(true)} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-white font-medium shadow-sm">+ Добавить сотрудника</button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        {search && (
          <div className="px-5 py-3 bg-blue-50 border-b border-blue-200 text-sm text-blue-700">
            Найдено сотрудников: <span className="font-bold">{filtered.length}</span>
            {filtered.length === 0 && ' — попробуйте изменить запрос'}
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 text-left bg-slate-50">
                <th className="px-5 py-3 text-xs font-medium text-slate-600 uppercase">Персональный номер</th>
                <th className="px-5 py-3 text-xs font-medium text-slate-600 uppercase">Сотрудник (ФИО)</th>
                <th className="px-5 py-3 text-xs font-medium text-slate-600 uppercase">Статус</th>
                <th className="px-5 py-3 text-xs font-medium text-slate-600 uppercase">Действия</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((emp, index) => (
                <tr key={`${emp.id}-${index}`} onClick={() => setSelectedEmployee(emp)} className="border-b border-slate-100 hover:bg-blue-50 hover:shadow-md transition-all duration-200 cursor-pointer">
                  <td className="px-5 py-3 text-sm text-slate-700">{emp.personalNumber || '-'}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white bg-blue-500">
                        {(emp.fullName || '').split(' ').slice(0, 2).map(n => n[0]).join('')}
                      </div>
                      <div className="text-sm font-medium text-slate-800">{emp.fullName || 'Без имени'}</div>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex flex-wrap gap-1">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        emp.status === 'Активен' ? 'bg-emerald-100 text-emerald-700' :
                        emp.status === 'Отпуск' ? 'bg-yellow-100 text-yellow-700' :
                        emp.status === 'Уволен' ? 'bg-red-100 text-red-700' :
                        'bg-slate-100 text-slate-600'
                      }`}>{emp.status}</span>
                      {emp.blocked && (
                        <span className="px-2 py-1 rounded-full text-xs bg-orange-100 text-orange-700">🔒 Заблокирован</span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleEdit(emp); }}
                        className="text-blue-600 hover:text-blue-800 text-lg"
                        title="✏️ Редактировать данные сотрудника"
                      >
                        ✏️
                      </button>
                      {emp.blocked ? (
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleToggleBlock(emp.id, false); }}
                          className="text-green-600 hover:text-green-800 text-lg"
                          title="🔓 Разблокировать сотрудника"
                        >
                          🔓
                        </button>
                      ) : (
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleToggleBlock(emp.id, true); }}
                          className="text-orange-600 hover:text-orange-800 text-lg"
                          title="🔒 Заблокировать сотрудника (например, потерял телефон)"
                        >
                          🔒
                        </button>
                      )}
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleFire(emp.id); }}
                        className="text-red-600 hover:text-red-800 text-lg"
                        title="🚫 Уволить (переместить в архив, освободить персональный номер)"
                      >
                        🚫
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDelete(emp.id); }}
                        className="text-gray-600 hover:text-gray-800 text-lg"
                        title="🗑️ Удалить из базы данных (безвозвратно)"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {/* Добавляем пустые строки до 10, если сотрудников меньше */}
              {filtered.length < 10 && Array.from({ length: 10 - filtered.length }).map((_, i) => (
                <tr key={`empty-${i}`} className="border-b border-slate-100">
                  <td className="px-5 py-3 text-sm text-slate-300">-</td>
                  <td className="px-5 py-3 text-sm text-slate-300">-</td>
                  <td className="px-5 py-3 text-sm text-slate-300">-</td>
                  <td className="px-5 py-3 text-sm text-slate-300">-</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="p-8 text-center text-slate-500">
            <div className="text-3xl mb-2">👥</div>
            <p>{search ? 'Ничего не найдено' : 'Нет сотрудников'}</p>
          </div>
        )}
      </div>
      {showAdd && (
        <AddEmployeeModal key={Date.now()} employees={employees} onClose={() => setShowAdd(false)} onAdd={handleAdd} />
      )}
      {editingEmployee && (
        <EditEmployeeModal 
          employee={editingEmployee}
          employees={employees}
          onClose={() => setEditingEmployee(null)} 
          onSave={async (id, updates) => {
            await gs.updateEmployee(id, updates);
            setEditingEmployee(null);
            data.refresh();
          }}
        />
      )}
      {selectedEmployee && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4" onClick={() => setSelectedEmployee(null)}>
          <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-800">Личный кабинет сотрудника</h3>
              <button onClick={() => setSelectedEmployee(null)} className="text-slate-400 hover:text-slate-600 text-2xl">×</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold text-white bg-blue-500">
                  {(selectedEmployee.fullName || '').split(' ').slice(0, 2).map(n => n[0]).join('')}
                </div>
                <div>
                  <div className="text-xl font-semibold text-slate-800">{selectedEmployee.fullName || 'Без имени'}</div>
                  <div className="text-sm text-slate-500">Персональный номер: {selectedEmployee.personalNumber || 'Не указан'}</div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-sm text-slate-600">Должность</span>
                  <span className="text-sm font-medium text-slate-800">{selectedEmployee.position}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-sm text-slate-600">Телефон</span>
                  <span className="text-sm font-medium text-slate-800">{selectedEmployee.phone || 'Не указан'}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-sm text-slate-600">Статус</span>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    selectedEmployee.status === 'Активен' ? 'bg-emerald-100 text-emerald-700' :
                    selectedEmployee.status === 'Отпуск' ? 'bg-yellow-100 text-yellow-700' : 'bg-slate-100 text-slate-600'
                  }`}>{selectedEmployee.status}</span>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-slate-200 flex justify-end">
              <button onClick={() => setSelectedEmployee(null)} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-white font-medium">Закрыть</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AddEmployeeModal({ employees, onClose, onAdd }: { employees: gs.Employee[]; onClose: () => void; onAdd: (form: any) => boolean }) {
  const [form, setForm] = useState({ fullName: '', personalNumber: '', password: '', position: 'Врач', phone: '' });
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = () => {
    setError(null);
    
    // Проверка уникальности персонального номера
    const trimmedNumber = form.personalNumber.trim();
    
    if (!trimmedNumber) {
      setError('Персональный номер не может быть пустым');
      return;
    }
    
    // Проверка на дубликат
    const existingEmployee = employees.find(e => {
      const existingNumber = String(e.personalNumber ?? '').trim();
      return existingNumber === trimmedNumber;
    });
    
    if (existingEmployee) {
      const errorMsg = `Сотрудник с персональным номером "${trimmedNumber}" уже существует (${existingEmployee.fullName})`;
      setError(errorMsg);
      return; // Не закрываем окно
    }
    
    const result = onAdd(form);
    
    if (!result) {
      // Получаем имя существующего сотрудника для сообщения
      const existingEmp = employees.find(e => String(e.personalNumber ?? '').trim() === trimmedNumber);
      const errorMsg = existingEmp 
        ? `Сотрудник с персональным номером "${trimmedNumber}" уже существует (${existingEmp.fullName})`
        : `Сотрудник с персональным номером "${trimmedNumber}" уже существует`;
      setError(errorMsg);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-md shadow-2xl">
        <div className="p-6 border-b border-slate-200">
          <h3 className="text-lg font-bold text-slate-800">Добавить сотрудника</h3>
        </div>
        <div className="p-6 space-y-4">
          {error && (
            <div className="p-4 bg-red-50 border-2 border-red-300 rounded-lg text-sm text-red-700 flex items-start gap-3">
              <span className="text-xl flex-shrink-0">⚠️</span>
              <div className="flex-1">
                <div className="font-semibold mb-1">Ошибка добавления</div>
                <div>{error}</div>
              </div>
            </div>
          )}
          <div>
            <label className="text-sm text-slate-600 mb-1 block">ФИО *</label>
            <input type="text" value={form.fullName} onChange={e => { setForm({ ...form, fullName: e.target.value }); setError(null); }}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
          </div>
          <div>
            <label className="text-sm text-slate-600 mb-1 block">Персональный номер *</label>
            <input 
              type="text" 
              value={form.personalNumber} 
              onChange={e => { setForm({ ...form, personalNumber: e.target.value }); setError(null); }}
              className={`w-full px-3 py-2 bg-white border-2 rounded-lg text-slate-800 focus:outline-none focus:ring-2 transition-all ${
                error 
                  ? 'border-red-400 focus:border-red-500 focus:ring-red-500/30 bg-red-50' 
                  : 'border-slate-300 focus:border-blue-500 focus:ring-blue-500/20'
              }`} 
            />
            {error && (
              <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                <span>⚠️</span>
                <span>Проверьте персональный номер</span>
              </p>
            )}
          </div>
          <div>
            <label className="text-sm text-slate-600 mb-1 block">Пароль *</label>
            <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
          </div>
          <div>
            <label className="text-sm text-slate-600 mb-1 block">Должность *</label>
            <select value={form.position} onChange={e => setForm({ ...form, position: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500">
              <option>Врач</option><option>Фельдшер</option><option>Медсестра</option>
            </select>
          </div>
          <div>
            <label className="text-sm text-slate-600 mb-1 block">Телефон</label>
            <input type="text" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
          </div>
        </div>
        <div className="p-6 border-t border-slate-200 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100">Отмена</button>
          <button onClick={handleSubmit} disabled={!form.fullName || !form.personalNumber || !form.password}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-300 rounded-lg text-white font-medium">Добавить</button>
        </div>
      </div>
    </div>
  );
}

// ============ РЕДАКТИРОВАНИЕ СОТРУДНИКА ============
function EditEmployeeModal({ 
  employee, 
  employees,
  onClose, 
  onSave 
}: { 
  employee: gs.Employee;
  employees: gs.Employee[];
  onClose: () => void; 
  onSave: (id: string, updates: Partial<gs.Employee>) => void 
}) {
  const [form, setForm] = useState({
    fullName: employee.fullName,
    personalNumber: employee.personalNumber,
    position: employee.position,
    phone: employee.phone,
    note: employee.note,
  });
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = () => {
    setError(null);
    
    // Проверка уникальности персонального номера (исключая текущего сотрудника)
    const trimmedNumber = form.personalNumber.trim();
    
    if (!trimmedNumber) {
      setError('Персональный номер не может быть пустым');
      return;
    }
    
    const existingEmployee = employees.find(e => 
      e.id !== employee.id && 
      String(e.personalNumber ?? '').trim() === trimmedNumber
    );
    
    if (existingEmployee) {
      setError(`Персональный номер "${trimmedNumber}" уже используется сотрудником "${existingEmployee.fullName}"`);
      return;
    }
    
    onSave(employee.id, {
      fullName: form.fullName,
      personalNumber: trimmedNumber,
      position: form.position,
      phone: form.phone,
      note: form.note,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-md shadow-2xl">
        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-800">✏️ Редактирование сотрудника</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-2xl">×</button>
        </div>
        <div className="p-6 space-y-4">
          {error && (
            <div className="p-4 bg-red-50 border-2 border-red-300 rounded-lg text-sm text-red-700 flex items-start gap-3">
              <span className="text-xl flex-shrink-0">⚠️</span>
              <div className="flex-1">
                <div className="font-semibold mb-1">Ошибка</div>
                <div>{error}</div>
              </div>
            </div>
          )}
          <div>
            <label className="text-sm text-slate-600 mb-1 block">ФИО *</label>
            <input 
              type="text" 
              value={form.fullName} 
              onChange={e => { setForm({ ...form, fullName: e.target.value }); setError(null); }}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" 
            />
          </div>
          <div>
            <label className="text-sm text-slate-600 mb-1 block">Персональный номер *</label>
            <input 
              type="text" 
              value={form.personalNumber} 
              onChange={e => { setForm({ ...form, personalNumber: e.target.value }); setError(null); }}
              className={`w-full px-3 py-2 bg-white border-2 rounded-lg text-slate-800 focus:outline-none focus:ring-2 transition-all ${
                error 
                  ? 'border-red-400 focus:border-red-500 focus:ring-red-500/30 bg-red-50' 
                  : 'border-slate-300 focus:border-blue-500 focus:ring-blue-500/20'
              }`} 
            />
            {error && (
              <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                <span>⚠️</span>
                <span>Проверьте персональный номер</span>
              </p>
            )}
          </div>
          <div>
            <label className="text-sm text-slate-600 mb-1 block">Должность *</label>
            <select 
              value={form.position} 
              onChange={e => setForm({ ...form, position: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500"
            >
              <option>Врач</option>
              <option>Фельдшер</option>
              <option>Медсестра</option>
            </select>
          </div>
          <div>
            <label className="text-sm text-slate-600 mb-1 block">Телефон</label>
            <input 
              type="text" 
              value={form.phone} 
              onChange={e => setForm({ ...form, phone: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" 
            />
          </div>
          <div>
            <label className="text-sm text-slate-600 mb-1 block">Примечание</label>
            <textarea 
              value={form.note} 
              onChange={e => setForm({ ...form, note: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 resize-none" 
            />
          </div>
        </div>
        <div className="p-6 border-t border-slate-200 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100">Отмена</button>
          <button 
            onClick={handleSubmit} 
            disabled={!form.fullName || !form.personalNumber || !form.position}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-300 rounded-lg text-white font-medium"
          >
            💾 Сохранить
          </button>
        </div>
      </div>
    </div>
  );
}

// ============ НОМЕНКЛАТУРА ============
function NomenclaturePage({ data }: { data: ReturnType<typeof useData> }) {
  const { nomenclature } = data;
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('all');

  const searchLower = String(search || '').toLowerCase().trim();
  const filtered = nomenclature.filter(n => {
    const name = String(n.name ?? '').toLowerCase();
    const matchSearch = !searchLower || name.includes(searchLower);
    const matchCat = catFilter === 'all' || n.category === catFilter;
    return matchSearch && matchCat;
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Номенклатура</h2>
        <p className="text-slate-500 text-sm mt-1">Всего позиций: {nomenclature.length}</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm">
          <div className="text-2xl font-bold text-emerald-600">{nomenclature.filter(n => n.category === 'Лекарство').length}</div>
          <div className="text-xs text-slate-500">Лекарств</div>
        </div>
        <div className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm">
          <div className="text-2xl font-bold text-blue-600">{nomenclature.filter(n => n.category === 'Оборудование').length}</div>
          <div className="text-xs text-slate-500">Оборудования</div>
        </div>
        <div className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm">
          <div className="text-2xl font-bold text-purple-600">{nomenclature.filter(n => n.category === 'Расходный материал').length}</div>
          <div className="text-xs text-slate-500">Расходных материалов</div>
        </div>
      </div>

      <div className="flex gap-3">
        <input type="text" placeholder="Поиск..." value={search} onChange={e => setSearch(e.target.value)}
          className="flex-1 px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 shadow-sm" />
        <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
          className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500 shadow-sm">
          <option value="all">Все категории</option>
          <option value="Лекарство">Лекарства</option>
          <option value="Оборудование">Оборудование</option>
          <option value="Расходный материал">Расходные материалы</option>
        </select>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200 text-left bg-slate-50">
              <th className="px-5 py-3 text-xs font-medium text-slate-600 uppercase">Название</th>
              <th className="px-5 py-3 text-xs font-medium text-slate-600 uppercase">Категория</th>
              <th className="px-5 py-3 text-xs font-medium text-slate-600 uppercase">Ед. изм.</th>
              <th className="px-5 py-3 text-xs font-medium text-slate-600 uppercase text-right">Цена (₽)</th>
              <th className="px-5 py-3 text-xs font-medium text-slate-600 uppercase text-center">Статус</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(item => (
              <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="px-5 py-3">
                  <div className="text-sm font-medium text-slate-800">{item.name}</div>
                  <div className="text-xs text-slate-400 font-mono">{item.id}</div>
                </td>
                <td className="px-5 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    item.category === 'Лекарство' ? 'bg-emerald-100 text-emerald-700' :
                    item.category === 'Оборудование' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                  }`}>{item.category}</span>
                </td>
                <td className="px-5 py-3 text-sm text-slate-700">{item.unit}</td>
                <td className="px-5 py-3 text-right text-sm font-semibold text-emerald-600">{item.currentPrice.toLocaleString('ru-RU')} ₽</td>
                <td className="px-5 py-3 text-center">
                  <span className={`px-2 py-1 rounded-full text-xs ${item.active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                    {item.active ? 'Активна' : 'Неактивна'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="p-8 text-center text-slate-500">
            <div className="text-3xl mb-2">💊</div>
            <p>Номенклатура пуста</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ============ ОПЕРАЦИИ ============
function OperationsPage({ data }: { data: ReturnType<typeof useData> }) {
  const { employees, nomenclature, arrivals, expenses, returns } = data;
  const [subTab, setSubTab] = useState<'arrival' | 'expense' | 'returns'>('arrival');
  const [showAddArrival, setShowAddArrival] = useState(false);
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Операции</h2>
        <p className="text-slate-500 text-sm mt-1">Приход, расход и возвраты</p>
      </div>

      <div className="flex gap-2 bg-white rounded-xl p-1 border border-slate-200 shadow-sm">
        <button onClick={() => setSubTab('arrival')}
          className={`flex-1 py-2.5 rounded-lg text-sm font-medium ${subTab === 'arrival' ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}>💰 Приход</button>
        <button onClick={() => setSubTab('expense')}
          className={`flex-1 py-2.5 rounded-lg text-sm font-medium ${subTab === 'expense' ? 'bg-blue-500 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}>📤 Расход</button>
        <button onClick={() => setSubTab('returns')}
          className={`flex-1 py-2.5 rounded-lg text-sm font-medium relative ${subTab === 'returns' ? 'bg-orange-500 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}>
          ↩️ Возвраты
          {returns.filter(r => r.status === 'Новый').length > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center text-white">
              {returns.filter(r => r.status === 'Новый').length}
            </span>
          )}
        </button>
      </div>

      {subTab === 'arrival' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="text-sm text-slate-600">
              Приход за {currentMonth}: <span className="text-emerald-600 font-bold">
                {arrivals.filter(a => a.month === currentMonth).reduce((s, a) => s + a.amount, 0).toLocaleString('ru-RU')} ₽
              </span>
            </div>
            <button onClick={() => setShowAddArrival(true)} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-white text-sm font-medium shadow-sm">+ Внести приход</button>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 text-left bg-slate-50">
                  <th className="px-5 py-3 text-xs font-medium text-slate-600 uppercase">Дата</th>
                  <th className="px-5 py-3 text-xs font-medium text-slate-600 uppercase">Сотрудник</th>
                  <th className="px-5 py-3 text-xs font-medium text-slate-600 uppercase">Тип</th>
                  <th className="px-5 py-3 text-xs font-medium text-slate-600 uppercase text-right">Сумма (₽)</th>
                  <th className="px-5 py-3 text-xs font-medium text-slate-600 uppercase text-right">Смены</th>
                </tr>
              </thead>
              <tbody>
                {arrivals.sort((a, b) => b.date.localeCompare(a.date)).map(arr => {
                  const emp = employees.find(e => e.id === arr.employeeId);
                  return (
                    <tr key={arr.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="px-5 py-3 text-sm text-slate-700">{arr.date}</td>
                      <td className="px-5 py-3 text-sm text-slate-800">{emp?.fullName || arr.employeeId}</td>
                      <td className="px-5 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs ${arr.type === 'Плановый' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>{arr.type}</span>
                      </td>
                      <td className="px-5 py-3 text-right text-sm font-semibold text-emerald-600">{arr.amount.toLocaleString('ru-RU')} ₽</td>
                      <td className="px-5 py-3 text-right text-sm text-slate-700">{arr.shifts}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {arrivals.length === 0 && (
              <div className="p-8 text-center text-slate-500"><div className="text-3xl mb-2">💰</div><p>Нет записей о приходе</p></div>
            )}
          </div>
          {showAddArrival && <AddArrivalModal employees={employees.filter(e => e.status === 'Активен')} currentMonth={currentMonth}
            onClose={() => setShowAddArrival(false)} onAdd={async (form) => {
              await gs.addArrival({
                id: `ARR-${String(arrivals.length + 1).padStart(3, '0')}`, ...form,
                date: new Date().toISOString().split('T')[0], month: currentMonth, addedBy: 'Руководитель',
              });
              setShowAddArrival(false); data.refresh();
            }} />}
        </div>
      )}

      {subTab === 'expense' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 text-left bg-slate-50">
                <th className="px-5 py-3 text-xs font-medium text-slate-600 uppercase">Дата</th>
                <th className="px-5 py-3 text-xs font-medium text-slate-600 uppercase">Сотрудник</th>
                <th className="px-5 py-3 text-xs font-medium text-slate-600 uppercase">Пациент</th>
                <th className="px-5 py-3 text-xs font-medium text-slate-600 uppercase">Препарат</th>
                <th className="px-5 py-3 text-xs font-medium text-slate-600 uppercase text-right">Кол-во</th>
              </tr>
            </thead>
            <tbody>
              {expenses.slice(0, 100).map(exp => {
                const emp = employees.find(e => e.id === exp.employeeId);
                const nom = nomenclature.find(n => n.id === exp.nomenclatureId);
                return (
                  <tr key={exp.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-5 py-3 text-sm text-slate-700">{exp.callDate}</td>
                    <td className="px-5 py-3 text-sm text-slate-800">{(emp?.fullName || '').split(' ').slice(0, 2).join(' ')}</td>
                    <td className="px-5 py-3">
                      <div className="text-sm text-slate-800">{exp.patientName}</div>
                      <div className="text-xs text-slate-500">ДР: {exp.patientBirthDate}</div>
                    </td>
                    <td className="px-5 py-3 text-sm text-slate-700">{nom?.name}</td>
                    <td className="px-5 py-3 text-right text-sm text-slate-800">{exp.quantity} {nom?.unit}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {expenses.length === 0 && (
            <div className="p-8 text-center text-slate-500"><div className="text-3xl mb-2">📤</div><p>Нет записей о расходе</p></div>
          )}
        </div>
      )}

      {subTab === 'returns' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 text-left bg-slate-50">
                <th className="px-5 py-3 text-xs font-medium text-slate-600 uppercase">Дата</th>
                <th className="px-5 py-3 text-xs font-medium text-slate-600 uppercase">Сотрудник</th>
                <th className="px-5 py-3 text-xs font-medium text-slate-600 uppercase">Препарат</th>
                <th className="px-5 py-3 text-xs font-medium text-slate-600 uppercase text-right">Кол-во</th>
                <th className="px-5 py-3 text-xs font-medium text-slate-600 uppercase">Причина</th>
                <th className="px-5 py-3 text-xs font-medium text-slate-600 uppercase text-center">Статус</th>
              </tr>
            </thead>
            <tbody>
              {returns.map(ret => {
                const emp = employees.find(e => e.id === ret.employeeId);
                const nom = nomenclature.find(n => n.id === ret.nomenclatureId);
                return (
                  <tr key={ret.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-5 py-3 text-sm text-slate-700">{ret.date}</td>
                    <td className="px-5 py-3 text-sm text-slate-800">{emp?.fullName}</td>
                    <td className="px-5 py-3 text-sm text-slate-700">{nom?.name}</td>
                    <td className="px-5 py-3 text-right text-sm text-slate-800">{ret.quantity} {nom?.unit}</td>
                    <td className="px-5 py-3 text-sm text-slate-600">{ret.reason}</td>
                    <td className="px-5 py-3 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        ret.status === 'Новый' ? 'bg-yellow-100 text-yellow-700' :
                        ret.status === 'Принят' ? 'bg-emerald-100 text-emerald-700' :
                        ret.status === 'Скорректирован' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'
                      }`}>{ret.status}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {returns.length === 0 && (
            <div className="p-8 text-center text-slate-500"><div className="text-3xl mb-2">↩️</div><p>Нет возвратов</p></div>
          )}
        </div>
      )}
    </div>
  );
}

function AddArrivalModal({ employees, onClose, onAdd }: { employees: gs.Employee[]; currentMonth: string; onClose: () => void; onAdd: (form: any) => void }) {
  const [form, setForm] = useState({ employeeId: employees[0]?.id || '', amount: 0, shifts: 0, type: 'Плановый' as 'Плановый' | 'Дополнительный', comment: '' });
  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-md shadow-2xl">
        <div className="p-6 border-b border-slate-200">
          <h3 className="text-lg font-bold text-slate-800">Внести приход</h3>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="text-sm text-slate-600 mb-1 block">Сотрудник</label>
            <select value={form.employeeId} onChange={e => setForm({ ...form, employeeId: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500">
              {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.fullName}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm text-slate-600 mb-1 block">Сумма (₽)</label>
            <input type="number" value={form.amount || ''} onChange={e => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500" />
          </div>
          <div>
            <label className="text-sm text-slate-600 mb-1 block">Смены</label>
            <input type="number" value={form.shifts || ''} onChange={e => setForm({ ...form, shifts: parseInt(e.target.value) || 0 })}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500" />
          </div>
          <div>
            <label className="text-sm text-slate-600 mb-1 block">Комментарий</label>
            <input type="text" value={form.comment} onChange={e => setForm({ ...form, comment: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500" />
          </div>
        </div>
        <div className="p-6 border-t border-slate-200 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100">Отмена</button>
          <button onClick={() => onAdd(form)} disabled={form.amount <= 0}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-300 rounded-lg text-white font-medium">Внести</button>
        </div>
      </div>
    </div>
  );
}

// ============ ОСТАТКИ ============
function StockPage({ data }: { data: ReturnType<typeof useData> }) {
  const { employees, nomenclature, expenses, returns } = data;
  const activeEmployees = employees.filter(e => e.status === 'Активен');
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const stockByNomenclature = () => {
    const map: Record<string, { qty: number; value: number; name: string; unit: string; price: number }> = {};
    expenses.filter(e => e.month === currentMonth).forEach(e => {
      if (!map[e.nomenclatureId]) {
        const nom = nomenclature.find(n => n.id === e.nomenclatureId);
        if (nom) map[e.nomenclatureId] = { qty: 0, value: 0, name: nom.name, unit: nom.unit, price: nom.currentPrice };
      }
      if (map[e.nomenclatureId]) map[e.nomenclatureId].qty -= e.quantity;
    });
    returns.filter(r => r.status === 'Принят' || r.status === 'Скорректирован').forEach(r => {
      if (map[r.nomenclatureId]) map[r.nomenclatureId].qty += (r.correctedQuantity ?? r.quantity);
    });
    return Object.entries(map).filter(([, v]) => v.qty > 0).map(([id, v]) => ({ id, ...v, value: v.qty * v.price }));
  };

  const totalValue = stockByNomenclature().reduce((s, i) => s + i.value, 0);
  const totalItems = stockByNomenclature().reduce((s, i) => s + i.qty, 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Остатки</h2>
        <p className="text-slate-500 text-sm mt-1">Период: {currentMonth}</p>
      </div>

      <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-6 border border-slate-200 shadow-sm">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-4 text-center shadow-sm">
            <div className="text-2xl font-bold text-purple-600">{totalValue.toLocaleString('ru-RU')} ₽</div>
            <div className="text-xs text-slate-500 mt-1">Общая стоимость</div>
          </div>
          <div className="bg-white rounded-xl p-4 text-center shadow-sm">
            <div className="text-2xl font-bold text-blue-600">{totalItems}</div>
            <div className="text-xs text-slate-500 mt-1">Единиц</div>
          </div>
          <div className="bg-white rounded-xl p-4 text-center shadow-sm">
            <div className="text-2xl font-bold text-emerald-600">{activeEmployees.length}</div>
            <div className="text-xs text-slate-500 mt-1">Сотрудников</div>
          </div>
          <div className="bg-white rounded-xl p-4 text-center shadow-sm">
            <div className="text-2xl font-bold text-yellow-600">{stockByNomenclature().length}</div>
            <div className="text-xs text-slate-500 mt-1">Позиций</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-5 border-b border-slate-200 bg-slate-50">
          <h3 className="text-lg font-bold text-slate-800">Остатки по номенклатуре</h3>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200 text-left bg-slate-50">
              <th className="px-5 py-3 text-xs font-medium text-slate-600 uppercase">Препарат</th>
              <th className="px-5 py-3 text-xs font-medium text-slate-600 uppercase text-right">Кол-во</th>
              <th className="px-5 py-3 text-xs font-medium text-slate-600 uppercase text-right">Цена/ед.</th>
              <th className="px-5 py-3 text-xs font-medium text-slate-600 uppercase text-right">Стоимость</th>
            </tr>
          </thead>
          <tbody>
            {stockByNomenclature().sort((a, b) => b.value - a.value).map(item => (
              <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="px-5 py-3 text-sm text-slate-800">{item.name}</td>
                <td className="px-5 py-3 text-right text-sm text-slate-800">{item.qty} {item.unit}</td>
                <td className="px-5 py-3 text-right text-sm text-slate-700">{item.price.toLocaleString('ru-RU')} ₽</td>
                <td className="px-5 py-3 text-right text-sm font-semibold text-emerald-600">{item.value.toLocaleString('ru-RU')} ₽</td>
              </tr>
            ))}
          </tbody>
        </table>
        {stockByNomenclature().length === 0 && (
          <div className="p-8 text-center text-slate-500"><div className="text-3xl mb-2">📦</div><p>Нет данных об остатках</p></div>
        )}
      </div>
    </div>
  );
}

// ============ ЧАТ ============
function ChatPage({ data }: { data: ReturnType<typeof useData> }) {
  const { chatMessages, employees } = data;
  const [selectedChat, setSelectedChat] = useState<string>(employees[0]?.id || '');
  const [newMessage, setNewMessage] = useState('');

  const chatWith = chatMessages.filter(m =>
    (m.fromId === selectedChat && m.toId === 'MGR') || (m.fromId === 'MGR' && m.toId === selectedChat)
  ).sort((a, b) => a.date.localeCompare(b.date));

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedChat) return;
    const emp = employees.find(e => e.id === selectedChat);
    await gs.addChatMessage({
      id: `MSG-${Date.now()}`, fromId: 'MGR', fromName: 'Руководитель',
      toId: selectedChat, toName: emp?.fullName || '',
      role: 'Руководитель', text: newMessage, priority: 'Обычное',
    });
    setNewMessage(''); data.refresh();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Сообщения</h2>
        <p className="text-slate-500 text-sm mt-1">Чат с сотрудниками</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden flex h-[600px] shadow-sm">
        <div className="w-80 border-r border-slate-200 flex flex-col">
          <div className="p-4 border-b border-slate-200 bg-slate-50">
            <h3 className="font-bold text-slate-800 text-sm">Диалоги</h3>
          </div>
          <div className="flex-1 overflow-y-auto">
            {employees.filter(e => e.status === 'Активен').map(emp => (
              <button key={emp.id} onClick={() => setSelectedChat(emp.id)}
                className={`w-full p-4 flex items-center gap-3 text-left border-b border-slate-100 ${
                  selectedChat === emp.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : 'hover:bg-slate-50'
                }`}>
                <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center text-sm font-bold text-white">{emp.fullName[0]}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-800 truncate">{emp.fullName}</div>
                  <div className="text-xs text-slate-500">{emp.position}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 flex flex-col">
          <div className="p-4 border-b border-slate-200 flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center text-sm font-bold text-white">
              {employees.find(e => e.id === selectedChat)?.fullName[0] || '?'}
            </div>
            <div>
              <div className="font-medium text-slate-800">{employees.find(e => e.id === selectedChat)?.fullName}</div>
              <div className="text-xs text-slate-500">{employees.find(e => e.id === selectedChat)?.position}</div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
            {chatWith.length === 0 ? (
              <div className="text-center text-slate-500 mt-8">
                <div className="text-4xl mb-2">💬</div><p>Нет сообщений</p>
              </div>
            ) : chatWith.map(msg => (
              <div key={msg.id} className={`flex ${msg.fromId === 'MGR' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 ${
                  msg.fromId === 'MGR' ? 'bg-blue-500 text-white rounded-br-md' : 'bg-white text-slate-800 rounded-bl-md border border-slate-200'
                }`}>
                  <p className="text-sm">{msg.text}</p>
                  <div className={`text-xs mt-1 ${msg.fromId === 'MGR' ? 'text-blue-100' : 'text-slate-500'}`}>{msg.date}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 border-t border-slate-200">
            <div className="flex gap-2">
              <input type="text" value={newMessage} onChange={e => setNewMessage(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendMessage()}
                placeholder="Введите сообщение..."
                className="flex-1 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500" />
              <button onClick={sendMessage} disabled={!newMessage.trim()}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-300 rounded-xl text-white font-medium">➤</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============ ОТЧЁТЫ ============
function ReportsPage({ data }: { data: ReturnType<typeof useData> }) {
  const { employees, arrivals, expenses, nomenclature } = data;
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date(); d.setMonth(d.getMonth() - 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  const reportData = employees.filter(e => e.status !== 'Уволен').map(emp => {
    const calls = new Set(expenses.filter(e => e.employeeId === emp.id && e.month === selectedMonth).map(e => e.callId)).size;
    const arrival = arrivals.filter(a => a.employeeId === emp.id && a.month === selectedMonth).reduce((s, a) => s + a.amount, 0);
    const expense = expenses.filter(e => e.employeeId === emp.id && e.month === selectedMonth).reduce((s, e) => {
      const nom = nomenclature.find(n => n.id === e.nomenclatureId);
      return s + (nom ? nom.currentPrice * e.quantity : 0);
    }, 0);
    return { emp, calls, arrival, expense, balance: arrival - expense };
  });

  const totals = {
    calls: reportData.reduce((s, r) => s + r.calls, 0),
    arrival: reportData.reduce((s, r) => s + r.arrival, 0),
    expense: reportData.reduce((s, r) => s + r.expense, 0),
    balance: reportData.reduce((s, r) => s + r.balance, 0),
  };

  const exportCSV = () => {
    const headers = ['ФИО', 'Должность', 'Вызовы', 'Приход (₽)', 'Расход (₽)', 'Остаток (₽)'];
    const rows = reportData.map(r => [r.emp.fullName, r.emp.position, r.calls, r.arrival, r.expense, r.balance]);
    const csv = [headers, ...rows].map(row => row.join(';')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `Отчет_${selectedMonth}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Отчёты</h2>
          <p className="text-slate-500 text-sm mt-1">Ежемесячные отчёты</p>
        </div>
        <button onClick={exportCSV} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-white text-sm font-medium shadow-sm">📊 Экспорт CSV</button>
      </div>

      <input type="month" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)}
        className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500 shadow-sm" />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-500">Приход</div>
          <div className="text-xl font-bold text-emerald-600 mt-1">{totals.arrival.toLocaleString('ru-RU')} ₽</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-500">Расход</div>
          <div className="text-xl font-bold text-blue-600 mt-1">{totals.expense.toLocaleString('ru-RU')} ₽</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-500">Остаток</div>
          <div className="text-xl font-bold text-purple-600 mt-1">{totals.balance.toLocaleString('ru-RU')} ₽</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-500">Вызовов</div>
          <div className="text-xl font-bold text-slate-800 mt-1">{totals.calls}</div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-5 border-b border-slate-200 bg-slate-50">
          <h3 className="text-lg font-bold text-slate-800">📋 Отчёт за {selectedMonth}</h3>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200 text-left bg-slate-50">
              <th className="px-5 py-3 text-xs font-medium text-slate-600 uppercase">№</th>
              <th className="px-5 py-3 text-xs font-medium text-slate-600 uppercase">ФИО</th>
              <th className="px-5 py-3 text-xs font-medium text-slate-600 uppercase text-right">Вызовы</th>
              <th className="px-5 py-3 text-xs font-medium text-slate-600 uppercase text-right">Приход</th>
              <th className="px-5 py-3 text-xs font-medium text-slate-600 uppercase text-right">Расход</th>
              <th className="px-5 py-3 text-xs font-medium text-slate-600 uppercase text-right">Остаток</th>
            </tr>
          </thead>
          <tbody>
            {reportData.map((row, i) => (
              <tr key={row.emp.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="px-5 py-3 text-sm text-slate-500">{i + 1}</td>
                <td className="px-5 py-3">
                  <div className="text-sm font-medium text-slate-800">{row.emp.fullName}</div>
                  <div className="text-xs text-slate-500">{row.emp.position}</div>
                </td>
                <td className="px-5 py-3 text-right text-sm text-slate-800">{row.calls}</td>
                <td className="px-5 py-3 text-right text-sm text-emerald-600">{row.arrival.toLocaleString('ru-RU')} ₽</td>
                <td className="px-5 py-3 text-right text-sm text-blue-600">{row.expense.toLocaleString('ru-RU')} ₽</td>
                <td className={`px-5 py-3 text-right text-sm font-semibold ${row.balance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {row.balance.toLocaleString('ru-RU')} ₽
                </td>
              </tr>
            ))}
            <tr className="bg-slate-50 font-bold">
              <td className="px-5 py-3" colSpan={2}><span className="text-sm text-slate-800">ИТОГО</span></td>
              <td className="px-5 py-3 text-right text-sm text-slate-800">{totals.calls}</td>
              <td className="px-5 py-3 text-right text-sm text-emerald-600">{totals.arrival.toLocaleString('ru-RU')} ₽</td>
              <td className="px-5 py-3 text-right text-sm text-blue-600">{totals.expense.toLocaleString('ru-RU')} ₽</td>
              <td className={`px-5 py-3 text-right text-sm ${totals.balance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {totals.balance.toLocaleString('ru-RU')} ₽
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============ ЖУРНАЛ ============
function AuditPage({ data }: { data: ReturnType<typeof useData> }) {
  const { auditLog } = data;
  const [search, setSearch] = useState('');

  const searchLower = String(search || '').toLowerCase().trim();
  const filtered = auditLog.filter(log => {
    if (!searchLower) return true;
    const newValue = String(log.newValue ?? '').toLowerCase();
    const oldValue = String(log.oldValue ?? '').toLowerCase();
    const recordId = String(log.recordId ?? '').toLowerCase();
    return newValue.includes(searchLower) || oldValue.includes(searchLower) || recordId.includes(searchLower);
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Журнал изменений</h2>
        <p className="text-slate-500 text-sm mt-1">История всех действий • Всего записей: {auditLog.length}</p>
      </div>

      <input type="text" placeholder="Поиск..." value={search} onChange={e => setSearch(e.target.value)}
        className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 shadow-sm" />

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200 text-left bg-slate-50">
              <th className="px-5 py-3 text-xs font-medium text-slate-600 uppercase">Дата</th>
              <th className="px-5 py-3 text-xs font-medium text-slate-600 uppercase">Пользователь</th>
              <th className="px-5 py-3 text-xs font-medium text-slate-600 uppercase">Лист</th>
              <th className="px-5 py-3 text-xs font-medium text-slate-600 uppercase">Действие</th>
              <th className="px-5 py-3 text-xs font-medium text-slate-600 uppercase">Было → Стало</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(log => (
              <tr key={log.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="px-5 py-3 text-sm text-slate-700 whitespace-nowrap">{log.date}</td>
                <td className="px-5 py-3">
                  <div className="text-sm text-slate-800">{log.userName}</div>
                  <div className="text-xs text-slate-500">{log.role}</div>
                </td>
                <td className="px-5 py-3"><span className="px-2 py-1 rounded bg-slate-100 text-xs text-slate-700">{log.sheet}</span></td>
                <td className="px-5 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    log.action === 'Создание' ? 'bg-emerald-100 text-emerald-700' :
                    log.action === 'Изменение' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'
                  }`}>{log.action}</span>
                </td>
                <td className="px-5 py-3 text-sm">
                  <div className="flex items-center gap-1">
                    {log.oldValue && <span className="text-red-600 line-through text-xs">{log.oldValue}</span>}
                    {log.oldValue && log.newValue && <span className="text-slate-500">→</span>}
                    {log.newValue && <span className="text-emerald-600 text-xs">{log.newValue}</span>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="p-8 text-center text-slate-500"><div className="text-3xl mb-2">📝</div><p>Журнал пуст</p></div>
        )}
      </div>
    </div>
  );
}

// ============ НАСТРОЙКИ ============
function SettingsPage({ data }: { data: ReturnType<typeof useData> }) {
  const { employees, nomenclature, arrivals, expenses, returns, chatMessages, auditLog } = data;
  const config = gs.getCurrentConfig();

  const handleDisconnect = () => {
    if (confirm('Вы уверены? Приложение перестанет работать с Google Sheets.')) {
      gs.clearConfig(); window.location.reload();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Настройки</h2>
        <p className="text-slate-500 text-sm mt-1">Информация о системе и подключении</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <h3 className="text-lg font-bold text-slate-800">📊 Подключение к Google Sheets</h3>
          <button onClick={handleDisconnect} className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-sm hover:bg-red-100 border border-red-200">Отключить</button>
        </div>
        <div className="p-5 space-y-3">
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 bg-emerald-500 rounded-full"></span>
            <span className="text-sm text-slate-800">Статус: Подключено</span>
          </div>
          <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
            <div className="text-xs text-slate-500">URL веб-приложения</div>
            <div className="text-sm text-slate-800 font-mono break-all">{config.scriptUrl.substring(0, 50)}...</div>
          </div>
          <p className="text-xs text-slate-500">Подключение через Google Apps Script Web App</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-5 border-b border-slate-200 bg-slate-50">
          <h3 className="text-lg font-bold text-slate-800">📈 Статистика данных</h3>
        </div>
        <div className="p-5 grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
            <div className="text-2xl font-bold text-slate-800">{employees.length}</div>
            <div className="text-xs text-slate-500">Сотрудников</div>
          </div>
          <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
            <div className="text-2xl font-bold text-slate-800">{nomenclature.length}</div>
            <div className="text-xs text-slate-500">Позиций номенклатуры</div>
          </div>
          <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
            <div className="text-2xl font-bold text-slate-800">{arrivals.length}</div>
            <div className="text-xs text-slate-500">Записей прихода</div>
          </div>
          <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
            <div className="text-2xl font-bold text-slate-800">{expenses.length}</div>
            <div className="text-xs text-slate-500">Записей расхода</div>
          </div>
          <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
            <div className="text-2xl font-bold text-slate-800">{returns.length}</div>
            <div className="text-xs text-slate-500">Возвратов</div>
          </div>
          <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
            <div className="text-2xl font-bold text-slate-800">{chatMessages.length}</div>
            <div className="text-xs text-slate-500">Сообщений</div>
          </div>
          <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
            <div className="text-2xl font-bold text-slate-800">{auditLog.length}</div>
            <div className="text-xs text-slate-500">Записей журнала</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-5 border-b border-slate-200 bg-slate-50">
          <h3 className="text-lg font-bold text-slate-800">ℹ️ О системе</h3>
        </div>
        <div className="p-5 space-y-2">
          <div className="flex justify-between py-2 border-b border-slate-100">
            <span className="text-sm text-slate-500">Версия</span>
            <span className="text-sm text-slate-800">3.0.0 (Apps Script Web App)</span>
          </div>
          <div className="flex justify-between py-2 border-b border-slate-100">
            <span className="text-sm text-slate-500">Хранилище</span>
            <span className="text-sm text-slate-800">Google Sheets</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-sm text-slate-500">Дата</span>
            <span className="text-sm text-slate-800">{new Date().toLocaleDateString('ru-RU')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
