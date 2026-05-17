<template>
  <div class="app">
    <header class="header">
      <div class="container">
        <h1>Эколог.Отчёты</h1>
        <p class="subtitle">Учёт отходов на объекте</p>
      </div>
    </header>

    <main class="main container">
      <!-- Офлайн-напоминалка -->
      <section v-if="showNotify" class="offline-warning">
        <div class="offline-content">
          <img class="icon" src="../public/icon/warning.svg" alt="Внимание">
          <div class="text">
            <strong>РАБОТАЕТ БЕЗ ИНТЕРНЕТА</strong>
            <span>1. Нажмите Поделиться → На экран «Домой»</span>
            <span>2. Открывайте приложение с иконки даже в шахте</span>
          </div>
        </div>
        <button @click="showNotify = false" class="btn__close">✕</button>
      </section>

      <!-- ЭКРАН ВЫБОРА РОЛИ -->
      <div v-if="!role" class="role-selection">
        <div class="role-card" @click="setRole('worker')">
          <div class="role-icon"><img class="icon" src="../public/icon/worker.svg" alt="Рабочий"></div>
          <h3>Рабочий</h3>
          <p>Ввод данных, учёт движения</p>
        </div>
        <div class="role-card" @click="setRole('ecologist')">
          <div class="role-icon"> <img class="icon" src="../public/icon/ecologist.svg" alt="Эколог"></div>
          <h3>Эколог</h3>
          <p>Отчёты 2-ТП, выгрузка Excel</p>
        </div>
      </div>

      <!-- ИНТЕРФЕЙС РАБОЧЕГО -->
      <div v-if="role === 'worker'" class="worker-mode">
        <button @click="role = null" class="btn-back">← Сменить роль</button>

        <!-- Форма добавления -->
        <section class="section">
          <div class="section-header">
            <h2>Новый отход</h2>
          </div>

          <div class="form-basic">
            <div class="field">
              <label>Что за отход?</label>
              <input v-model="newWaste.waste_type" placeholder="Например: Лом черных металлов" />
            </div>
            <div class="row-grid">
              <div class="field">
                <label>Код ФККО</label>
                <input v-model="newWaste.fkko_code" placeholder="4 31..." />
              </div>
              <div class="field">
                <label>Класс</label>
                <select v-model="newWaste.hazard_class">
                  <option value="">—</option>
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                  <option value="5">5</option>
                </select>
              </div>
            </div>
            <div class="row-grid">
              <div class="field">
                <label>Дата</label>
                <input v-model="newWaste.date" type="date" />
              </div>
              <div class="field">
                <label>Место</label>
                <input v-model="newWaste.storage" placeholder="Площадка Ирокинда" />
              </div>
            </div>
          </div>

          <!-- Секции с полями (аккордеоны) -->
          <div class="toggle-section" v-for="section in wasteSections" :key="section.key">
            <label class="toggle-label" @click="toggleSection(section.key)">
              <span class="toggle-icon">{{ sectionVisible[section.key] ? '▼' : '▶' }}</span>
              {{ section.title }}
            </label>
            <div v-if="sectionVisible[section.key]" class="toggle-content">
              <div class="form-grid">
                <div class="field" v-for="field in section.fields" :key="field.model">
                  <label>{{ field.label }}</label>
                  <input v-model.number="newWaste[field.model]" type="number" step="0.001" placeholder="0.000" />
                </div>
              </div>
            </div>
          </div>

          <div class="form-actions">
            <button @click="addWaste" class="btn-save"><img class="icon" src="../public/icon/save.svg" alt="Сохранить">  Сохранить</button>
            <button @click="resetForm" class="btn-reset">Очистить</button>
          </div>
        </section>

        <!-- Таблица и фильтры -->
        <section class="section">
          <div class="filter-bar">
            <select v-model="filterYear">
              <option :value="null">Все года</option>
              <option v-for="y in availableYears" :key="y" :value="y">{{ y }}</option>
            </select>
            <select v-model="filterClass">
              <option :value="null">Все классы</option>
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
              <option value="5">5</option>
            </select>
            <div class="stats">{{ filteredWastes.length }} зап., {{ totalVolume.toFixed(1) }} т</div>
            <button v-if="wastes.length" @click="clearAll" class="btn-clear">Очистить всё</button>
          </div>

          <div class="table-wrapper">
            <table v-if="filteredWastes.length" class="table">
              <thead>
                <tr>
                  <th>№</th>
                  <th>Отход</th>
                  <th>ФККО</th>
                  <th>Кл</th>
                  <th>Обр.</th>
                  <th>Пер.</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(w, idx) in filteredWastes" :key="w.id">
                  <td>{{ idx + 1 }}</td>
                  <td>{{ w.waste_type }}</td>
                  <td class="mono">{{ w.fkko_code || '—' }}</td>
                  <td>{{ w.hazard_class || '—' }}</td>
                  <td class="center">{{ (w.generated || 0).toFixed(1) }}</td>
                  <td class="center">{{ (w.transferred || 0).toFixed(1) }}</td>
                  <td><button @click="deleteWaste(w.id)" class="btn-del">✕</button></td>
                </tr>
              </tbody>
            </table>
            <div v-else class="empty">Нет данных. Добавьте первую запись.</div>
          </div>
        </section>
      </div>

      <!-- ИНТЕРФЕЙС ЭКОЛОГА -->
      <div v-if="role === 'ecologist'" class="ecologist-mode">
        <button @click="role = null" class="btn-back">← Сменить роль</button>

        <!-- Карточка предприятия -->
        <section class="section company-card">
          <div class="company-header" @click="showCompany = !showCompany">
            <div class="company-title">
              <span class="company-badge">ДЕМО</span>
              <h2>Предприятие</h2>
            </div>
            <button class="btn-icon toggle-btn">{{ showCompany ? '▼' : '▶' }}</button>
          </div>
          <!-- Логика: если showCompany=true, показываем контент. Исправлено с !showCompany -->
          <div v-if="showCompany" class="company-content">
            <div class="company-grid">
              <div class="company-field"><label>ИНН</label>
                <div>0323123456</div>
              </div>
              <div class="company-field"><label>ОГРН</label>
                <div>1020304050607</div>
              </div>
              <div class="company-field"><label>КПП</label>
                <div>032301001</div>
              </div>
              <div class="company-field"><label>Наименование</label>
                <div>ООО "Z-gold"</div>
              </div>
              <div class="company-field full-width"><label>Объект НВОС</label>
                <div>Ирокинда (золотодобыча), I категория</div>
              </div>
            </div>
          </div>
        </section>

        <section class="section report-section">
          <div class="section-header">
            <h2>Отчёты</h2>
          </div>
          <div class="reports-grid">
            <button @click="generate2TPWaste" class="btn-report">
              <span class="r-icon"> <img class="icon" src="../public/icon/report.svg" alt="Отчет"></span>
              <div class="r-text">
                <strong>2-ТП (отходы)</strong>
                <small>Скачать Excel (с формулами)</small>
              </div>
            </button>
            <button @click="clearAll" class="btn-report danger">
              <span class="r-icon"><img class="icon" src="../public/icon/trash.svg" alt="Корзина"></span>
              <div class="r-text">
                <strong>Сброс базы</strong>
                <small>Удалить все записи</small>
              </div>
            </button>
          </div>
        </section>
      </div>

      <div class="status">
        <span>● Офлайн-режим</span>
        <span>● Данные в браузере</span>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

