import { useState, useEffect, useCallback, Component, type ReactNode } from 'react';
import * as gs from './services/googleSheets';

// Компонент экрана ошибки подключения
function ConnectionErrorScreen({ error, onRetry }: { error: string; onRetry: () => void }) {
  const [newUrl, setNewUrl] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdateUrl = () => {
    if (!newUrl.trim()) {
      alert('Введите URL веб-приложения');
      return;
    }
    setIsUpdating(true);
    gs.saveConfig(newUrl.trim());
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  const handleDisconnect = () => {
    if (confirm('Вы уверены? Приложение перестанет работать с Google Sheets.')) {
      gs.clearConfig();
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-8 border border-red-200 shadow-lg max-w-lg w-full">
        <img src={LOGO_URL} alt="АлкоСпас" className="w-32 h-32 object-contain mx-auto mb-4" />
        <h2 className="text-xl font-bold text-slate-800 text-center mb-2">Ошибка подключения</h2>
        <p className="text-red-600 text-sm text-center mb-4">{error}</p>
        
        <div className="bg-slate-50 rounded-lg p-4 mb-4 border border-slate-200">
          <p className="text-sm text-slate-600 mb-2 font-medium">Проверьте:</p>
          <ul className="text-sm text-slate-700 space-y-1 list-disc list-inside">
            <li>URL веб-приложения Apps Script</li>
            <li>Доступ к таблице (публичный)</li>
            <li>Структуру таблицы (должны быть все листы)</li>
            <li>Интернет-соединение</li>
          </ul>
        </div>

        <div className="space-y-3 mb-4">
          <label className="block text-sm font-medium text-slate-700">Изменить URL подключения:</label>
          <input
            type="text"
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            placeholder="https://script.google.com/macros/s/..."
            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          />
          <button
            onClick={handleUpdateUrl}
            disabled={isUpdating || !newUrl.trim()}
            className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 disabled:from-slate-300 disabled:to-slate-300 disabled:text-slate-500 rounded-lg text-white font-medium shadow-lg shadow-blue-600/20 disabled:shadow-none"
          >
            {isUpdating ? '⏳ Обновление...' : '🔗 Обновить URL'}
          </button>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onRetry}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 rounded-lg text-white font-medium shadow-lg shadow-red-600/20"
          >
            🔄 Повторить
          </button>
          <button
            onClick={handleDisconnect}
            className="flex-1 px-4 py-3 bg-slate-200 hover:bg-slate-300 rounded-lg text-slate-700 font-medium"
          >
            ⚙️ Настройки
          </button>
        </div>
      </div>
    </div>
  );
}

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
  const [expenseSheets, setExpenseSheets] = useState<gs.ExpenseSheet[]>([]);
  const [returns, setReturns] = useState<gs.ReturnOperation[]>([]);
  const [chatMessages, setChatMessages] = useState<gs.ChatMessage[]>([]);
  const [announcements, setAnnouncements] = useState<gs.Announcement[]>([]);
  const [auditLog, setAuditLog] = useState<gs.AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [emps, noms, arrs, exps, expSheets, rets, msgs, anns, logs] = await Promise.all([
        gs.getEmployees(), gs.getNomenclature(), gs.getArrivals(),
        gs.getExpenses(), gs.getExpenseSheets(), gs.getReturns(), gs.getChatMessages(), gs.getAnnouncements(), gs.getAuditLog(),
      ]);
      setEmployees(emps); setNomenclature(noms); setArrivals(arrs);
      setExpenses(exps); setExpenseSheets(expSheets); setReturns(rets); setChatMessages(msgs); setAnnouncements(anns); setAuditLog(logs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return {
    employees, setEmployees, nomenclature, setNomenclature,
    arrivals, setArrivals, expenses, setExpenses, expenseSheets, setExpenseSheets,
    returns, setReturns, chatMessages, setChatMessages, announcements, setAnnouncements,
    auditLog, setAuditLog, loading, error, refresh,
  };
}

type Page = 'dashboard' | 'employees' | 'nomenclature' | 'arrival' | 'expense' | 'balance' | 'archive' | 'chat' | 'reports' | 'audit' | 'settings';

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
    return <ConnectionErrorScreen error={data.error} onRetry={data.refresh} />;
  }

  const menuItems: { id: Page; label: string; icon: string }[] = [
    { id: 'dashboard', label: 'Панель руководителя', icon: '👨‍⚕️' },
    { id: 'employees', label: 'Сотрудники', icon: '👥' },
    { id: 'nomenclature', label: 'Номенклатура', icon: '💊' },
    { id: 'arrival', label: 'Приход к сотруднику', icon: '📥' },
    { id: 'expense', label: 'Расход у сотрудника', icon: '📤' },
    { id: 'balance', label: 'Остаток у сотрудника', icon: '🧰' },
    { id: 'chat', label: 'Сообщения', icon: '💬' },
    { id: 'reports', label: 'Отчёты', icon: '📈' },
    { id: 'audit', label: 'Журнал', icon: '📝' },
    { id: 'archive', label: 'Архив', icon: '🗄️' },
    { id: 'settings', label: 'Настройки', icon: '⚙️' },
  ];

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <Dashboard data={data} />;
      case 'employees': return <EmployeesPage data={data} />;
      case 'nomenclature': return <NomenclaturePage data={data} />;
      case 'arrival': return <ArrivalPage data={data} />;
      case 'expense': return <ExpensePage data={data} />;
      case 'balance': return <BalancePage data={data} />;
      case 'archive': return <ArchivePage data={data} />;
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
