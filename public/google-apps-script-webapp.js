/**
 * Google Apps Script для системы учёта сотрудников
 * Версия с полной поддержкой удаления сотрудников
 * 
 * ИНСТРУКЦИЯ ПО УСТАНОВКЕ:
 * 1. Откройте Google Sheets
 * 2. Расширения → Apps Script
 * 3. Удалите весь старый код
 * 4. Вставьте этот код
 * 5. Сохраните (Ctrl+S)
 * 6. Разверните → Новое развертывание
 * 7. Тип: Веб-приложение
 * 8. Выполнять от имени: Меня
 * 9. Доступ: Все
 * 10. Разверните и скопируйте URL
 */

// ==================== ОБРАБОТКА ЗАПРОСОВ ====================

function doGet(e) {
  try {
    const action = e.parameter.action;
    
    switch(action) {
      case 'test':
        return jsonResponse({ 
          success: true, 
          title: SpreadsheetApp.getActiveSpreadsheet().getName(),
          sheets: SpreadsheetApp.getActiveSpreadsheet().getSheets().map(s => s.getName())
        });
      case 'getEmployees':
        return jsonResponse(getEmployeesData());
      case 'getNomenclature':
        return jsonResponse(getNomenclatureData());
      case 'getPrices':
        return jsonResponse(getPricesData());
      case 'getArrivals':
        return jsonResponse(getArrivalsData());
      case 'getExpenses':
        return jsonResponse(getExpensesData());
      case 'getReturns':
        return jsonResponse(getReturnsData());
      case 'getChat':
        return jsonResponse(getChatData());
      case 'getAuditLog':
        return jsonResponse(getAuditLogData());
      default:
        return jsonResponse({ error: 'Неизвестное действие GET: ' + action });
    }
  } catch (error) {
    return jsonResponse({ error: error.toString() });
  }
}

function doPost(e) {
  try {
    Logger.log('doPost получен: ' + e.postData.contents);
    const data = JSON.parse(e.postData.contents);
    const action = data.action;
    Logger.log('Действие: ' + action);
    
    switch(action) {
      case 'addEmployee':
        addEmployeeRow(data.data);
        return jsonResponse({ success: true });
      case 'updateEmployee':
        updateEmployeeRow(data.id, data.data);
        return jsonResponse({ success: true });
      case 'deleteEmployee':
        Logger.log('Вызываем deleteEmployeeRow для ID: ' + data.id);
        deleteEmployeeRow(data.id);
        Logger.log('deleteEmployeeRow выполнен успешно');
        return jsonResponse({ success: true });
      case 'addArrival':
        addArrivalRow(data.data);
        return jsonResponse({ success: true });
      case 'addExpense':
        addExpenseRow(data.data);
        return jsonResponse({ success: true });
      case 'addReturn':
        addReturnRow(data.data);
        return jsonResponse({ success: true });
      case 'addChatMessage':
        addChatMessageRow(data.data);
        return jsonResponse({ success: true });
      case 'addAuditLog':
        addAuditLogRow(data.data);
        return jsonResponse({ success: true });
      case 'updateNomenclature':
        updateNomenclatureRow(data.data);
        return jsonResponse({ success: true });
      case 'setupDatabase':
        setupDatabase();
        return jsonResponse({ success: true, message: 'База данных создана' });
      default:
        return jsonResponse({ error: 'Неизвестное действие: ' + action });
    }
  } catch (error) {
    Logger.log('Ошибка в doPost: ' + error.toString());
    return jsonResponse({ error: error.toString() });
  }
}

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// ==================== ЧТЕНИЕ ДАННЫХ ====================

function readSheetData(sheetName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];
  
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];
  
  const headers = data[0];
  return data.slice(1).filter(row => row[0] !== '').map(row => {
    const obj = {};
    headers.forEach((h, i) => {
      const val = row[i];
      obj[h] = val instanceof Date ? val.toISOString() : (val || '');
    });
    return obj;
  });
}

function getEmployeesData() {
  const data = readSheetData('Сотрудники');
  return data.map(row => ({
    ...row,
    'Пароль': row['Пароль (хэш)'] || ''
  }));
}