// ========== СОСТОЯНИЕ ==========
const showNotify = ref(true);
const showCompany = ref(false); // По умолчанию скрыто, чтобы не занимать место
const role = ref(null); // 'worker', 'ecologist' или null

function setRole(r) {
  role.value = r;
}

const wastes = ref([]);

// Модель данных 
const newWaste = ref({
  waste_type: '',
  fkko_code: '',
  hazard_class: '',
  date: new Date().toISOString().slice(0, 10),
  storage: '',
  start_storage: 0,
  start_accum: 0,
  generated: 0,
  received: 0,
  processed: 0,
  recycled: 0,
  neutralized: 0,
  transferred: 0,
  placed_total: 0,
  placed_storage: 0,
  placed_disposal: 0,
  end_storage: 0,
  end_accum: 0
});

const filterYear = ref(null);
const filterClass = ref(null);

// Конфигурация секций формы
const sectionVisible = ref({
  start: false,
  move: true, // Движение открыто по умолчанию
  placed: false,
  end: false
});

const wasteSections = [
  {
    key: 'start', title: 'Остатки на начало года', fields: [
      { label: 'Хранение', model: 'start_storage' },
      { label: 'Накопление', model: 'start_accum' }
    ]
  },
  {
    key: 'move', title: 'Движение отходов за период', fields: [
      { label: 'Образовано', model: 'generated' },
      { label: 'Получено от других', model: 'received' },
      { label: 'Обработано', model: 'processed' },
      { label: 'Утилизировано', model: 'recycled' },
      { label: 'Обезврежено', model: 'neutralized' },
      { label: 'Передано другим', model: 'transferred' }
    ]
  },
  {
    key: 'placed', title: 'Размещено на объектах', fields: [
      { label: 'Всего', model: 'placed_total' },
      { label: 'Хранение', model: 'placed_storage' },
      { label: 'Захоронение', model: 'placed_disposal' }
    ]
  },
  {
    key: 'end', title: 'Остатки на конец года', fields: [
      { label: 'Хранение', model: 'end_storage' },
      { label: 'Накопление', model: 'end_accum' }
    ]
  }
];

