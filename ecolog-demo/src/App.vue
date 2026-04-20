<template>
  <div class="app">
    <!-- Шапка -->
    <header class="header">
      <div class="header-content">
        <h1>🌱 Эколог.Отчёты</h1>
        <p class="subtitle">Офлайн-учёт и автоматическая генерация отчётности</p>
      </div>
    </header>

    <main class="main">
      <!-- Форма добавления -->
      <div class="card form-card">
        <h2>➕ Добавить запись об отходе</h2>
        <div class="form-grid">
          <div class="form-field">
            <label>Наименование отхода *</label>
            <input v-model="newWaste.waste_type" placeholder="Напр. Лом черных металлов" class="input">
          </div>
          
          <div class="form-field">
            <label>Код по ФККО</label>
            <input v-model="newWaste.fkko_code" placeholder="4 31 200 01 99 5" class="input">
          </div>
          
          <div class="form-field">
            <label>Класс опасности</label>
            <select v-model="newWaste.hazard_class" class="input">
              <option value="">Выберите</option>
              <option value="I">I — чрезвычайно опасные</option>
              <option value="II">II — высоко опасные</option>
              <option value="III">III — умеренно опасные</option>
              <option value="IV">IV — мало опасные</option>
              <option value="V">V — практически неопасные</option>
            </select>
          </div>
          
          <div class="form-field">
            <label>Объём, тонн *</label>
            <input type="number" step="0.001" v-model="newWaste.volume" placeholder="0.000" class="input">
          </div>
          
          <div class="form-field">
            <label>Дата образования</label>
            <input type="date" v-model="newWaste.date" class="input">
          </div>
          
          <div class="form-field">
            <label>Место хранения/передачи</label>
            <input v-model="newWaste.storage" placeholder="Площадка Ирокинда" class="input">
          </div>
        </div>
        
        <div class="form-actions">
          <button @click="addWaste" class="btn btn-primary">💾 Сохранить</button>
          <button @click="resetForm" class="btn btn-secondary">Очистить форму</button>
        </div>
      </div>

      <!-- Фильтры -->
      <div class="card filters-card">
        <div class="filters-row">
          <div class="filter-group">
            <label>Фильтр по году:</label>
            <select v-model="filterYear" class="input-small">
              <option :value="null">Все годы</option>
              <option v-for="y in availableYears" :key="y" :value="y">{{ y }}</option>
            </select>
          </div>
          
          <div class="filter-group">
            <label>Класс опасности:</label>
            <select v-model="filterClass" class="input-small">
              <option :value="null">Все классы</option>
              <option value="I">I</option>
              <option value="II">II</option>
              <option value="III">III</option>
              <option value="IV">IV</option>
              <option value="V">V</option>
            </select>
          </div>
          
          <div class="stats">
            Всего: <strong>{{ filteredWastes.length }}</strong> записей,
            объём: <strong>{{ totalVolume.toFixed(3) }}</strong> тонн
          </div>
        </div>
      </div>

      <!-- Таблица данных -->
      <div class="card table-card">
        <div class="table-header">
          <h2>📋 Данные об отходах</h2>
          <button v-if="wastes.length" @click="clearAll" class="btn btn-danger">🗑 Очистить всё</button>
        </div>
        
        <div v-if="filteredWastes.length === 0" class="empty-state">
          <span class="empty-icon">📭</span>
          <p>Нет данных. Добавьте первую запись выше.</p>
        </div>
        
        <div v-else class="table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th>№</th>
                <th>Наименование отхода</th>
                <th>Код ФККО</th>
                <th>Класс</th>
                <th>Объём (тонн)</th>
                <th>Дата</th>
                <th>Место</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(w, idx) in filteredWastes" :key="w.id">
                <td class="center">{{ idx + 1 }}</td>
                <td class="waste-name">{{ w.waste_type }}</td>
                <td class="mono">{{ w.fkko_code || '—' }}</td>
                <td class="center hazard-{{ w.hazard_class }}">{{ w.hazard_class || '—' }}</td>
                <td class="right">{{ w.volume.toFixed(3) }}</td>
                <td class="center">{{ w.date || '—' }}</td>
                <td>{{ w.storage || '—' }}</td>
                <td class="center">
                  <button @click="deleteWaste(w.id)" class="btn-icon" title="Удалить">✖</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Генерация отчётов -->
      <div class="card report-card">
        <h2>📊 Сформировать отчётность</h2>
        <div class="report-grid">
          <div class="report-item">
            <div class="report-icon">📄</div>
            <div class="report-info">
              <h3>2-ТП (отходы)</h3>
              <p>Годовая форма Росстата</p>
            </div>
            <button @click="generate2TPWaste" class="btn btn-report">Сформировать</button>
          </div>
          
          <div class="report-item">
            <div class="report-icon">🌍</div>
            <div class="report-info">
              <h3>4-ОС</h3>
              <p>Охрана окружающей среды</p>
            </div>
            <button @click="generate4OS" class="btn btn-report">Сформировать</button>
          </div>
          
          <div class="report-item">
            <div class="report-icon">💧</div>
            <div class="report-info">
              <h3>Сводка по классам</h3>
              <p>Анализ по классам опасности</p>
            </div>
            <button @click="generateClassSummary" class="btn btn-report">Сформировать</button>
          </div>
        </div>
        <p class="hint">📎 Excel-файл скачается автоматически с автошириной колонок и форматированием</p>
      </div>
      
      <!-- Статус -->
      <div class="status-card">
        <div class="status-item">
          <span class="status-dot green"></span>
          <span>Офлайн-режим</span>
        </div>
        <div class="status-item">
          <span class="status-dot blue"></span>
          <span>Данные в браузере (localStorage)</span>
        </div>
        <div class="status-item">
          <span class="status-dot gray"></span>
          <span>Готово к синхронизации с сервером (в плане)</span>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import * as XLSX from 'xlsx';

