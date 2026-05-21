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
            <button @click="addWaste" class="btn-save"> Сохранить</button>
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
                  <!-- <th>Кл</th>
                  <th>Обр.</th>
                  <th>Пер.</th> -->
                  <th></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(w, idx) in filteredWastes" :key="w.id">
                  <td>{{ idx + 1 }}</td>
                  <td>{{ w.waste_type }}</td>
                  <td class="mono">{{ w.fkko_code || '—' }}</td>
                  <!-- <td>{{ w.hazard_class || '—' }}</td>
                  <td class="center">{{ (w.generated || 0).toFixed(1) }}</td>
                  <td class="center">{{ (w.transferred || 0).toFixed(1) }}</td> -->
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

        <div class="tabs">
          <button @click="activeTab = 'reports'" :class="{ active: activeTab === 'reports' }">Отчёты</button>
          <button @click="activeTab = 'transfer'" :class="{ active: activeTab === 'transfer' }">ЖДО (передача
            отходов)</button>
          <button @click="activeTab = '4OS'" :class="{ active: activeTab === '4OS' }">4-ОС</button>
        </div>

        <div v-if="activeTab === 'reports'">
          <section class="section report-section">
            <div class="section-header">
              <h2>Отчёты</h2>
            </div>
            <div class="reports-grid">
              <button @click="generate2TPWaste" class="btn-report">
                <span class="r-icon"> <img class="icon" src="../public/icon/report.svg" alt="Отчет"></span>
                <div class="r-text">
                  <strong>2-ТП (отходы)</strong>
                  <small>Скачать Excel</small>
                </div>
              </button>
              <button @click="generate4OS" class="btn-report">
                <span class="r-icon"> <img class="icon" src="../public/icon/report.svg" alt="Отчет"></span>
                <div class="r-text">
                  <strong>4-ОС</strong>
                  <small>Скачать Excel</small>
                </div>
              </button>
              <button @click="generateZDO" class="btn-report">
                <span class="r-icon"> <img class="icon" src="../public/icon/report.svg" alt="Отчет"></span>
                <div class="r-text">
                  <strong>ЖДО (Передача отходов)</strong>
                  <small>Скачать Excel</small>
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
        <div v-if="activeTab === 'transfer'">
          <section class="section">
            <div class="section-header">
              <h2>Передача отходов (ЖДО)</h2>
            </div>

            <div class="form-grid">
              <div class="field">
                <label>Наименование отхода *</label>
                <input v-model="newTransfer.waste_type" placeholder="Лом черных металлов" />
              </div>
              <div class="field">
                <label>Код ФККО</label>
                <input v-model="newTransfer.fkko_code" placeholder="4 61 010 01 20 5" />
              </div>
              <div class="field">
                <label>Класс опасности</label>
                <select v-model="newTransfer.hazard_class">
                  <option value="">—</option>
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                  <option value="5">5</option>
                </select>
              </div>
            </div>

            <div class="form-subsection">
              <h3>Количество переданных отходов, тонн</h3>
              <div class="form-grid">
                <div class="field"><label>Всего</label><input v-model.number="newTransfer.amount_total" type="number"
                    step="0.001" /></div>
                <div class="field"><label>Для обработки</label><input v-model.number="newTransfer.amount_processing"
                    type="number" step="0.001" /></div>
                <div class="field"><label>Для утилизации</label><input v-model.number="newTransfer.amount_recycling"
                    type="number" step="0.001" /></div>
                <div class="field"><label>Для захоронения</label><input v-model.number="newTransfer.amount_disposal"
                    type="number" step="0.001" /></div>
                <div class="field"><label>Для хранения</label><input v-model.number="newTransfer.amount_storage"
                    type="number" step="0.001" /></div>
                <div class="field"><label>Для обезвреживания</label><input
                    v-model.number="newTransfer.amount_neutralization" type="number" step="0.001" /></div>
              </div>
            </div>

            <div class="form-subsection">
              <h3>Сведения о лицах, которым переданы отходы</h3>
              <div class="form-grid">
                <div class="field"><label>Контрагент</label><input v-model="newTransfer.contractor"
                    placeholder="ООО «Эко-Сервис»" /></div>
                <div class="field"><label>Дата договора</label><input v-model="newTransfer.contract_date" type="date" />
                </div>
                <div class="field"><label>Номер договора</label><input v-model="newTransfer.contract_number"
                    placeholder="№12 от 15.03.2026" /></div>
                <div class="field"><label>Срок действия договора</label><input v-model="newTransfer.contract_validity"
                    placeholder="до 31.12.2026" /></div>
                <div class="field full-width"><label>Реквизиты лицензии</label><input
                    v-model="newTransfer.license_details" placeholder="Серия, номер, кем выдана" /></div>
              </div>
            </div>

            <div class="form-actions">
              <button @click="addTransfer" class="btn-save">Сохранить передачу</button>
              <button @click="resetTransferForm" class="btn-reset">Очистить</button>
            </div>
          </section>

          <!-- Таблица переданных отходов -->
          <section class="section">
            <div class="section-header">
              <h2>Журнал передач</h2>
            </div>
            <div class="table-wrapper">
              <table v-if="transfers.length" class="table">
                <thead>
                  <tr>
                    <th>Отход</th>
                    <th>ФККО</th>
                    <th>Кл</th>
                    <th>Всего, т</th>
                    <th>Контрагент</th>
                    <th>Дата договора</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="t in transfers" :key="t.id">
                    <td>{{ t.waste_type }}</td>
                    <td class="mono">{{ t.fkko_code || '—' }}</td>
                    <td>{{ t.hazard_class || '—' }}</td>
                    <td class="num">{{ (t.amount_total || 0).toFixed(3) }}</td>
                    <td>{{ t.contractor || '—' }}</td>
                    <td>{{ t.contract_date || '—' }}</td>
                    <td><button @click="deleteTransfer(t.id)" class="btn-del">✕</button></td>
                  </tr>
                </tbody>
              </table>
              <div v-else class="empty">Нет данных о передаче отходов</div>
            </div>
          </section>
        </div>

        <div v-if="activeTab === '4OS'">
          <section class="section">
            <div class="demo-placeholder">
              <h3>Демо-режим</h3>
              <p>В данный момент используется тестовая база данных по затратам.</p>
              <p>Функционал ручного ввода затрат будет добавлен в следующих обновлениях.</p>
              <p>Вы можете сгенерировать отчет 4-ОС на вкладке отчеты</p>
            </div>
          </section>
        </div>
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
const activeTab = ref('reports')

