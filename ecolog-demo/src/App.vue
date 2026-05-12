<template>
  <div class="app">
    <header class="header">
      <div class="container">
        <h1>Эколог.Отчёты</h1>
        <p class="subtitle">Учёт отходов и автоматическая отчётность</p>
      </div>
    </header>

    <main class="main container">
      <section class="offline-warning">
        <div class="offline-icon">⚠️</div>
        <div class="offline-text">
          <strong>ШАХТА / КАРЬЕР — ИНТЕРНЕТ НЕ НУЖЕН</strong>
          Чтобы приложение работало без сети — <strong>добавьте его на главный экран</strong> телефона.<br>
          <small>Нажмите «Поделиться» → «На экран «Домой»» (10 секунд).</small>
        </div>
      </section>

      <!-- Карточка предприятия (ДЕМО) -->
      <section class="section company-card">
        <div class="company-header" @click="showCompany = !showCompany">
          <div class="company-title">
            <span class="company-badge">ДЕМО</span>
            <h2>🏢 Реквизиты предприятия</h2>
          </div>
          <button class="btn-icon toggle-btn">{{ showCompany ? '▼' : '▶' }}</button>
        </div>
        <div v-if="showCompany" class="company-content">
          <div class="company-grid">
            <div class="company-field">
              <label>ИНН</label>
              <div class="field-value">0323123456</div>
            </div>
            <div class="company-field">
              <label>ОГРН</label>
              <div class="field-value">1020304050607</div>
            </div>
            <div class="company-field">
              <label>КПП</label>
              <div class="field-value">032301001</div>
            </div>
            <div class="company-field">
              <label>Краткое наименование</label>
              <div class="field-value">ООО "Z-gold"</div>
            </div>
            <div class="company-field full-width">
              <label>Полное наименование</label>
              <div class="field-value">Общество с ограниченной ответственностью "Z-gold"</div>
            </div>
            <div class="company-field">
              <label>ОКПО</label>
              <div class="field-value">12345678</div>
            </div>
            <div class="company-field">
              <label>ОКТМО</label>
              <div class="field-value">81623456</div>
            </div>
            <div class="company-field full-width">
              <label>Юридический адрес</label>
              <div class="field-value">670000, Республика Бурятия, г. Улан-Удэ, ул. Ленина, д. 1</div>
            </div>
            <div class="company-field full-width">
              <label>Объект НВОС</label>
              <div class="field-value">Ирокинда (золотодобыча), код 03-0123-001234, I категория</div>
            </div>
          </div>
          <button class="edit-company-btn" disabled>✎ Редактировать (в разработке)</button>
        </div>
      </section>

      <!-- Форма добавления -->
      <section class="section">
        <div class="section-header">
          <h2>Новая запись</h2>
        </div>
        <div class="form-grid">
          <div class="field">
            <label>Наименование отхода</label>
            <input v-model="newWaste.waste_type" type="text" placeholder="Например: Лом черных металлов" />
          </div>
          <div class="field">
            <label>Код ФККО</label>
            <input v-model="newWaste.fkko_code" type="text" placeholder="4 31 200 01 99 5" />
          </div>
          <div class="field">
            <label>Класс опасности</label>
            <select v-model="newWaste.hazard_class">
              <option value="">—</option>
              <option value="I">I</option>
              <option value="II">II</option>
              <option value="III">III</option>
              <option value="IV">IV</option>
              <option value="V">V</option>
            </select>
          </div>
          <div class="field">
            <label>Объём, тонн</label>
            <input v-model="newWaste.volume" type="number" step="0.001" placeholder="0.000" />
          </div>
          <div class="field">
            <label>Дата</label>
            <input v-model="newWaste.date" type="date" />
          </div>
          <div class="field">
            <label>Место хранения</label>
            <input v-model="newWaste.storage" type="text" placeholder="Площадка Ирокинда" />
          </div>
        </div>
        <div class="form-actions">
          <button @click="addWaste" class="btn-primary">Сохранить</button>
          <button @click="resetForm" class="btn-secondary">Очистить</button>
        </div>
      </section>

      <!-- Фильтры -->
      <section class="section">
        <div class="filter-bar">
          <div class="filter-group">
            <label>Год</label>
            <select v-model="filterYear">
              <option :value="null">Все</option>
              <option v-for="y in availableYears" :key="y" :value="y">{{ y }}</option>
            </select>
          </div>
          <div class="filter-group">
            <label>Класс</label>
            <select v-model="filterClass">
              <option :value="null">Все</option>
              <option value="I">I</option>
              <option value="II">II</option>
              <option value="III">III</option>
              <option value="IV">IV</option>
              <option value="V">V</option>
            </select>
          </div>
          <div class="stats">
            <span>{{ filteredWastes.length }} записей</span>
            <span>{{ totalVolume.toFixed(3) }} т</span>
          </div>
          <button v-if="wastes.length" @click="clearAll" class="btn-outline">Очистить всё</button>
        </div>
      </section>

      <!-- Таблица -->
      <section class="section">
        <div class="table-wrapper">
          <table v-if="filteredWastes.length" class="table">
            <thead>
              <tr>
                <th>№</th>
                <th>Наименование отхода</th>
                <th>ФККО</th>
                <th>Кл.</th>
                <th>Объём, т</th>
                <th>Дата</th>
                <th>Место</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(w, idx) in filteredWastes" :key="w.id">
                <td class="num">{{ idx + 1 }}</td>
                <td>{{ w.waste_type }}</td>
                <td class="mono">{{ w.fkko_code || '—' }}</td>
                <td class="center">{{ w.hazard_class || '—' }}</td>
                <td class="num">{{ w.volume.toFixed(3) }}</td>
                <td class="center">{{ w.date || '—' }}</td>
                <td class="center">{{ w.storage || '—' }}</td>
                <td class="actions">
                  <button @click="deleteWaste(w.id)" class="btn-icon">✕</button>
                </td>
              </tr>
            </tbody>
          </table>
          <div v-else class="empty">
            <p>Нет данных. Добавьте первую запись.</p>
          </div>
        </div>
      </section>

      <!-- Отчёты -->
      <section class="section">
        <div class="section-header">
          <h2>Отчёты</h2>
        </div>
        <div class="reports">
          <button @click="generate2TPWaste" class="btn-report">2-ТП (отходы)</button>
          <button @click="generate4OS" class="btn-report">4-ОС</button>
          <button @click="generateClassSummary" class="btn-report">Сводка по классам</button>
        </div>
        <p class="hint">Excel скачается автоматически</p>
      </section>

      <!-- Статус -->
      <div class="status">
        <span>● Офлайн-режим</span>
        <span>● Данные в браузере</span>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import * as XLSX from 'xlsx';