// ============== Хранилище ==============
const wastes = ref([]);

// Новая запись
const newWaste = ref({
  waste_type: '',
  fkko_code: '',
  hazard_class: '',
  volume: '',
  date: new Date().toISOString().slice(0, 10),
  storage: ''
});

// Фильтры
const filterYear = ref(null);
const filterClass = ref(null);

// ============== Computed ==============
const availableYears = computed(() => {
  const years = wastes.value.map(w => w.date ? new Date(w.date).getFullYear() : null);
  return [...new Set(years.filter(y => y))].sort((a,b) => b - a);
});

const filteredWastes = computed(() => {
  let result = wastes.value;
  
  if (filterYear.value) {
    result = result.filter(w => w.date && new Date(w.date).getFullYear() === filterYear.value);
  }
  
  if (filterClass.value) {
    result = result.filter(w => w.hazard_class === filterClass.value);
  }
  
  return result;
});

const totalVolume = computed(() => {
  return filteredWastes.value.reduce((sum, w) => sum + w.volume, 0);
});

// ============== CRUD операции ==============
function saveToLocalStorage() {
  localStorage.setItem('ecolog_wastes', JSON.stringify(wastes.value));
}

function loadFromLocalStorage() {
  const saved = localStorage.getItem('ecolog_wastes');
  if (saved) {
    wastes.value = JSON.parse(saved);
  }
}

function addWaste() {
  if (!newWaste.value.waste_type) {
    alert('Заполните наименование отхода');
    return;
  }
  if (!newWaste.value.volume || parseFloat(newWaste.value.volume) <= 0) {
    alert('Введите корректный объём');
    return;
  }
  
  wastes.value.push({
    id: Date.now(),
    waste_type: newWaste.value.waste_type,
    fkko_code: newWaste.value.fkko_code,
    hazard_class: newWaste.value.hazard_class,
    volume: parseFloat(newWaste.value.volume),
    date: newWaste.value.date,
    storage: newWaste.value.storage
  });
  
  saveToLocalStorage();
  resetForm();
}

function resetForm() {
  newWaste.value = {
    waste_type: '',
    fkko_code: '',
    hazard_class: '',
    volume: '',
    date: new Date().toISOString().slice(0, 10),
    storage: ''
  };
}

function deleteWaste(id) {
  wastes.value = wastes.value.filter(w => w.id !== id);
  saveToLocalStorage();
}

function clearAll() {
  if (confirm('Удалить ВСЕ записи? Отменить будет нельзя.')) {
    wastes.value = [];
    saveToLocalStorage();
  }
}

// ============== Генерация отчётов (с форматированием) ==============

// Автоширина и стилизация
function applyStyles(ws, data, headerRowIndex = 3) {
  // 1. Автоширина колонок
  const colWidths = [];
  const maxCols = data[0]?.length || 1;
  
  for (let col = 0; col < maxCols; col++) {
    let maxLen = 12;
    for (let row = 0; row < data.length; row++) {
      let cell = data[row][col];
      let val = '';
      if (cell && typeof cell === 'object' && cell.f) {
        val = cell.f.toString();
      } else if (cell) {
        val = cell.toString();
      }
      maxLen = Math.max(maxLen, val.length);
    }
    colWidths.push({ wch: Math.min(maxLen + 2, 45) });
  }
  ws['!cols'] = colWidths;
  
  // 2. Стиль для заголовков
  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:A1');
  for (let col = range.s.c; col <= range.e.c; col++) {
    const cellAddr = XLSX.utils.encode_cell({ r: headerRowIndex, c: col });
    if (ws[cellAddr]) {
      ws[cellAddr].s = {
        font: { bold: true, sz: 11, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: "2D5A27" } },
        alignment: { horizontal: "center", vertical: "center" }
      };
    }
  }
  
  // 3. Итоговая строка
  const lastRow = data.length - 1;
  for (let col = range.s.c; col <= range.e.c; col++) {
    const cellAddr = XLSX.utils.encode_cell({ r: lastRow, c: col });
    if (ws[cellAddr]) {
      ws[cellAddr].s = {
        font: { bold: true },
        fill: { fgColor: { rgb: "F0F0F0" } }
      };
    }
  }
}