function setRole(r) {
  role.value = r;
}
// ========== ЖДО (передача отходов) ==========
const transfers = ref([]);
const newTransfer = ref({
  waste_type: '',
  fkko_code: '',
  hazard_class: '',
  amount_total: 0,
  amount_processing: 0,
  amount_recycling: 0,
  amount_disposal: 0,
  amount_storage: 0,
  amount_neutralization: 0,
  contractor: '',
  contract_date: '',
  contract_number: '',
  contract_validity: '',
  license_details: ''
});

// Загрузка/сохранение передач
function loadTransfersFromLocal() {
  const saved = localStorage.getItem('ecolog_transfers');
  if (saved) {
    transfers.value = JSON.parse(saved);
  } else {
    // Если данных нет — создаем тестовые
    initDemoTransfers();
  }
}

function saveTransfersToLocal() {
  localStorage.setItem('ecolog_transfers', JSON.stringify(transfers.value));
}

// Функция для создания демо-данных ЖДО
function initDemoTransfers() {
  transfers.value = [
    {
      id: Date.now() + 100,
      waste_type: 'Лом черных металлов (демо)',
      fkko_code: '4 61 010 01 20 5',
      hazard_class: '5',
      amount_total: 8.200,
      amount_processing: 0,
      amount_recycling: 8.200, // Утилизация (переплавка)
      amount_disposal: 0,
      amount_storage: 0,
      amount_neutralization: 0,
      contractor: 'ООО "Металл-Рециклинг"',
      contract_date: '2026-01-10',
      contract_number: '№ 15-УТ',
      contract_validity: 'до 31.12.2027',
      license_details: 'Серия АА № 123456 от 01.01.2020'
    },
    {
      id: Date.now() + 101,
      waste_type: 'Масла моторные отработанные (демо)',
      fkko_code: '4 06 150 01 31 3',
      hazard_class: '3',
      amount_total: 1.000,
      amount_processing: 1.000, // Обработка (регенерация)
      amount_recycling: 0,
      amount_disposal: 0,
      amount_storage: 0,
      amount_neutralization: 0,
      contractor: 'ЗАО "Эко-Нефть"',
      contract_date: '2026-02-15',
      contract_number: '№ 44/ОБ',
      contract_validity: 'до 31.12.2026',
      license_details: 'Серия ББ № 789012 от 15.05.2021'
    },
    {
      id: Date.now() + 102,
      waste_type: 'Отходы зачистки ёмкостей (демо)',
      fkko_code: '9 19 100 01 33 4',
      hazard_class: '4',
      amount_total: 2.000,
      amount_processing: 0,
      amount_recycling: 0,
      amount_disposal: 0,
      amount_storage: 0,
      amount_neutralization: 2.000, // Обезвреживание
      contractor: 'МУП "Городские Чистота"',
      contract_date: '2026-03-01',
      contract_number: '№ 102-ОБ',
      contract_validity: 'до 31.12.2026',
      license_details: 'Серия ВВ № 345678 от 10.10.2019'
    }
  ];
  saveTransfersToLocal();
}

