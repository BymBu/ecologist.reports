<template>
  <div class="app">
    <header class="header">
      <div class="container">
        <h1>Эколог.Отчёты</h1>
        <p class="subtitle">Учёт отходов и автоматическая отчётность</p>
      </div>
    </header>

    <main class="main container">
      <section v-if="showNotify" class="offline-warning">
        <div class="offline-warging--wrapper">
          <div class="offline-icon">⚠️</div>
          <div class="offline-text">
            <strong>ШАХТА / КАРЬЕР — ИНТЕРНЕТ НЕ НУЖЕН</strong>
            Чтобы приложение работало без сети — <strong>добавьте его на главный экран</strong> телефона.<br>
            <small>Нажмите «Поделиться» → «На экран «Домой»» (10 секунд).</small>
          </div>
        </div>

        <button @click="showNotify = false" class="btn__close">x</button>
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

        <!-- Основная информация -->
        <div class="form-grid">
          <div class="field">
            <label>Наименование отхода *</label>
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
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
              <option value="5">5</option>
            </select>
          </div>
          <div class="field">
            <label>Дата образования</label>
            <input v-model="newWaste.date" type="date" />
          </div>
          <div class="field">
            <label>Место хранения</label>
            <input v-model="newWaste.storage" type="text" placeholder="Площадка Ирокинда" />
          </div>
        </div>

        <!-- Остатки на начало года -->
        <div class="form-subsection">
          <h3>📊 Остатки на начало года</h3>
          <div class="form-grid">
            <div class="field">
              <label>Хранение, тонн</label>
              <input v-model.number="newWaste.start_storage" type="number" step="0.001" placeholder="0.000" />
            </div>
            <div class="field">
              <label>Накопление, тонн</label>
              <input v-model.number="newWaste.start_accum" type="number" step="0.001" placeholder="0.000" />
            </div>
          </div>
        </div>

        <!-- Движение отходов -->
        <div class="form-subsection">
          <h3>🔄 Движение отходов за отчётный период</h3>
          <div class="form-grid">
            <div class="field">
              <label>Образовано, тонн</label>
              <input v-model.number="newWaste.generated" type="number" step="0.001" placeholder="0.000" />
            </div>
            <div class="field">
              <label>Получено от других, тонн</label>
              <input v-model.number="newWaste.received" type="number" step="0.001" placeholder="0.000" />
            </div>
            <div class="field">
              <label>Обработано, тонн</label>
              <input v-model.number="newWaste.processed" type="number" step="0.001" placeholder="0.000" />
            </div>
            <div class="field">
              <label>Утилизировано, тонн</label>
              <input v-model.number="newWaste.recycled" type="number" step="0.001" placeholder="0.000" />
            </div>
            <div class="field">
              <label>Обезврежено, тонн</label>
              <input v-model.number="newWaste.neutralized" type="number" step="0.001" placeholder="0.000" />
            </div>
            <div class="field">
              <label>Передано другим, тонн</label>
              <input v-model.number="newWaste.transferred" type="number" step="0.001" placeholder="0.000" />
            </div>
          </div>
        </div>

        <!-- Размещение -->
        <div class="form-subsection">
          <h3>🏭 Размещено на эксплуатируемых объектах</h3>
          <div class="form-grid">
            <div class="field">
              <label>Всего, тонн</label>
              <input v-model.number="newWaste.placed_total" type="number" step="0.001" placeholder="0.000" />
            </div>
            <div class="field">
              <label>Хранение, тонн</label>
              <input v-model.number="newWaste.placed_storage" type="number" step="0.001" placeholder="0.000" />
            </div>
            <div class="field">
              <label>Захоронение, тонн</label>
              <input v-model.number="newWaste.placed_disposal" type="number" step="0.001" placeholder="0.000" />
            </div>
          </div>
        </div>

        <!-- Остатки на конец года -->
        <div class="form-subsection">
          <h3>📉 Остатки на конец года</h3>
          <div class="form-grid">
            <div class="field">
              <label>Хранение, тонн</label>
              <input v-model.number="newWaste.end_storage" type="number" step="0.001" placeholder="0.000" />
            </div>
            <div class="field">
              <label>Накопление, тонн</label>
              <input v-model.number="newWaste.end_accum" type="number" step="0.001" placeholder="0.000" />
            </div>
          </div>
        </div>

        <div class="form-actions">
          <button @click="addWaste" class="btn-primary">💾 Сохранить</button>
          <button @click="resetForm" class="btn-secondary">Очистить форму</button>
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
              <option value="I">1</option>
              <option value="II">2</option>
              <option value="III">3</option>
              <option value="IV">4</option>
              <option value="V">5</option>
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
                <th>Образовано, т</th>
                <th>Передано, т</th>
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
                <td class="center">{{ (w.generated || 0).toFixed(3) }}</td>
                <td class="center">{{ (w.transferred || 0).toFixed(3) }}</td>
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
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