// ========== Состояние ==========
const wastes = ref([]);
const showCompany = ref(true); // Показываем карточку по умолчанию

const newWaste = ref({
  waste_type: '',
  fkko_code: '',
  hazard_class: '',
  volume: '',
  date: new Date().toISOString().slice(0, 10),
  storage: ''
});

const filterYear = ref(null);
const filterClass = ref(null);

// ========== Computed ==========
const availableYears = computed(() => {
  const years = wastes.value.map(w => w.date ? new Date(w.date).getFullYear() : null);
  return [...new Set(years.filter(y => y))].sort((a, b) => b - a);
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
  return filteredWastes.value.reduce((s, w) => s + w.volume, 0);
});

// ========== CRUD ==========
function saveToLocalStorage() {
  localStorage.setItem('ecolog_wastes', JSON.stringify(wastes.value));
}

function loadFromLocalStorage() {
  const saved = localStorage.getItem('ecolog_wastes');
  if (saved) wastes.value = JSON.parse(saved);
}

function addWaste() {
  if (!newWaste.value.waste_type || !newWaste.value.volume) {
    alert('Заполните наименование и объём');
    return;
  }
  wastes.value.push({
    id: Date.now(),
    ...newWaste.value,
    volume: parseFloat(newWaste.value.volume)
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
  if (confirm('Удалить все записи?')) {
    wastes.value = [];
    saveToLocalStorage();
  }
}

// ========== Генерация отчётов ==========
function generate2TPWaste() {
  if (!wastes.value.length) return alert('Нет данных');
  const data = [['Наименование', 'ФККО', 'Класс', 'Объём, т'], ...wastes.value.map(w => [w.waste_type, w.fkko_code || '—', w.hazard_class || '—', w.volume])];
  data.push(['ИТОГО', '', '', { f: `SUM(D2:D${wastes.value.length + 1})` }]);
  const ws = XLSX.utils.aoa_to_sheet(data);
  ws['!cols'] = [{ wch: 35 }, { wch: 20 }, { wch: 10 }, { wch: 15 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '2-ТП');
  XLSX.writeFile(wb, `2-TP_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

function generate4OS() {
  if (!wastes.value.length) return alert('Нет данных');
  const total = wastes.value.reduce((s, w) => s + w.volume, 0);
  const data = [['Показатель', 'Объём, т'], ['Всего отходов', total], ['I класс', wastes.value.filter(w => w.hazard_class === 'I').reduce((s, w) => s + w.volume, 0)], ['II класс', wastes.value.filter(w => w.hazard_class === 'II').reduce((s, w) => s + w.volume, 0)], ['III класс', wastes.value.filter(w => w.hazard_class === 'III').reduce((s, w) => s + w.volume, 0)], ['IV класс', wastes.value.filter(w => w.hazard_class === 'IV').reduce((s, w) => s + w.volume, 0)], ['V класс', wastes.value.filter(w => w.hazard_class === 'V').reduce((s, w) => s + w.volume, 0)]];
  const ws = XLSX.utils.aoa_to_sheet(data);
  ws['!cols'] = [{ wch: 25 }, { wch: 15 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '4-ОС');
  XLSX.writeFile(wb, `4-OS_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

function generateClassSummary() {
  if (!wastes.value.length) return alert('Нет данных');
  const classes = { I: 0, II: 0, III: 0, IV: 0, V: 0 };
  wastes.value.forEach(w => { if (w.hazard_class) classes[w.hazard_class] += w.volume; });
  const total = Object.values(classes).reduce((s, v) => s + v, 0);
  const data = [['Класс', 'Объём, т', 'Доля, %'], ...Object.entries(classes).map(([c, v]) => [c, v, total ? ((v / total) * 100).toFixed(1) : 0]), ['ИТОГО', total, '100']];
  const ws = XLSX.utils.aoa_to_sheet(data);
  ws['!cols'] = [{ wch: 12 }, { wch: 15 }, { wch: 12 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Сводка');
  XLSX.writeFile(wb, `summary_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

onMounted(loadFromLocalStorage);
</script>

<style>
/* Все стили остаются без изменений, кроме новых добавленных */

/* Карточка предприятия */
.company-card {
  background: #fef9e6;
  border-left: 4px solid #e6a017;
}

.company-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
}

.company-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.company-badge {
  background: #e6a017;
  color: white;
  font-size: 10px;
  font-weight: bold;
  padding: 2px 8px;
  border-radius: 20px;
  letter-spacing: 0.5px;
}

.company-content {
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid #ffe0a3;
}

.company-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}

.company-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.company-field.full-width {
  grid-column: span 2;
}

.company-field label {
  font-size: 11px;
  font-weight: 600;
  color: #8a6e2c;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.company-field value {
  font-size: 14px;
  color: #1e2a36;
  font-weight: 500;
}

.edit-company-btn {
  background: transparent;
  border: 1px solid #e6a017;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12px;
  color: #e6a017;
}

.edit-company-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.toggle-btn {
  background: none;
  border: none;
  font-size: 14px;
  color: #8a9aa8;
  padding: 4px 8px;
}

.toggle-btn:hover {
  color: #1e2a36;
}

/* Остальные стили остаются без изменений */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  background: #eef2f5;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  color: #1a2a3a;
  line-height: 1.4;
}

.container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 20px;
}

.header {
  background: #1e2a36;
  color: white;
  padding: 28px 0;
  border-bottom: 1px solid #2d3e4c;
}

.header h1 {
  font-size: 24px;
  font-weight: 500;
  letter-spacing: -0.2px;
  margin-bottom: 4px;
}

.subtitle {
  font-size: 14px;
  color: #8a9aa8;
}

.main {
  padding: 32px 20px;
}

.section {
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  padding: 24px;
  margin-bottom: 24px;
  border: 1px solid #e2e8f0;
  margin: 10px;
}

.section-header {
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e9edf2;
}

.section-header h2 {
  font-size: 18px;
  font-weight: 500;
  color: #1e2a36;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field label {
  font-size: 13px;
  font-weight: 500;
  color: #4a5c6c;
}

.field input,
.field select {
  padding: 10px 12px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-size: 14px;
  font-family: inherit;
  background: white;
  transition: 0.2s;
}

.field input:focus,
.field select:focus {
  outline: none;
  border-color: #4a7c8c;
  box-shadow: 0 0 0 2px rgba(74, 124, 140, 0.1);
}

.form-actions {
  display: flex;
  gap: 12px;
  padding-top: 8px;
}

button {
  cursor: pointer;
  font-family: inherit;
  font-size: 13px;
  font-weight: 500;
  transition: 0.15s;
}

.btn-primary {
  background: #2c4c5c;
  border: none;
  padding: 8px 20px;
  border-radius: 6px;
  color: white;
}

.btn-primary:hover {
  background: #1e3a48;
}

.btn-secondary {
  background: #e9edf2;
  border: 1px solid #cbd5e1;
  padding: 8px 20px;
  border-radius: 6px;
  color: #2c4c5c;
}

.btn-secondary:hover {
  background: #dee4eb;
}

.btn-outline {
  background: transparent;
  border: 1px solid #cbd5e1;
  padding: 6px 12px;
  border-radius: 6px;
  color: #8b5c5c;
  font-size: 12px;
}

.btn-outline:hover {
  border-color: #b91c1c;
  color: #b91c1c;
}

.btn-icon {
  background: none;
  border: none;
  font-size: 16px;
  color: #8a9aa8;
  padding: 4px 8px;
}

.btn-icon:hover {
  color: #b91c1c;
}

.btn-report {
  background: #eef2f5;
  border: 1px solid #cbd5e1;
  padding: 10px 18px;
  border-radius: 6px;
  font-size: 13px;
  color: #1e2a36;
}

.btn-report:hover {
  background: #e2e8f0;
  border-color: #8a9aa8;
}

.filter-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 20px;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-group label {
  font-size: 13px;
  color: #4a5c6c;
}

.filter-group select {
  padding: 6px 10px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  background: white;
  font-size: 13px;
}

.stats {
  display: flex;
  gap: 16px;
  font-size: 13px;
  color: #4a5c6c;
  margin-left: auto;
}

.stats span {
  background: #eef2f5;
  padding: 4px 10px;
  border-radius: 20px;
}

.table-wrapper {
  overflow-x: auto;
}

.table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.table th {
  text-align: left;
  padding: 12px 8px;
  background: #f7f9fb;
  font-weight: 500;
  color: #4a5c6c;
  border-bottom: 1px solid #e2e8f0;
}

.table td {
  padding: 12px 8px;
  border-bottom: 1px solid #eef2f5;
  color: #1e2a36;
}

.table tr:hover td {
  background: #fafcfd;
}

.num {
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.center {
  text-align: center;
}

.mono {
  font-family: monospace;
  font-size: 12px;
  color: #4a5c6c;
}

.actions {
  text-align: right;
  padding-right: 8px;
}

.empty {
  text-align: center;
  padding: 48px 20px;
  color: #8a9aa8;
  font-size: 14px;
}

.reports {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 16px;
}

.hint {
  font-size: 12px;
  color: #8a9aa8;
  margin-top: 12px;
}

.status {
  background: #f7f9fb;
  border-radius: 8px;
  padding: 12px 20px;
  display: flex;
  gap: 24px;
  font-size: 12px;
  color: #4a5c6c;
  border: 1px solid #e2e8f0;
}

.company-field .field-value {
  font-size: 14px;
  color: #1e2a36;
  font-weight: 500;
  margin-top: 2px;
}

.warning {
  color: red;
  font-weight: 600;
  opacity: 0.5;
  font-size: 12px;
}


/* Офлайн-инструкция (жирно и понятно) */
.offline-warning {
  margin: 10px;
  background: #ffefcd;
  border-left: 6px solid #e67e22;
  padding: 16px;
  margin-bottom: 20px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  color: #b45f1b;
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.offline-icon {
  font-size: 28px;
  background: #e67e22;
  color: white;
  width: 40px;
  height: 40px;
  border-radius: 30px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.offline-text {
  flex: 1;
}

.offline-text strong {
  font-size: 15px;
  display: block;
  margin-bottom: 4px;
  color: #a15506;
}

.offline-text small {
  font-size: 12px;
  opacity: 0.8;
  font-weight: normal;
}

/* ========== АДАПТИВ ========== */

/* Планшеты и маленькие ноутбуки (до 1024px) */
@media (max-width: 1024px) {
  .container {
    padding: 0 16px;
  }

  .main {
    padding: 24px 0;
  }

  .section {
    padding: 20px;
  }

  .form-grid {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 12px;
  }

  .company-grid {
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 12px;
  }
}

/* Телефоны (до 768px) */
@media (max-width: 768px) {
  .header {
    padding: 20px 0;
  }

  .header h1 {
    font-size: 20px;
  }

  .subtitle {
    font-size: 12px;
  }

  .section {
    padding: 16px;
    margin-bottom: 16px;
  }

  .section-header h2 {
    font-size: 16px;
  }

  .form-grid {
    grid-template-columns: 1fr;
    gap: 12px;
    margin-bottom: 20px;
  }

  .form-actions {
    flex-direction: column;
    gap: 8px;
  }

  .form-actions button {
    width: 100%;
  }

  /* Фильтры */
  .filter-bar {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }

  .filter-group {
    justify-content: space-between;
  }

  .filter-group select {
    width: 60%;
  }

  .stats {
    margin-left: 0;
    justify-content: center;
  }

  .stats span {
    font-size: 12px;
  }

  .btn-outline {
    width: 100%;
    padding: 8px;
  }

  /* Таблица — горизонтальная прокрутка */
  .table-wrapper {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

  .table {
    min-width: 650px;
    font-size: 12px;
  }

  .table th,
  .table td {
    padding: 8px 6px;
  }

  /* Карточка предприятия */
  .company-grid {
    grid-template-columns: 1fr;
  }

  .company-field.full-width {
    grid-column: span 1;
  }

  .company-field label {
    font-size: 10px;
  }

  .company-field .field-value {
    font-size: 13px;
  }

  .company-title h2 {
    font-size: 16px;
  }

  /* Отчёты */
  .reports {
    flex-direction: column;
    gap: 8px;
  }

  .btn-report {
    width: 100%;
    text-align: center;
  }

  /* Статус */
  .status {
    flex-direction: column;
    gap: 8px;
    text-align: center;
  }
}

/* Маленькие телефоны (до 480px) */
@media (max-width: 480px) {
  .container {
    padding: 0 12px;
  }

  .main {
    padding: 16px 0;
  }

  .section {
    padding: 12px;
  }

  .header h1 {
    font-size: 18px;
  }

  .company-badge {
    font-size: 8px;
    padding: 2px 6px;
  }

  .filter-group {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }

  .filter-group select {
    width: 100%;
  }

  .stats {
    flex-wrap: wrap;
    gap: 8px;
  }

  .table {
    min-width: 550px;
  }

  .btn-icon {
    padding: 4px 6px;
  }

  .edit-company-btn {
    width: 100%;
  }
}

/* Улучшенный таргетинг для полей ввода на телефонах */
@media (max-width: 768px) {

  .field input,
  .field select {
    font-size: 16px;
    /* Предотвращает зум на iOS */
    padding: 12px;
  }

  button {
    padding: 12px 16px;
  }

  .btn-icon {
    padding: 8px 8px;
  }
}
</style>