function generate2TPWaste() {
  if (wastes.value.length === 0) {
    alert('Нет данных для отчёта');
    return;
  }
  
  const currentYear = new Date().getFullYear();
  const yearData = wastes.value.filter(w => w.date && new Date(w.date).getFullYear() === currentYear);
  
  if (yearData.length === 0) {
    alert(`Нет данных за ${currentYear} год`);
    return;
  }
  
  // Группировка по типу отхода
  const grouped = {};
  yearData.forEach(w => {
    const key = w.waste_type;
    if (!grouped[key]) {
      grouped[key] = {
        waste_type: w.waste_type,
        fkko_code: w.fkko_code,
        hazard_class: w.hazard_class,
        volume: 0
      };
    }
    grouped[key].volume += w.volume;
  });
  
  const uniqueWastes = Object.values(grouped);
  
  const sheetData = [
    ['ООО "Z-gold" (Ирокинда / Зун-Холба)'],
    [`2-ТП (отходы) за ${currentYear} год`],
    [],
    ['Наименование отхода', 'Код по ФККО', 'Класс опасности', 'Объём, тонн', 'Объём, кг'],
    ...uniqueWastes.map(w => [w.waste_type, w.fkko_code || '—', w.hazard_class || '—', w.volume, { f: `=D${uniqueWastes.indexOf(w) + 5}*1000` }]),
    ['ВСЕГО', '', '', { f: `SUM(D5:D${uniqueWastes.length + 4})` }, { f: `=D${uniqueWastes.length + 5}*1000` }]
  ];
  
  const ws = XLSX.utils.aoa_to_sheet(sheetData);
  
  // Объединение ячеек для шапки
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 4 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 4 } }
  ];
  
  applyStyles(ws, sheetData, 3);
  
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, `2-ТП_${currentYear}`);
  XLSX.writeFile(wb, `2-TP_waste_${currentYear}.xlsx`);
}

function generate4OS() {
  if (wastes.value.length === 0) {
    alert('Нет данных для отчёта');
    return;
  }
  
  const currentYear = new Date().getFullYear();
  const yearData = wastes.value.filter(w => w.date && new Date(w.date).getFullYear() === currentYear);
  const total = yearData.reduce((sum, w) => sum + w.volume, 0);
  
  const byClass = {
    I: yearData.filter(w => w.hazard_class === 'I').reduce((s, w) => s + w.volume, 0),
    II: yearData.filter(w => w.hazard_class === 'II').reduce((s, w) => s + w.volume, 0),
    III: yearData.filter(w => w.hazard_class === 'III').reduce((s, w) => s + w.volume, 0),
    IV: yearData.filter(w => w.hazard_class === 'IV').reduce((s, w) => s + w.volume, 0),
    V: yearData.filter(w => w.hazard_class === 'V').reduce((s, w) => s + w.volume, 0)
  };
  
  const sheetData = [
    ['ООО "Z-gold" (Ирокинда / Зун-Холба)'],
    [`4-ОС за ${currentYear} год`],
    [],
    ['Показатель', 'Значение, тонн'],
    ['Всего образовано отходов', total],
    ['I класс опасности', byClass.I],
    ['II класс опасности', byClass.II],
    ['III класс опасности', byClass.III],
    ['IV класс опасности', byClass.IV],
    ['V класс опасности', byClass.V]
  ];
  
  const ws = XLSX.utils.aoa_to_sheet(sheetData);
  ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 1 } }, { s: { r: 1, c: 0 }, e: { r: 1, c: 1 } }];
  
  const colWidths = [{ wch: 30 }, { wch: 20 }];
  ws['!cols'] = colWidths;
  
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, `4-ОС_${currentYear}`);
  XLSX.writeFile(wb, `4-OS_${currentYear}.xlsx`);
}