function addTransfer() {
  if (!newTransfer.value.waste_type) {
    alert('Заполните наименование отхода');
    return;
  }
  transfers.value.push({
    id: Date.now(),
    ...newTransfer.value,
    amount_total: Number(newTransfer.value.amount_total) || 0,
    amount_processing: Number(newTransfer.value.amount_processing) || 0,
    amount_recycling: Number(newTransfer.value.amount_recycling) || 0,
    amount_disposal: Number(newTransfer.value.amount_disposal) || 0,
    amount_storage: Number(newTransfer.value.amount_storage) || 0,
    amount_neutralization: Number(newTransfer.value.amount_neutralization) || 0
  });
  saveTransfersToLocal();
  resetTransferForm();
}

function resetTransferForm() {
  newTransfer.value = {
    waste_type: '',
    fkko_code: '',
    hazard_class: '',
    amount_total: 0,
    amount_processing: 0,
    amount_recycling: 0,
    amount_disposal: 0,
    amount_storage: 0,
    amount_neutralization: 0,
    contractor: '',
    contract_date: '',
    contract_number: '',
    contract_validity: '',
    license_details: ''
  };
}

function deleteTransfer(id) {
  transfers.value = transfers.value.filter(t => t.id !== id);
  saveTransfersToLocal();
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
  move: false,
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

async function generate4OS() {
  if (!wastes.value.length) return alert('Нет данных для формирования отчета 4-ОС');

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('4-ОС (Затраты)');

  // --- НАСТРОЙКА КОЛОНОК ---
  worksheet.columns = [
    { width: 40 }, // A - Наименование
    { width: 8 },  // B - № строки
    { width: 10 }, // C - Всего текущие
    { width: 10 }, // D - в т.ч. собств. средства
    { width: 10 }, // E - Материальные
    { width: 10 }, // F - Оплата труда
    { width: 12 }, // G - Услуги природоохр.
    { width: 12 }, // H - Кап. ремонт
    { width: 12 }, // I - Выручка
    { width: 12 }  // J - Амортизация
  ];

  // --- СТИЛИ ---
  const borderStyle = { style: 'thin' };
  const baseBorder = {
    top: borderStyle, left: borderStyle, bottom: borderStyle, right: borderStyle
  };

  const headerStyle = {
    font: { size: 9, name: 'Arial' },
    alignment: { horizontal: 'center', vertical: 'top', wrapText: true },
    border: baseBorder
  };

  const dataStyle = {
    font: { size: 9, name: 'Arial' },
    alignment: { horizontal: 'center', vertical: 'middle' },
    border: baseBorder
  };

  // --- ЗАПОЛНЕНИЕ ШАПКИ ---

  // Строка 1: Главный заголовок
  const row1 = worksheet.addRow(['Выполнение работ по охране окружающей среды, тыс. рублей']);
  row1.height = 25;
  worksheet.mergeCells('A1:J1');
  row1.getCell(1).style = {
    font: { bold: true, size: 12, name: 'Arial' },
    alignment: { horizontal: 'center', vertical: 'middle' },
    border: baseBorder
  };

  // Строка 2: Уровень "Для собственных нужд"
  // A2 и B2 будут объединены с A3 и B3 соответственно.
  // C2:F2 - "Для собственных нужд..."
  // G2:J2 - пустые, но с границами, чтобы сохранить сетку
  const row2 = worksheet.addRow([
    'Наименование направлений природоохранной деятельности', // A2
    '№ строки', // B2
    'Для собственных нужд (кроме предоставления специализированных природоохранных услуг)', // C2
    '', '', '', // D2, E2, F2 (часть слияния C2:F2)
    '', '', '', '' // G2, H2, I2, J2 (пустые)
  ]);
  row2.height = 30;
  worksheet.mergeCells('C2:J2'); // Объединяем C2, D2, E2, F2, J2

  // Применяем стиль ко всей строке 2
  row2.eachCell(cell => cell.style = headerStyle);

  // Строка 3: Подзаголовки под "Для собственных нужд" и основные заголовки для G-J
  const row3 = worksheet.addRow([
    '', '', // A3, B3 (части слияния с A2, B2)
    'Текущие (эксплуатационные) затраты за год', // C3 (будет объединен с D3)
    '', // D3 (часть слияния с C3)
    'Из гр. 3 состав текущих затрат по основным видам', // E3 (будет объединен с F3)
    '', // F3 (часть слияния с E3)
    'Оплата услуг природоохранного назначения', // G3 (будет объединен с G4)
    'Затраты на капитальный ремонт основных фондов по охране окружающей среды', // H3 (будет объединен с H4)
    'Выручка (поступления) от продажи побочной продукции', // I3 (будет объединен с I4)
    'Амортизационные отчисления на восстановление основных фондов по охране окружающей среды' // J3 (будет объединен с J4)
  ]);
  row3.height = 50;

  // Строка 4: Подзаголовки для C-F
  const row4 = worksheet.addRow([
    '', '', // A4, B4 (части слияния)
    'всего', // C4
    'из них за счет собственных средств', // D4
    'материальные затраты', // E4
    'затраты на оплату труда и отчисления на социальные нужды', // F4
    '', '', '', '' // G4, H4, I4, J4 (части слияния с G3, H3, I3, J3)
  ]);
  row4.height = 90;

  // СЛИЯНИЯ ШАПКИ

  // A и B: Вертикальное слияние строк 2 и 3
  worksheet.mergeCells('A2:A4');
  worksheet.mergeCells('B2:B4');

  // C и D: Горизонтальное слияние в строке 3 (над "всего" и "из них")
  worksheet.mergeCells('C3:D3');

  // E и F: Горизонтальное слияние в строке 3 (над "материальные" и "оплата труда")
  worksheet.mergeCells('E3:F3');

  // G, H, I, J: Вертикальное слияние строк 3 и 4
  worksheet.mergeCells('G3:G4');
  worksheet.mergeCells('H3:H4');
  worksheet.mergeCells('I3:I4');
  worksheet.mergeCells('J3:J4');

  // Применяем стили к строкам 3 и 4
  row3.eachCell(cell => cell.style = headerStyle);
  row4.eachCell(cell => cell.style = headerStyle);

  // Строка 5: Буквенная нумерация (А, Б, 1...)
  const row5 = worksheet.addRow(['А', 'Б', '3', '4', '5', '6', '7', '8', '9', '10']);
  row5.height = 20;
  row5.eachCell(cell => cell.style = { ...headerStyle, font: { bold: false, size: 9 } });


  // РАСЧЕТ ДАННЫХ 
  let totalCosts = 0;
  let airCosts = 0;
  let waterCosts = 0;
  let wasteCosts = 0;

  wastes.value.forEach(w => {
    const mass = w.generated || 0;
    if (['1', '2'].includes(w.hazard_class)) airCosts += mass;
    else if (['3'].includes(w.hazard_class)) waterCosts += mass;
    else wasteCosts += mass;
    totalCosts += mass;
  });

  // ЗАПОЛНЕНИЕ СТРОК ДАННЫХ 
  const addDataRow = (name, rowNum, valTotal, valOwn, valMat, valLabor, valServ, valCap, valRev, valAmort) => {
    const row = worksheet.addRow([
      name, rowNum, valTotal, valOwn, valMat, valLabor, valServ, valCap, valRev, valAmort
    ]);
    row.height = 25;

    // Стиль для первой ячейки (текст слева)
    row.getCell(1).style = { ...dataStyle, alignment: { horizontal: 'left', vertical: 'middle', wrapText: true } };
    // Стиль для номера строки
    row.getCell(2).style = dataStyle;

    // Стиль для числовых данных
    for (let i = 3; i <= 10; i++) {
      row.getCell(i).style = { ...dataStyle, numFmt: '#,##0.00' };
    }
  };

  addDataRow('Охрана окружающей среды - всего', '01', totalCosts, totalCosts, 0, 0, 0, 0, 0, 0);
  addDataRow('в том числе:', '', '', '', '', '', '', '', '', '');
  addDataRow('охрана атмосферного воздуха...', '02', airCosts, airCosts, 0, 0, 0, 0, 0, 0);
  addDataRow('охрана водных ресурсов', '03', waterCosts, waterCosts, 0, 0, 0, 0, 0, 0);
  addDataRow('обращение с отходами...', '04', wasteCosts, wasteCosts, 0, 0, 0, 0, 0, 0);

  // --- СОХРАНЕНИЕ ---
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `4-OS_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

async function generateZDO() {
  if (!transfers.value.length) return alert('Нет данных о передачах отходов');

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('ЖДО (Передача)');

  // --- НАСТРОЙКА КОЛОНОК (14 штук) ---
  worksheet.columns = [
    { width: 5 },  // A: № п/п
    { width: 20 }, // B: Наименование
    { width: 12 }, // C: Код ФККО
    { width: 15 },  // D: Класс
    { width: 6 }, // E - Всего
    { width: 6 }, // F - Обработка
    { width: 6 }, // G - Утилизация
    { width: 6 }, // H - Обезвреживание
    { width: 6 }, // I - Хранение
    { width: 6 }, // J - Захоронение
    { width: 13 }, // K - Лица
    { width: 13 }, // L - Договор
    { width: 13 }, // M - Срок
    { width: 20 }  // N - Лицензия
  ];

  // --- СТИЛИ ---
  const borderStyle = { style: 'thin' };
  const baseBorder = {
    top: borderStyle, left: borderStyle, bottom: borderStyle, right: borderStyle
  };

  const headerStyle = {
    font: { size: 9, name: 'Arial' },
    alignment: { horizontal: 'center', vertical: 'top', wrapText: true },
    border: baseBorder
  };

  // Стиль для вертикального текста (подзаголовки количества)
  const verticalHeaderStyle = {
    font: { size: 9, name: 'Arial' },
    alignment: {
      horizontal: 'center',
      vertical: 'middle',
      wrapText: true,
      textRotation: 90
    },
    border: baseBorder
  };

  const dataStyle = {
    font: { size: 9, name: 'Arial' },
    alignment: { horizontal: 'center', vertical: 'middle', wrapText: true },
    border: baseBorder
  };

  const numStyle = {
    ...dataStyle,
    numFmt: '#,##0.000' // Три знака после запятой для тонн
  };

  // --- ШАПКА (Строка 1) ---
  const row1 = worksheet.addRow([
    '№ п/п',
    'Наименование вида отхода',
    'Код по ФККО',
    'Класс опасности вида отхода',
    'Количество переданных отходов за отчетный период, тонн', // E (объединит E-J)
    '', '', '', '', '', // F-J пустые
    'Сведения о лицах, которым переданы отходы', // K
    'Дата и номер договора на передачу отходов', // L
    'Срок действия договора', // M
    'Реквизиты лицензии на осуществление деятельности по сбору, транспортированию, обработке, утилизации, обезвреживанию, размещению отходов I - IV классов опасности' // N
  ]);
  row1.height = 60;

  // --- ШАПКА (Строка 2) ---
  const row2 = worksheet.addRow([
    '', '', '', '', // A-D пустые (часть слияния)
    'всего', // E
    'для обработки', // F
    'для утилизации', // G
    'для обезвреживания', // H
    'для хранения', // I
    'для захоронения', // J
    '', '', '', '' // K-N пустые (часть слияния)
  ]);
  row2.height = 80;

  // --- ШАПКА (Строка 3) ---
  const row3 = worksheet.addRow(['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14']);
  row3.height = 20;

  // --- СЛИЯНИЯ ШАПКИ ---
  // Вертикальные (A-D, K-N) занимают строки 1 и 2
  worksheet.mergeCells('A1:A2');
  worksheet.mergeCells('B1:B2');
  worksheet.mergeCells('C1:C2');
  worksheet.mergeCells('D1:D2');

  worksheet.mergeCells('K1:K2');
  worksheet.mergeCells('L1:L2');
  worksheet.mergeCells('M1:M2');
  worksheet.mergeCells('N1:N2');

  // Горизонтальное (E-J) в строке 1
  worksheet.mergeCells('E1:J1');

  // Применяем стили ко всем строкам шапки
  row1.eachCell(cell => cell.style = headerStyle);

  // Для второй строки применяем вертикальный стиль только к колонкам E-J
  row2.eachCell((cell, colNumber) => {
    if (colNumber >= 5 && colNumber <= 10) {
      cell.style = verticalHeaderStyle;
    } else {
      cell.style = headerStyle;
    }
  });

  row3.eachCell(cell => cell.style = { ...headerStyle, font: { bold: false, size: 9 } });

  // --- ДАННЫЕ ---
  transfers.value.forEach((t, idx) => {
    const row = worksheet.addRow([]);
    row.height = 50;

    // 1. № п/п
    row.getCell(1).value = idx + 1;
    row.getCell(1).style = dataStyle;

    // 2. Наименование
    row.getCell(2).value = t.waste_type;
    row.getCell(2).style = { ...dataStyle, alignment: { horizontal: 'left', vertical: 'middle', wrapText: true } };

    // 3. Код ФККО
    row.getCell(3).value = t.fkko_code || '';
    row.getCell(3).style = dataStyle;

    // 4. Класс опасности
    row.getCell(4).value = t.hazard_class || '';
    row.getCell(4).style = dataStyle;

    // 5-10. Числовые данные (Количество)
    const amounts = [
      t.amount_total,
      t.amount_processing,
      t.amount_recycling,
      t.amount_neutralization,
      t.amount_storage,
      t.amount_disposal
    ];

    for (let i = 0; i < amounts.length; i++) {
      const cellIndex = i + 5; // Начинаем с колонки E (индекс 5)
      const cell = row.getCell(cellIndex);
      cell.value = Number(amounts[i]) || 0;
      cell.style = numStyle;
    }

    // 11. Сведения о лицах (Контрагент)
    row.getCell(11).value = t.contractor || '';
    row.getCell(11).style = { ...dataStyle, alignment: { horizontal: 'left', vertical: 'middle', wrapText: true } };

    // 12. Дата и номер договора
    let contractInfo = '';
    if (t.contract_date) contractInfo += t.contract_date + '\n';
    if (t.contract_number) contractInfo += t.contract_number;
    row.getCell(12).value = contractInfo.trim() || '';
    row.getCell(12).style = { ...dataStyle, alignment: { horizontal: 'center', vertical: 'middle', wrapText: true } };

    // 13. Срок действия договора
    row.getCell(13).value = t.contract_validity || '';
    row.getCell(13).style = dataStyle;

    // 14. Реквизиты лицензии
    row.getCell(14).value = t.license_details || '';
    row.getCell(14).style = { ...dataStyle, alignment: { horizontal: 'left', vertical: 'middle', wrapText: true } };
  });

  // --- СОХРАНЕНИЕ ---
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `ZDO_${new Date().toISOString().slice(0, 10)}.xlsx`);
}


onMounted(() => {
  loadFromLocalStorage();
  loadTransfersFromLocal();
});
</script>

<style></style>