function toggleSection(key) {
  sectionVisible.value[key] = !sectionVisible.value[key];
}

// ========== COMPUTED ==========
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
  return filteredWastes.value.reduce((s, w) => s + (w.generated || 0), 0);
});

// ========== МЕТОДЫ ==========
function saveToLocalStorage() {
  localStorage.setItem('ecolog_wastes', JSON.stringify(wastes.value));
}

function loadFromLocalStorage() {
  const saved = localStorage.getItem('ecolog_wastes');
  if (saved && JSON.parse(saved).length > 0) {
    wastes.value = JSON.parse(saved);
  } else {
    // Тестовые записи
    wastes.value = [
      {
        id: Date.now() + 1,
        waste_type: 'Лом черных металлов (демо)',
        fkko_code: '4 61 010 01 20 5',
        hazard_class: '5',
        date: '2026-01-15',
        storage: 'Площадка Ирокинда',
        start_storage: 2.5, start_accum: 0, generated: 12.3, received: 0,
        processed: 0, recycled: 10.0, neutralized: 0, transferred: 8.2,
        placed_total: 0, placed_storage: 0, placed_disposal: 0,
        end_storage: 4.8, end_accum: 0
      },
      {
        id: Date.now() + 2,
        waste_type: 'Масла моторные отработанные (демо)',
        fkko_code: '4 06 150 01 31 3',
        hazard_class: '3',
        date: '2026-02-20',
        storage: 'Склад ГСМ',
        start_storage: 0.8, start_accum: 0, generated: 1.2, received: 0,
        processed: 0, recycled: 0.5, neutralized: 0, transferred: 1.0,
        placed_total: 0, placed_storage: 0, placed_disposal: 0,
        end_storage: 0.5, end_accum: 0
      },
      {
        id: Date.now() + 3,
        waste_type: 'Отходы зачистки ёмкостей (демо)',
        fkko_code: '9 19 100 01 33 4',
        hazard_class: '4',
        date: '2026-03-10',
        storage: 'Центральный склад',
        start_storage: 1.2, start_accum: 0, generated: 0.0, received: 3.5,
        processed: 0, recycled: 0, neutralized: 2.0, transferred: 2.0,
        placed_total: 0, placed_storage: 0, placed_disposal: 0,
        end_storage: 0.7, end_accum: 0
      },
      {
        id: Date.now() + 4,
        waste_type: 'Тара полиэтиленовая (демо)',
        fkko_code: '4 38 121 11 24 5',
        hazard_class: '5',
        date: '2026-04-05',
        storage: 'Склад тары',
        start_storage: 0.3, start_accum: 0, generated: 0.8, received: 0,
        processed: 0, recycled: 0.8, neutralized: 0, transferred: 0.3,
        placed_total: 0, placed_storage: 0, placed_disposal: 0,
        end_storage: 0, end_accum: 0
      },
      {
        id: Date.now() + 5,
        waste_type: 'Осадок очистных (демо)',
        fkko_code: '7 23 100 01 41 4',
        hazard_class: '4',
        date: '2026-05-01',
        storage: 'Иловые карты',
        start_storage: 15.0, start_accum: 0, generated: 3.2, received: 0,
        processed: 0, recycled: 0, neutralized: 0, transferred: 2.5,
        placed_total: 15.0, placed_storage: 10.0, placed_disposal: 5.0,
        end_storage: 15.7, end_accum: 0
      }
    ];
    saveToLocalStorage();
  }
}

function addWaste() {
  if (!newWaste.value.waste_type) {
    alert('Заполните наименование отхода');
    return;
  }

  wastes.value.push({
    id: Date.now(),
    ...newWaste.value,
    // Явное приведение типов для безопасности
    start_storage: Number(newWaste.value.start_storage) || 0,
    start_accum: Number(newWaste.value.start_accum) || 0,
    generated: Number(newWaste.value.generated) || 0,
    received: Number(newWaste.value.received) || 0,
    processed: Number(newWaste.value.processed) || 0,
    recycled: Number(newWaste.value.recycled) || 0,
    neutralized: Number(newWaste.value.neutralized) || 0,
    transferred: Number(newWaste.value.transferred) || 0,
    placed_total: Number(newWaste.value.placed_total) || 0,
    placed_storage: Number(newWaste.value.placed_storage) || 0,
    placed_disposal: Number(newWaste.value.placed_disposal) || 0,
    end_storage: Number(newWaste.value.end_storage) || 0,
    end_accum: Number(newWaste.value.end_accum) || 0
  });

  saveToLocalStorage();
  resetForm();
}