function getNomenclatureData() { return readSheetData('Номенклатура'); }
function getPricesData() { return readSheetData('Цены'); }
function getArrivalsData() { return readSheetData('Приход'); }
function getExpensesData() { return readSheetData('Расход'); }
function getReturnsData() { return readSheetData('Возвраты'); }
function getChatData() { return readSheetData('Чат'); }
function getAuditLogData() { return readSheetData('Журнал изменений'); }

// ==================== ЗАПИСЬ ДАННЫХ ====================

function addEmployeeRow(data) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Сотрудники');
  sheet.appendRow([
    data.id || '',
    data.personalNumber || '',
    data.fullName || '',
    data.password || data.passwordHash || '',
    data.status || 'Активен',
    data.position || '',
    data.hireDate || new Date(),
    data.fireDate || '',
    data.blocked ? 'ДА' : 'НЕТ',
    data.phone || '',
    data.email || '',
    new Date(),
    '',
    data.note || ''
  ]);
  writeAudit('Сотрудники', data.id, 'Создание', '', 'Сотрудник: ' + data.fullName);
}

function updateEmployeeRow(id, data) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Сотрудники');
  const allData = sheet.getDataRange().getValues();
  
  for (let i = 1; i < allData.length; i++) {
    if (allData[i][0] === id) {
      if (data.status !== undefined) sheet.getRange(i + 1, 5).setValue(data.status);
      if (data.blocked !== undefined) sheet.getRange(i + 1, 9).setValue(data.blocked ? 'ДА' : 'НЕТ');
      if (data.note !== undefined) sheet.getRange(i + 1, 14).setValue(data.note);
      if (data.personalNumber !== undefined) sheet.getRange(i + 1, 2).setValue(data.personalNumber);
      if (data.fullName !== undefined) sheet.getRange(i + 1, 3).setValue(data.fullName);
      if (data.position !== undefined) sheet.getRange(i + 1, 6).setValue(data.position);
      if (data.phone !== undefined) sheet.getRange(i + 1, 10).setValue(data.phone);
      break;
    }
  }
  
  writeAudit('Сотрудники', id, 'Изменение', '', JSON.stringify(data));
}

function deleteEmployeeRow(id) {
  Logger.log('deleteEmployeeRow вызван для ID: ' + id);
  
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Сотрудники');
  if (!sheet) {
    Logger.log('Лист "Сотрудники" не найден!');
    throw new Error('Лист "Сотрудники" не найден');
  }
  
  const allData = sheet.getDataRange().getValues();
  Logger.log('Всего строк в таблице: ' + allData.length);
  
  let found = false;
  for (let i = 1; i < allData.length; i++) {
    Logger.log('Проверяем строку ' + i + ': ID=' + allData[i][0] + ', ищем=' + id);
    if (String(allData[i][0]) === String(id)) {
      Logger.log('Найдена строка для удаления: ' + i);
      const employeeName = allData[i][2];
      sheet.deleteRow(i + 1);
      writeAudit('Сотрудники', id, 'Удаление', 'Сотрудник: ' + employeeName, '');
      Logger.log('Строка удалена успешно');
      found = true;
      break;
    }
  }
  
  if (!found) {
    Logger.log('Сотрудник с ID ' + id + ' не найден в таблице!');
    throw new Error('Сотрудник с ID ' + id + ' не найден');
  }
}

function addArrivalRow(data) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Приход');
  sheet.appendRow([
    data.id || '',
    data.employeeId || '',
    data.employeeName || '',
    data.date || new Date(),
    data.month || '',
    data.amount || 0,
    data.shifts || 0,
    data.addedBy || 'Руководитель',
    data.type || 'Плановый',
    data.comment || '',
    new Date()
  ]);
  writeAudit('Приход', data.id, 'Создание', '', 'Приход: ' + data.amount + '₽');
}

function addExpenseRow(data) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Расход');
  sheet.appendRow([
    data.id || '',
    data.employeeId || '',
    data.employeeName || '',
    new Date(),
    data.callDate || '',
    data.month || '',
    data.nomenclatureId || '',
    data.nomenclatureName || '',
    data.quantity || 0,
    data.unit || '',
    data.patientName || '',
    data.patientBirthDate || '',
    data.callId || '',
    'ДА',
    data.localTime || new Date(),
    'НЕТ',
    data.note || ''
  ]);
  writeAudit('Расход', data.id, 'Создание', '', 'Расход: ' + data.quantity + ' ' + data.nomenclatureName);
}