// уведомление
const showNotify = ref(true);

// ========== Состояние ==========
const wastes = ref([]);
const showCompany = ref(true);

// Новая запись
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

// Фильтры
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
  return filteredWastes.value.reduce((s, w) => s + (w.generated || 0), 0);
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
  if (!newWaste.value.waste_type) {
    alert('Заполните наименование отхода');
    return;
  }

  wastes.value.push({
    id: Date.now(),
    ...newWaste.value,
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

// ========== ГЕНЕРАЦИЯ EXCEL (ExcelJS) ==========
async function generate2TPWaste() {
  if (!wastes.value.length) return alert('Нет данных');

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('2-ТП (отходы)');

  // --- Настройка колонок  ---
  worksheet.columns = Array(12).fill({ width: 16 }); // Последние 5 колонок не трогаем, пусть останется дефолт ширина

  // --- Базовый стиль (границы + центровка + перенос) ---
  const baseStyle = {
    font: { size: 10, name: 'Arial' },
    alignment: { horizontal: 'center', vertical: 'middle', wrapText: true },
    border: {
      top: { style: 'thin' }, left: { style: 'thin' },
      bottom: { style: 'thin' }, right: { style: 'thin' }
    }
  };

  const numberStyle = {
    font: { size: 9, name: 'Arial' },
    alignment: { horizontal: 'center', vertical: 'middle', wrapText: true },
    border: {
      top: { style: 'thin' }, left: { style: 'thin' },
      bottom: { style: 'thin' }, right: { style: 'thin' }
    }
  };

  const dataStyle = {
    numFmt: '#,##0.00', // Формат чисел
    alignment: { horizontal: 'center', vertical: 'middle', wrapText: true },
    border: {
      top: { style: 'thin' }, left: { style: 'thin' },
      bottom: { style: 'thin' }, right: { style: 'thin' }
    }
  };

  // Стиль для первой колонки (N строки) - целое число
  const indexStyle = {
    numFmt: '0',
    alignment: { horizontal: 'center', vertical: 'middle' },
    border: {
      top: { style: 'thin' }, left: { style: 'thin' },
      bottom: { style: 'thin' }, right: { style: 'thin' }
    }
  };

  // --- СТРОКА 1: Главные заголовки ---
  const row1Values = [
    'N строки',
    'Наименование вида отхода',
    'Код по ФККО',
    'Класс опасности вида отхода',

    'Наличие отходов на начало отчетного периода, тонн', '',

    'Образовано отходов в отчетном периоде, тонн',
    'Получено отходов от других лиц в отчетном периоде, тонн',
    'Обработано отходов в отчетном периоде, тонн',
    'Утилизировано отходов в отчетном периоде, тонн',
    'Обезврежено отходов в отчетном периоде, тонн',
    'Передано отходов за отчетный период, тонн',

    'Размещено отходов на эксплуатируемых объектах в отчетном периоде, тонн', '', '',

    'Наличие отходов на конец отчетного периода, тонн', ''
  ];
  const row1 = worksheet.addRow(row1Values);
  row1.height = 45;

  // --- СТРОКА 2: Подзаголовки ---
  const row2Values = [
    '', '', '', '',
    'Хранение', 'Накопление',
    '', '', '', '', '', '',
    'Всего', 'Хранение', 'Захоронение',
    'Хранение', 'Накопление'
  ];
  const row2 = worksheet.addRow(row2Values);
  row2.height = 90;

  // --- СТРОКА 3: Нумерация ---
  const row3Values = [
    'А', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16'
  ];
  const row3 = worksheet.addRow(row3Values);
  row3.height = 20;

  // --- Стили шапки ---
  row1.eachCell((cell) => { cell.style = baseStyle; });
  row2.eachCell((cell) => { cell.style = baseStyle; });
  row3.eachCell((cell) => { cell.style = numberStyle; });

  // --- СЛИЯНИЯ ---
  worksheet.mergeCells('A1:A2');
  worksheet.mergeCells('B1:B2');
  worksheet.mergeCells('C1:C2');
  worksheet.mergeCells('D1:D2');

  worksheet.mergeCells('G1:G2');
  worksheet.mergeCells('H1:H2');
  worksheet.mergeCells('I1:I2');
  worksheet.mergeCells('J1:J2');
  worksheet.mergeCells('K1:K2');
  worksheet.mergeCells('L1:L2');

  worksheet.mergeCells('E1:F1');
  worksheet.mergeCells('M1:O1');
  worksheet.mergeCells('P1:Q1');

  // --- ДАННЫЕ ---
  wastes.value.forEach((w, idx) => {
    const rowData = [
      idx + 1, // Это число
      w.waste_type,
      w.fkko_code || '—',
      w.hazard_class || '—',
      Number(w.start_storage) || 0,
      Number(w.start_accum) || 0,
      Number(w.generated) || 0,
      Number(w.received) || 0,
      Number(w.processed) || 0,
      Number(w.recycled) || 0,
      Number(w.neutralized) || 0,
      Number(w.transferred) || 0,
      Number(w.placed_total) || 0,
      Number(w.placed_storage) || 0,
      Number(w.placed_disposal) || 0,
      Number(w.end_storage) || 0,
      Number(w.end_accum) || 0
    ];

    const row = worksheet.addRow(rowData);
    row.height = 90;

    // Применяем стили вручную, чтобы первая колонка была целой, а остальные дробными
    row.eachCell((cell, colNumber) => {
      if (colNumber === 1) {
        cell.style = indexStyle; // Первая колонка - целое число
      } else {
        cell.style = dataStyle; // Остальные - дробные
      }
    });
  });

  // --- Сохранение ---
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `2-TP_${new Date().toISOString().slice(0, 10)}.xlsx`);
}








// Остальные отчеты можно тоже переписать на ExcelJS, но пока оставим как есть, если они работают
// function generate4OS() {
//   if (!wastes.value.length) return alert('Нет данных');
//   const total = wastes.value.reduce((s, w) => s + (w.generated || 0), 0);
//   const data = [
//     ['Показатель', 'Объём, т'],
//     ['Всего отходов (образовано)', total],
//     ['I класс', wastes.value.filter(w => w.hazard_class === 'I').reduce((s, w) => s + (w.generated || 0), 0)],
//     ['II класс', wastes.value.filter(w => w.hazard_class === 'II').reduce((s, w) => s + (w.generated || 0), 0)],
//     ['III класс', wastes.value.filter(w => w.hazard_class === 'III').reduce((s, w) => s + (w.generated || 0), 0)],
//     ['IV класс', wastes.value.filter(w => w.hazard_class === 'IV').reduce((s, w) => s + (w.generated || 0), 0)],
//     ['V класс', wastes.value.filter(w => w.hazard_class === 'V').reduce((s, w) => s + (w.generated || 0), 0)]
//   ];
//   // Для простоты остальные оставим на XLSX, так как там нет сложной верстки
//   import('xlsx').then(XLSX => {
//     const ws = XLSX.utils.aoa_to_sheet(data);
//     ws['!cols'] = [{ wch: 25 }, { wch: 15 }];
//     const wb = XLSX.utils.book_new();
//     XLSX.utils.book_append_sheet(wb, ws, '4-ОС');
//     XLSX.writeFile(wb, `4-OS_${new Date().toISOString().slice(0, 10)}.xlsx`);
//   });
// }

// function generateClassSummary() {
//   if (!wastes.value.length) return alert('Нет данных');
//   const classes = { I: 0, II: 0, III: 0, IV: 0, V: 0 };
//   wastes.value.forEach(w => { if (w.hazard_class) classes[w.hazard_class] += (w.generated || 0); });
//   const total = Object.values(classes).reduce((s, v) => s + v, 0);
//   const data = [
//     ['Класс', 'Объём, т', 'Доля, %'],
//     ...Object.entries(classes).map(([c, v]) => [c, v, total ? ((v / total) * 100).toFixed(1) : 0]),
//     ['ИТОГО', total, '100']
//   ];
//   import('xlsx').then(XLSX => {
//     const ws = XLSX.utils.aoa_to_sheet(data);
//     ws['!cols'] = [{ wch: 12 }, { wch: 15 }, { wch: 12 }];
//     const wb = XLSX.utils.book_new();
//     XLSX.utils.book_append_sheet(wb, ws, 'Сводка');
//     XLSX.writeFile(wb, `summary_${new Date().toISOString().slice(0, 10)}.xlsx`);
//   });
// }

onMounted(loadFromLocalStorage);
</script>