function resetForm() {
  newWaste.value = {
    waste_type: '', fkko_code: '', hazard_class: '',
    date: new Date().toISOString().slice(0, 10), storage: '',
    start_storage: 0, start_accum: 0, generated: 0, received: 0,
    processed: 0, recycled: 0, neutralized: 0, transferred: 0,
    placed_total: 0, placed_storage: 0, placed_disposal: 0,
    end_storage: 0, end_accum: 0
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

// ========== EXCEL GENERATION ==========
async function generate2TPWaste() {
  if (!wastes.value.length) return alert('Нет данных');

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('2-ТП (отходы)');

  // Настройка колонок
  worksheet.columns = Array(12).fill({ width: 16 });

  // Стили
  const baseStyle = {
    font: { size: 10, name: 'Arial' },
    alignment: { horizontal: 'center', vertical: 'middle', wrapText: true },
    border: { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } }
  };

  const numberStyle = {
    font: { size: 9, name: 'Arial' },
    alignment: { horizontal: 'center', vertical: 'middle', wrapText: true },
    border: { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } }
  };

  const dataStyle = {
    numFmt: '#,##0.00',
    alignment: { horizontal: 'center', vertical: 'middle', wrapText: true },
    border: { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } }
  };

  const indexStyle = {
    numFmt: '0',
    alignment: { horizontal: 'center', vertical: 'middle' },
    border: { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } }
  };

  // Строка 1
  const row1Values = [
    'N строки', 'Наименование вида отхода', 'Код по ФККО', 'Класс опасности вида отхода',
    'Наличие отходов на начало отчетного периода, тонн', '',
    'Образовано отходов в отчетном периоде, тонн', 'Получено отходов от других лиц в отчетном периоде, тонн',
    'Обработано отходов в отчетном периоде, тонн', 'Утилизировано отходов в отчетном периоде, тонн',
    'Обезврежено отходов в отчетном периоде, тонн', 'Передано отходов за отчетный период, тонн',
    'Размещено отходов на эксплуатируемых объектах в отчетном периоде, тонн', '', '',
    'Наличие отходов на конец отчетного периода, тонн', ''
  ];
  const row1 = worksheet.addRow(row1Values);
  row1.height = 45;

  // Строка 2
  const row2Values = [
    '', '', '', '',
    'Хранение', 'Накопление',
    '', '', '', '', '', '',
    'Всего', 'Хранение', 'Захоронение',
    'Хранение', 'Накопление'
  ];
  const row2 = worksheet.addRow(row2Values);
  row2.height = 90;

  // Строка 3 (нумерация колонок)
  const row3Values = ['А', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16'];
  const row3 = worksheet.addRow(row3Values);
  row3.height = 20;

  // Применение стилей шапки
  row1.eachCell((cell) => { cell.style = baseStyle; });
  row2.eachCell((cell) => { cell.style = baseStyle; });
  row3.eachCell((cell) => { cell.style = numberStyle; });

  // Слияния
  worksheet.mergeCells('A1:A2'); worksheet.mergeCells('B1:B2'); worksheet.mergeCells('C1:C2'); worksheet.mergeCells('D1:D2');
  worksheet.mergeCells('G1:G2'); worksheet.mergeCells('H1:H2'); worksheet.mergeCells('I1:I2');
  worksheet.mergeCells('J1:J2'); worksheet.mergeCells('K1:K2'); worksheet.mergeCells('L1:L2');
  worksheet.mergeCells('E1:F1'); worksheet.mergeCells('M1:O1'); worksheet.mergeCells('P1:Q1');

  // Данные
  wastes.value.forEach((w, idx) => {
    const rowData = [
      idx + 1, w.waste_type, w.fkko_code || '—', w.hazard_class || '—',
      Number(w.start_storage) || 0, Number(w.start_accum) || 0,
      Number(w.generated) || 0, Number(w.received) || 0, Number(w.processed) || 0,
      Number(w.recycled) || 0, Number(w.neutralized) || 0, Number(w.transferred) || 0,
      Number(w.placed_total) || 0, Number(w.placed_storage) || 0, Number(w.placed_disposal) || 0,
      Number(w.end_storage) || 0, Number(w.end_accum) || 0
    ];

    const row = worksheet.addRow(rowData);
    row.height = 90;

    row.eachCell((cell, colNumber) => {
      if (colNumber === 1) {
        cell.style = indexStyle;
      } else {
        cell.style = dataStyle;
      }
    });
  });

  // Сохранение
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `2-TP_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

onMounted(loadFromLocalStorage);
</script>

<style></style>