function addReturnRow(data) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Возвраты');
  sheet.appendRow([
    data.id || '',
    data.employeeId || '',
    data.employeeName || '',
    new Date(),
    data.month || '',
    data.nomenclatureId || '',
    data.nomenclatureName || '',
    data.quantity || 0,
    data.unit || '',
    data.status || 'Новый',
    data.correctedBy || '',
    data.correctedQuantity || '',
    '',
    data.comment || '',
    data.reason || ''
  ]);
  writeAudit('Возвраты', data.id, 'Создание', '', 'Возврат: ' + data.quantity);
}

function addChatMessageRow(data) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Чат');
  sheet.appendRow([
    data.id || '',
    data.fromId || '',
    data.fromName || '',
    data.toId || '',
    data.toName || '',
    data.role || 'Руководитель',
    data.text || '',
    new Date(),
    'НЕТ',
    data.type || 'Личное',
    data.priority || 'Обычное'
  ]);
}

function addAuditLogRow(data) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Журнал изменений');
  sheet.appendRow([
    data.id || 'LOG-' + Utilities.getUuid().substring(0, 8),
    new Date(),
    data.userId || '',
    data.userName || '',
    data.role || '',
    data.sheet || '',
    data.recordId || '',
    data.action || '',
    data.field || '',
    data.oldValue || '',
    data.newValue || '',
    data.ip || '',
    data.device || ''
  ]);
}

function updateNomenclatureRow(data) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Номенклатура');
  const allData = sheet.getDataRange().getValues();
  
  for (let i = 1; i < allData.length; i++) {
    if (allData[i][0] === data.id) {
      if (data.name !== undefined) sheet.getRange(i + 1, 2).setValue(data.name);
      if (data.category !== undefined) sheet.getRange(i + 1, 3).setValue(data.category);
      if (data.unit !== undefined) sheet.getRange(i + 1, 4).setValue(data.unit);
      if (data.manufacturer !== undefined) sheet.getRange(i + 1, 5).setValue(data.manufacturer);
      if (data.active !== undefined) sheet.getRange(i + 1, 7).setValue(data.active ? 'ДА' : 'НЕТ');
      break;
    }
  }
  
  if (data.currentPrice !== undefined) {
    const pricesSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Цены');
    const pricesData = pricesSheet.getDataRange().getValues();
    
    for (let i = 1; i < pricesData.length; i++) {
      if (pricesData[i][1] === data.id && (!pricesData[i][5] || pricesData[i][5] === '')) {
        pricesSheet.getRange(i + 1, 6).setValue(new Date());
        break;
      }
    }
    
    const nomData = readSheetData('Номенклатура');
    const nom = nomData.find(n => n['ID'] === data.id);
    pricesSheet.appendRow([
      'PRC-' + Utilities.getUuid().substring(0, 8).toUpperCase(),
      data.id,
      nom ? nom['Название'] : '',
      data.currentPrice,
      new Date(),
      '',
      data.changedBy || 'Руководитель',
      new Date(),
      data.comment || ''
    ]);
  }
  
  writeAudit('Номенклатура', data.id, 'Изменение', '', JSON.stringify(data));
}

// ==================== ЖУРНАЛ ====================

function writeAudit(sheetName, recordId, action, oldValue, newValue) {
  try {
    const logSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Журнал изменений');
    logSheet.appendRow([
      'LOG-' + Utilities.getUuid().substring(0, 8).toUpperCase(),
      new Date(),
      'MGR',
      'Руководитель',
      'Руководитель',
      sheetName,
      recordId,
      action,
      '',
      oldValue,
      newValue,
      '',
      ''
    ]);
  } catch(e) {
    Logger.log('Ошибка записи в журнал: ' + e.toString());
  }
}

// ==================== СОЗДАНИЕ БАЗЫ ДАННЫХ ====================