function generateClassSummary() {
  if (wastes.value.length === 0) {
    alert('Нет данных для отчёта');
    return;
  }
  
  const byClass = {
    I: wastes.value.filter(w => w.hazard_class === 'I').reduce((s, w) => s + w.volume, 0),
    II: wastes.value.filter(w => w.hazard_class === 'II').reduce((s, w) => s + w.volume, 0),
    III: wastes.value.filter(w => w.hazard_class === 'III').reduce((s, w) => s + w.volume, 0),
    IV: wastes.value.filter(w => w.hazard_class === 'IV').reduce((s, w) => s + w.volume, 0),
    V: wastes.value.filter(w => w.hazard_class === 'V').reduce((s, w) => s + w.volume, 0)
  };
  
  const total = Object.values(byClass).reduce((s, v) => s + v, 0);
  
  const sheetData = [
    ['Сводка по классам опасности отходов'],
    [`Всего: ${total.toFixed(3)} тонн`],
    [],
    ['Класс опасности', 'Объём, тонн', 'Доля, %'],
    ['I', byClass.I, total > 0 ? ((byClass.I / total) * 100).toFixed(1) : 0],
    ['II', byClass.II, total > 0 ? ((byClass.II / total) * 100).toFixed(1) : 0],
    ['III', byClass.III, total > 0 ? ((byClass.III / total) * 100).toFixed(1) : 0],
    ['IV', byClass.IV, total > 0 ? ((byClass.IV / total) * 100).toFixed(1) : 0],
    ['V', byClass.V, total > 0 ? ((byClass.V / total) * 100).toFixed(1) : 0],
    [],
    ['ИТОГО', total, '100']
  ];
  
  const ws = XLSX.utils.aoa_to_sheet(sheetData);
  ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 2 } }];
  
  const colWidths = [{ wch: 20 }, { wch: 20 }, { wch: 15 }];
  ws['!cols'] = colWidths;
  
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Сводка по классам');
  XLSX.writeFile(wb, `waste_class_summary_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

onMounted(() => {
  loadFromLocalStorage();
});
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  background: #f0f4f0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.app {
  min-height: 100vh;
}

.header {
  background: linear-gradient(135deg, #1a4a1a 0%, #2d6a2d 100%);
  color: white;
  padding: 30px 20px;
}

.header-content {
  max-width: 1400px;
  margin: 0 auto;
}

.header h1 {
  font-size: 32px;
  margin-bottom: 8px;
}

.subtitle {
  opacity: 0.9;
  font-size: 16px;
}

.main {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
}

.card {
  background: white;
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.card h2 {
  font-size: 20px;
  margin-bottom: 20px;
  color: #2d5a27;
  border-left: 4px solid #2d5a27;
  padding-left: 12px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-field label {
  font-size: 13px;
  font-weight: 500;
  color: #555;
}

.input, .input-small {
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
  transition: border-color 0.2s;
}

.input:focus, .input-small:focus {
  outline: none;
  border-color: #2d5a27;
}

.input-small {
  width: 150px;
}

.form-actions {
  display: flex;
  gap: 12px;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: #2d5a27;
  color: white;
}

.btn-primary:hover {
  background: #1e401a;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background: #5a6268;
}

.btn-danger {
  background: #dc3545;
  color: white;
}

.btn-danger:hover {
  background: #c82333;
}

.btn-report {
  background: #0d6efd;
  color: white;
  padding: 8px 16px;
  font-size: 13px;
}

.btn-report:hover {
  background: #0b5ed7;
}

.btn-icon {
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  color: #999;
  transition: color 0.2s;
}

.btn-icon:hover {
  color: #dc3545;
}

.filters-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 24px;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 10px;
}

.filter-group label {
  font-size: 14px;
  font-weight: 500;
}

.stats {
  font-size: 14px;
  color: #555;
  margin-left: auto;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.table-wrapper {
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.data-table th {
  background: #f5f5f5;
  padding: 12px;
  text-align: left;
  font-weight: 600;
  border-bottom: 2px solid #ddd;
}

.data-table td {
  padding: 10px 12px;
  border-bottom: 1px solid #eee;
}

.data-table tr:hover {
  background: #f9f9f9;
}

.waste-name {
  max-width: 250px;
  white-space: normal;
  word-break: break-word;
}

.center {
  text-align: center;
}

.right {
  text-align: right;
}

.mono {
  font-family: monospace;
  font-size: 12px;
}

.empty-state {
  text-align: center;
  padding: 60px;
  color: #999;
}

.empty-icon {
  font-size: 48px;
  display: block;
  margin-bottom: 16px;
}

.report-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
  margin-bottom: 16px;
}

.report-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 12px;
  transition: background 0.2s;
}

.report-item:hover {
  background: #e9ecef;
}

.report-icon {
  font-size: 32px;
}

.report-info {
  flex: 1;
}

.report-info h3 {
  font-size: 16px;
  margin-bottom: 4px;
}

.report-info p {
  font-size: 12px;
  color: #666;
}

.hint {
  font-size: 12px;
  color: #666;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #eee;
}

.status-card {
  background: #e8f5e9;
  border-radius: 12px;
  padding: 16px 20px;
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 16px;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}

.status-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  display: inline-block;
}

.status-dot.green {
  background: #28a745;
}

.status-dot.blue {
  background: #17a2b8;
}

.status-dot.gray {
  background: #6c757d;
}
</style>