function setupDatabase() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const defaultSheet = ss.getSheetByName('Sheet1') || ss.getSheetByName('Лист1');
  
  createSheet_Employees(ss);
  createSheet_Nomenclature(ss);
  createSheet_Prices(ss);
  createSheet_Arrival(ss);
  createSheet_Expenses(ss);
  createSheet_Returns(ss);
  createSheet_InitialStock(ss);
  createSheet_Chat(ss);
  createSheet_AuditLog(ss);
  createSheet_Settings(ss);
  createSheet_Reports(ss);
  
  if (defaultSheet && ss.getSheets().length > 1) {
    ss.deleteSheet(defaultSheet);
  }
  
  return 'База данных успешно создана!';
}

function formatHeader(sheet, columnsCount) {
  const headerRange = sheet.getRange(1, 1, 1, columnsCount);
  headerRange.setBackground('#1a73e8');
  headerRange.setFontColor('#ffffff');
  headerRange.setFontWeight('bold');
  headerRange.setHorizontalAlignment('center');
  headerRange.setWrap(true);
  sheet.setRowHeight(1, 35);
  sheet.setFrozenRows(1);
}

function createSheet_Employees(ss) {
  let sheet = ss.getSheetByName('Сотрудники');
  if (!sheet) sheet = ss.insertSheet('Сотрудники');
  
  const headers = ['ID', 'Персональный номер', 'ФИО', 'Пароль (хэш)', 'Статус', 'Должность', 'Дата найма', 'Дата увольнения', 'Заблокирован', 'Телефон', 'Email', 'Дата регистрации', 'Последний вход', 'Примечание'];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  formatHeader(sheet, headers.length);
  
  sheet.setColumnWidth(3, 250);
  sheet.setColumnWidth(6, 150);
  sheet.setColumnWidth(10, 150);
  
  const statusRule = SpreadsheetApp.newDataValidation().requireValueInList(['Активен', 'Неактивен', 'Отпуск', 'Уволен']).build();
  sheet.getRange('E2:E1000').setDataValidation(statusRule);
  
  const boolRule = SpreadsheetApp.newDataValidation().requireValueInList(['ДА', 'НЕТ']).build();
  sheet.getRange('I2:I1000').setDataValidation(boolRule);
}

function createSheet_Nomenclature(ss) {
  let sheet = ss.getSheetByName('Номенклатура');
  if (!sheet) sheet = ss.insertSheet('Номенклатура');
  
  const headers = ['ID', 'Название', 'Категория', 'Ед. измерения', 'Производитель', 'Штрих-код', 'Актуальна', 'Дата создания', 'Примечание'];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  formatHeader(sheet, headers.length);
  
  sheet.setColumnWidth(2, 300);
  
  const categoryRule = SpreadsheetApp.newDataValidation().requireValueInList(['Лекарство', 'Оборудование', 'Расходный материал']).build();
  sheet.getRange('C2:C1000').setDataValidation(categoryRule);
  
  const unitRule = SpreadsheetApp.newDataValidation().requireValueInList(['Ампулы', 'Таблетки', 'Флаконы', 'Штуки', 'Упаковки']).build();
  sheet.getRange('D2:D1000').setDataValidation(unitRule);
}

function createSheet_Prices(ss) {
  let sheet = ss.getSheetByName('Цены');
  if (!sheet) sheet = ss.insertSheet('Цены');
  
  const headers = ['ID', 'Номенклатура_ID', 'Название', 'Цена за ед. (₽)', 'Дата начала', 'Дата окончания', 'Кем изменено', 'Дата изменения', 'Примечание'];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  formatHeader(sheet, headers.length);
  
  sheet.setColumnWidth(3, 300);
  sheet.getRange('D2:D10000').setNumberFormat('#,##0.00');
}

function createSheet_Arrival(ss) {
  let sheet = ss.getSheetByName('Приход');
  if (!sheet) sheet = ss.insertSheet('Приход');
  
  const headers = ['ID', 'Сотрудник_ID', 'ФИО сотрудника', 'Дата', 'Месяц', 'Сумма (₽)', 'Количество смен', 'Кем внесено', 'Тип', 'Комментарий', 'Дата внесения'];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  formatHeader(sheet, headers.length);
  
  sheet.setColumnWidth(3, 250);
  sheet.getRange('F2:F10000').setNumberFormat('#,##0.00');
}

function createSheet_Expenses(ss) {
  let sheet = ss.getSheetByName('Расход');
  if (!sheet) sheet = ss.insertSheet('Расход');
  
  const headers = ['ID', 'Сотрудник_ID', 'ФИО сотрудника', 'Дата внесения', 'Дата вызова', 'Месяц', 'Номенклатура_ID', 'Название', 'Количество', 'Ед. изм.', 'Пациент ФИО', 'Пациент ДР', 'Вызов_ID', 'Синхр.', 'Локальное время', 'Отредакт.', 'Примечание'];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  formatHeader(sheet, headers.length);
  
  sheet.setColumnWidth(3, 250);
  sheet.setColumnWidth(8, 300);
  sheet.setColumnWidth(11, 250);
}

function createSheet_Returns(ss) {
  let sheet = ss.getSheetByName('Возвраты');
  if (!sheet) sheet = ss.insertSheet('Возвраты');
  
  const headers = ['ID', 'Сотрудник_ID', 'ФИО сотрудника', 'Дата создания', 'Месяц', 'Номенклатура_ID', 'Название', 'Количество', 'Ед. изм.', 'Статус', 'Кем скорр.', 'Скорр. кол-во', 'Дата обработки', 'Комментарий', 'Причина'];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  formatHeader(sheet, headers.length);
  
  sheet.setColumnWidth(3, 250);
  sheet.setColumnWidth(7, 300);
  
  const statusRule = SpreadsheetApp.newDataValidation().requireValueInList(['Новый', 'Принят', 'Отклонён', 'Скорректирован']).build();
  sheet.getRange('J2:J10000').setDataValidation(statusRule);
}

function createSheet_InitialStock(ss) {
  let sheet = ss.getSheetByName('Начальные остатки');
  if (!sheet) sheet = ss.insertSheet('Начальные остатки');
  
  const headers = ['ID', 'Сотрудник_ID', 'ФИО', 'Номенклатура_ID', 'Название', 'Количество', 'Ед. изм.', 'Дата', 'Кем внесено', 'Период', 'Примечание'];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  formatHeader(sheet, headers.length);
}

function createSheet_Chat(ss) {
  let sheet = ss.getSheetByName('Чат');
  if (!sheet) sheet = ss.insertSheet('Чат');
  
  const headers = ['ID', 'От кого (ID)', 'От кого (ФИО)', 'Кому (ID)', 'Кому (ФИО)', 'Роль', 'Текст', 'Дата и время', 'Прочитано', 'Тип', 'Приоритет'];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  formatHeader(sheet, headers.length);
  
  sheet.setColumnWidth(7, 400);
}

function createSheet_AuditLog(ss) {
  let sheet = ss.getSheetByName('Журнал изменений');
  if (!sheet) sheet = ss.insertSheet('Журнал изменений');
  
  const headers = ['ID', 'Дата и время', 'Пользователь ID', 'Пользователь ФИО', 'Роль', 'Лист', 'Запись_ID', 'Действие', 'Поле', 'Было', 'Стало', 'IP', 'Устройство'];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  formatHeader(sheet, headers.length);
  
  sheet.setColumnWidth(10, 200);
  sheet.setColumnWidth(11, 200);
}

function createSheet_Settings(ss) {
  let sheet = ss.getSheetByName('Настройки');
  if (!sheet) sheet = ss.insertSheet('Настройки');
  
  const headers = ['Параметр', 'Значение', 'Описание', 'Кем изменено', 'Дата'];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  formatHeader(sheet, headers.length);
  
  const settings = [
    ['Название подразделения', 'Выездное подразделение №1', '', 'SYSTEM', new Date()],
    ['Версия системы', '2.0.0', '', 'SYSTEM', new Date()],
  ];
  sheet.getRange(2, 1, settings.length, headers.length).setValues(settings);
}

function createSheet_Reports(ss) {
  let sheet = ss.getSheetByName('Отчёты');
  if (!sheet) sheet = ss.insertSheet('Отчёты');
  
  const headers = ['ID', 'Тип', 'Период', 'Дата', 'Сотрудник_ID', 'ФИО', 'Вызовы', 'Приход (₽)', 'Расход (₽)', 'Остаток (₽)', 'Общий остаток (₽)', 'Статус', 'Кем сформ.', 'Примечание'];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  formatHeader(sheet, headers.length);
}
