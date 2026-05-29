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

            <!-- ПОЛЕ 1: НАИМЕНОВАНИЕ -->
            <div class="field autocomplete-container">
              <label>Что за отход?</label>
              <input ref="wasteNameInput" v-model="newWaste.waste_type" placeholder="Начните вводить название..."
                @input="handleNameInput($event)" @focus="showNameSuggestions = true" autocomplete="off"
                autocorrect="off" autocapitalize="off" spellcheck="false" />

              <!-- Список подсказок -->
              <ul v-if="showNameSuggestions && nameSuggestions.length > 0" class="autocomplete-list">
                <li v-for="(item, index) in nameSuggestions" :key="index"
                  @mousedown.prevent="selectNameSuggestion(item)" @touchstart.prevent="selectNameSuggestion(item)">
                  {{ item.name }} <span class="code-hint">({{ item.code }})</span>
                </li>
              </ul>
            </div>

            <div class="row-grid">
              <!-- ПОЛЕ 2: КОД ФККО -->
              <div class="field autocomplete-container">
                <label>Код ФККО</label>
                <input v-model="newWaste.fkko_code" placeholder="Введите код (например 4 61...)"
                  @input="handleCodeInput" @focus="showCodeSuggestions = true" @blur="onCodeBlur" autocomplete="off" />

                <!-- Список подсказок -->
                <ul v-if="showCodeSuggestions && codeSuggestions.length > 0" class="autocomplete-list">
                  <li v-for="(item, index) in codeSuggestions" :key="index"
                    @mousedown.prevent="selectCodeSuggestion(item)"> <!-- ВАЖНО: mousedown.prevent -->
                    {{ item.code }} <span class="name-hint">- {{ item.name }}</span>
                  </li>
                </ul>
              </div>

              <!-- ПОЛЕ 3: КЛАСС -->
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
              <button @click="generateZDO_XML" class="btn-report">
                <span class="r-icon"> <img class="icon" src="../public/icon/XML.svg" alt="XML"></span>
                <div class="r-text">
                  <strong>ЖДО (Передача отходов)</strong>
                  <small>Скачать XML для ЛК РПН</small>
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

            <div class="form-basic">

              <!-- ПОЛЕ 1: НАИМЕНОВАНИЕ (ЖДО) -->
              <div class="field autocomplete-container">
                <label>Что за отход?</label>
                <input ref="transferNameInput" v-model="newTransfer.waste_type"
                  placeholder="Начните вводить название..." @input="handleTransferNameInput($event)"
                  @focus="showTransferNameSuggestions = true" autocomplete="off" autocorrect="off" autocapitalize="off"
                  spellcheck="false" />

                <!-- Список подсказок для ЖДО (Название) -->
                <ul v-if="showTransferNameSuggestions && transferNameSuggestions.length > 0" class="autocomplete-list">
                  <li v-for="(item, index) in transferNameSuggestions" :key="'t-name-' + index"
                    @mousedown.prevent="selectTransferNameSuggestion(item)"
                    @touchstart.prevent="selectTransferNameSuggestion(item)">
                    {{ item.name }} <span class="code-hint">({{ item.code }})</span>
                  </li>
                </ul>
              </div>

              <div class="row-grid">
                <!-- ПОЛЕ 2: КОД ФККО (ЖДО) -->
                <div class="field autocomplete-container">
                  <label>Код ФККО</label>
                  <input ref="transferCodeInput" v-model="newTransfer.fkko_code"
                    placeholder="Введите код (например 4 61...)" @input="handleTransferCodeInput"
                    @focus="showTransferCodeSuggestions = true" autocomplete="off" />

                  <!-- Список подсказок для ЖДО (Код) -->
                  <ul v-if="showTransferCodeSuggestions && transferCodeSuggestions.length > 0"
                    class="autocomplete-list">
                    <li v-for="(item, index) in transferCodeSuggestions" :key="'t-code-' + index"
                      @mousedown.prevent="selectTransferCodeSuggestion(item)"
                      @touchstart.prevent="selectTransferCodeSuggestion(item)">
                      {{ item.code }} <span class="name-hint">- {{ item.name }}</span>
                    </li>
                  </ul>
                </div>

                <!-- ПОЛЕ 3: КЛАСС -->
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
import { ref, computed, onMounted, nextTick, onUnmounted } from 'vue';
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

async function generateZDO_XML() {
  if (!transfers.value.length) return alert('Нет данных о передачах отходов');

  // Данные организации (заглушки, подставь реальные)
  const orgInfo = {
    inn: '0323123456',
    kpp: '032301001',
    ogrn: '1020304050607',
    fname: 'ООО "Z-gold"',
    sname: 'Z-gold',
    okpo: '12345678',
    okato: '00000000000', // Замени на реальный ОКАТО
    regionCode: '03', // Бурятия
    chief: 'Директор Директорович'
  };

  const year = new Date().getFullYear();
  const now = new Date().toISOString().replace('T', ' ').slice(0, 19);

  let xml = `<?xml version="1.0" encoding="utf-8"?>\n`;
  xml += `<DATA_PACKET_NI Version="1.8" Program="Ecolog.Reports" ExpDate="${now}" DocType="3" RPN_TO="${orgInfo.regionCode}" YEAR="${year}" RPT_PERIOD="0" CALC_TYPE="0" NUMB_COR_RPT="" INN="${orgInfo.inn}" KPP="${orgInfo.kpp}" OGRN="${orgInfo.ogrn}">\n`;
  
  xml += `  <ORG_INFO>\n`;
  
  // 1. Организация
  xml += `    <ID_ORG>ORG_001</ID_ORG>\n`;
  xml += `    <FNAME>${escapeXml(orgInfo.fname)}</FNAME>\n`;
  xml += `    <SNAME>${escapeXml(orgInfo.sname)}</SNAME>\n`;
  xml += `    <FINDIVID>false</FINDIVID>\n`;
  xml += `    <INN>${orgInfo.inn}</INN>\n`;
  xml += `    <OKPO>${orgInfo.okpo}</OKPO>\n`;
  xml += `    <OGRN>${orgInfo.ogrn}</OGRN>\n`;
  xml += `    <ADDJ_OKATO>${orgInfo.okato}</ADDJ_OKATO>\n`;
  xml += `    <ADDJ_INDEX>000000</ADDJ_INDEX>\n`;
  xml += `    <ADDR_JUR>Республика Бурятия, г. Улан-Удэ</ADDR_JUR>\n`;
  xml += `    <ADDJ_STREET>ул. Ленина, д. 1</ADDJ_STREET>\n`;

  // 2. Лицензия (одна общая)
  xml += `    <WASTE_LIC>\n`;
  xml += `      <ID_LIC>LIC_001</ID_LIC>\n`;
  xml += `      <NUM_DOC>АА № 000000</NUM_DOC>\n`; 
  xml += `      <DATE_DOC>2020-01-01</DATE_DOC>\n`;
  xml += `      <ISSUED_NAME>Роспотребнадзор</ISSUED_NAME>\n`;
  xml += `      <PERMANENT_FLAG>false</PERMANENT_FLAG>\n`;
  xml += `    </WASTE_LIC>\n`;

  // 3. Договоры (WASTE_DOG) - регистрируем их, чтобы получить ID
  transfers.value.forEach((t, index) => {
    const dogId = `DOG_${String(index + 1).padStart(3, '0')}`;
    const recOrgId = `REC_ORG_${String(index + 1).padStart(3, '0')}`;
    let dateDoc = t.contract_date || new Date().toISOString().slice(0, 10);
    
    xml += `    <WASTE_DOG>\n`;
    xml += `      <ID_DOG>${dogId}</ID_DOG>\n`;
    xml += `      <NUM_DOC>${escapeXml(t.contract_number || 'Б/Н')}</NUM_DOC>\n`;
    xml += `      <DATE_DOC>${dateDoc}</DATE_DOC>\n`;
    xml += `      <REC_ORG_ID>${recOrgId}</REC_ORG_ID>\n`;
    xml += `      <ID_LIC>LIC_001</ID_LIC>\n`;
    xml += `      <DATE_BEGIN>${dateDoc}</DATE_BEGIN>\n`;
    
    if (t.contract_validity) {
        const match = t.contract_validity.match(/(\d{2})\.(\d{2})\.(\d{4})/);
        if (match) xml += `      <DATE_END>${match[3]}-${match[2]}-${match[1]}</DATE_END>\n`;
        else xml += `      <DATE_END>${dateDoc}</DATE_END>\n`;
    } else {
         xml += `      <DATE_END>${dateDoc}</DATE_END>\n`;
    }
    xml += `    </WASTE_DOG>\n`;
  });

  // 4. САМОЕ ГЛАВНОЕ: ОТЧЕТ ПО ПЕРЕДАЧЕ ОТХОДОВ (ЖДО)
  // Здесь мы связываем отходы с договорами через CONTRACTOR_ID
  xml += `    <RPT_2TP_WASTE>\n`;
  xml += `      <DOC_YEAR>${year}</DOC_YEAR>\n`;
  xml += `      <ROSPRIR>Управление Росприроднадзора по Республике Бурятия</ROSPRIR>\n`;
  xml += `      <FNAME>${escapeXml(orgInfo.fname)}</FNAME>\n`;
  xml += `      <INN>${orgInfo.inn}</INN>\n`;
  xml += `      <OKATO>${orgInfo.okato}</OKATO>\n`;
  xml += `      <RPT_OKATO>${orgInfo.okato}</RPT_OKATO>\n`;

  // Раздел 1: Передача отходов (Section 1)
  xml += `      <RPT_2TP_WASTE_FACT_SECTION_1>\n`;
  
  transfers.value.forEach((t, index) => {
    const dogId = `DOG_${String(index + 1).padStart(3, '0')}`;
    
    xml += `        <ITEM>\n`;
    xml += `          <ID_ITEM>TR_${String(index + 1).padStart(3, '0')}</ID_ITEM>\n`;
    
    // Данные об отходе
    xml += `          <NONE_FKKO_NAME></NONE_FKKO_NAME>\n`; // Пусто, т.к. есть код
    // Удаляем пробелы из кода ФККО для XML (часто требуют формат без пробелов)
    xml += `          <WST_CODE>${t.fkko_code ? t.fkko_code.replace(/\s/g, '') : ''}</WST_CODE>\n`;
    xml += `          <WSTYPE>${t.hazard_class || 5}</WSTYPE>\n`;
    
    // Количества передачи (маппинг полей из формы ЖДО на поля XML 2-ТП/ЖДО)
    // TP2_TR_PROC - передано для обработки
    // TP2_TR_ISPOTX - передано для использования/утилизации
    // TP2_TR_SOTX - передано для обезвреживания
    // TP2_TR_DISP - передано для захоронения
    // TP2_TR_STOR - передано для хранения
    
    xml += `          <TP2_TR_PROC>${(t.amount_processing || 0).toFixed(6)}</TP2_TR_PROC>\n`;
    xml += `          <TP2_TR_ISPOTX>${(t.amount_recycling || 0).toFixed(6)}</TP2_TR_ISPOTX>\n`;
    xml += `          <TP2_TR_SOTX>${(t.amount_neutralization || 0).toFixed(6)}</TP2_TR_SOTX>\n`;
    xml += `          <TP2_TR_DISP>${(t.amount_disposal || 0).toFixed(6)}</TP2_TR_DISP>\n`;
    xml += `          <TP2_TR_STOR>${(t.amount_storage || 0).toFixed(6)}</TP2_TR_STOR>\n`;
    
    // Ссылка на договор (ID_DOG из блока WASTE_DOG выше)
    xml += `          <CONTRACTOR_ID>${dogId}</CONTRACTOR_ID>\n`;
    
    xml += `        </ITEM>\n`;
  });
  
  xml += `      </RPT_2TP_WASTE_FACT_SECTION_1>\n`;
  
  // Раздел 2: ТКО (если нужно, можно добавить аналогично, но пока пусто)
  xml += `      <RPT_2TP_WASTE_FACT_SECTION_2>\n`;
  xml += `      </RPT_2TP_WASTE_FACT_SECTION_2>\n`;

  xml += `    </RPT_2TP_WASTE>\n`;

  xml += `  </ORG_INFO>\n`;
  xml += `  <ATTACH></ATTACH>\n`;
  xml += `</DATA_PACKET_NI>`;

  // Сохранение
  const blob = new Blob([xml], { type: 'application/xml' });
  saveAs(blob, `RPN_ZDO_${orgInfo.inn}_${year}.xml`);

}

// Вспомогательная функция экранирования спецсимволов XML
function escapeXml(unsafe) {
  if (!unsafe) return '';
  return unsafe.replace(/[<>&'"]/g, function (c) {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
    }
  });
}

onMounted(() => {
  loadFromLocalStorage();
  loadTransfersFromLocal();

  document.addEventListener('click', handleClickOutside);
  document.addEventListener('touchstart', handleClickOutside);
});

// ========== ЛОГИКА АВТОКОМПЛИТА (ОСНОВНАЯ ФОРМА) ==========

const showNameSuggestions = ref(false);
const showCodeSuggestions = ref(false);
const wasteNameInput = ref(null);

// --- НАИМЕНОВАНИЕ ---

const nameSuggestions = computed(() => {
  // Берем значение напрямую из объекта, но фильтруем аккуратно
  const rawVal = newWaste.value.waste_type;
  if (!rawVal) return [];

  const query = rawVal.toLowerCase().trim();
  if (!query) return [];

  return FKKO_DB.filter(item => item.name.toLowerCase().startsWith(query)).slice(0, 10);
});

function handleNameInput(event) {
  // 1. Принудительно открываем список
  showNameSuggestions.value = true;

  // 2. Получаем значение ИЗ СОБЫТИЯ (это надежнее чем v-model на Android при наборе)
  const val = event.target.value;

  // 3. Обновляем модель вручную
  newWaste.value.waste_type = val;

  if (!val || !val.trim()) {
    newWaste.value.fkko_code = '';
    newWaste.value.hazard_class = '';
    showNameSuggestions.value = false;
    return;
  }

  // 4. Логика поиска
  const exactMatch = FKKO_DB.find(item => item.name.toLowerCase() === val.toLowerCase());

  if (exactMatch) {
    newWaste.value.fkko_code = exactMatch.code;
    newWaste.value.hazard_class = exactMatch.class;
  } else {
    // Если нет точного совпадения, сбрасываем код, но список оставляем
    newWaste.value.fkko_code = '';
    newWaste.value.hazard_class = '';
  }
}

async function selectNameSuggestion(item) {
  // 1. Обновляем данные
  newWaste.value.waste_type = item.name;
  newWaste.value.fkko_code = item.code;
  newWaste.value.hazard_class = item.class;

  // 2. Жестко ставим значение в DOM (Android Fix)
  if (wasteNameInput.value) {
    wasteNameInput.value.value = item.name;
    // Генерируем событие input, чтобы Vue обновил свой v-model
    wasteNameInput.value.dispatchEvent(new Event('input', { bubbles: true }));
  }

  // 3. Закрываем список
  showNameSuggestions.value = false;

  // 4. Возвращаем фокус
  await nextTick();
  if (wasteNameInput.value) {
    wasteNameInput.value.focus();
  }
}

// === ГЛОБАЛЬНОЕ ЗАКРЫТИЕ СПИСКА (Вместо blur) ===
function handleClickOutside(event) {
  // Если клик был НЕ внутри нашего контейнера автокомплита
  if (!event.target.closest('.autocomplete-container')) {
    showNameSuggestions.value = false;
  }
}


onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
  document.removeEventListener('touchstart', handleClickOutside);
});


// --- КОД ФККО ---

const codeSuggestions = computed(() => {
  const query = newWaste.value.fkko_code.replace(/\s/g, '').toLowerCase();
  if (!query) return [];

  return FKKO_DB.filter(item => {
    const cleanCode = item.code.replace(/\s/g, '').toLowerCase();
    return cleanCode.startsWith(query);
  }).slice(0, 10);
});

function handleCodeInput() {
  showCodeSuggestions.value = true;

  const val = newWaste.value.fkko_code;
  const cleanInput = val.replace(/\s/g, '');

  if (!cleanInput) {
    newWaste.value.waste_type = '';
    newWaste.value.hazard_class = '';
    showCodeSuggestions.value = false;
    return;
  }

  const exactMatch = FKKO_DB.find(item => item.code.replace(/\s/g, '') === cleanInput);

  if (exactMatch) {
    newWaste.value.waste_type = exactMatch.name;
    newWaste.value.hazard_class = exactMatch.class;
  } else {
    newWaste.value.waste_type = '';
    newWaste.value.hazard_class = '';
  }
}

function selectCodeSuggestion(item) {
  newWaste.value.fkko_code = item.code;
  newWaste.value.waste_type = item.name;
  newWaste.value.hazard_class = item.class;
  showCodeSuggestions.value = false;
}

function onCodeBlur() {
  setTimeout(() => { showCodeSuggestions.value = false; }, 150);
}


// Локальная база популярных отходов для горнодобычи (ОФЛАЙН)
const FKKO_DB = [
  { code: '4 61 010 01 20 5', name: 'Лом черных металлов', class: '5' },
  { code: '4 61 010 03 20 5', name: 'Отходы цветных металлов', class: '5' },
  { code: '4 06 150 01 31 3', name: 'Масла моторные отработанные', class: '3' },
  { code: '9 19 100 01 33 4', name: 'Отходы зачистки емкостей', class: '4' },
  { code: '7 23 100 01 41 4', name: 'Осадок очистных сооружений', class: '4' },
  { code: '4 38 121 11 24 5', name: 'Тара полиэтиленовая', class: '5' },
  { code: '4 61 010 02 20 5', name: 'Отходы стали', class: '5' },
  { code: '4 61 010 04 20 5', name: 'Отходы меди', class: '5' },
  { code: '4 61 010 05 20 5', name: 'Отходы алюминия', class: '5' },
  { code: '4 61 010 06 20 5', name: 'Отходы свинца', class: '5' },
  { code: '4 61 010 07 20 5', name: 'Отходы цинка', class: '5' },
  { code: '4 61 010 08 20 5', name: 'Отходы никеля', class: '5' },
  { code: '4 61 010 09 20 5', name: 'Отходы кобальта', class: '5' },
  { code: '4 61 010 10 20 5', name: 'Отходы золота', class: '5' },
  { code: '4 61 010 11 20 5', name: 'Отходы серебра', class: '5' },
  { code: '4 61 010 12 20 5', name: 'Отходы платины', class: '5' },
  { code: '4 61 010 13 20 5', name: 'Отходы палладия', class: '5' },
  { code: '4 61 010 14 20 5', name: 'Отходы родия', class: '5' },
  { code: '4 61 010 15 20 5', name: 'Отходы иридия', class: '5' },
  { code: '4 61 010 16 20 5', name: 'Отходы осмия', class: '5' },
  { code: '4 61 010 17 20 5', name: 'Отходы рутения', class: '5' },
  { code: '4 61 010 18 20 5', name: 'Отходы тантала', class: '5' },
  { code: '4 61 010 19 20 5', name: 'Отходы ниобия', class: '5' },
  { code: '4 61 010 20 20 5', name: 'Отходы вольфрама', class: '5' },
  { code: '4 61 010 21 20 5', name: 'Отходы молибдена', class: '5' },
  { code: '4 61 010 22 20 5', name: 'Отходы титана', class: '5' },
  { code: '4 61 010 23 20 5', name: 'Отходы циркония', class: '5' },
  { code: '4 61 010 24 20 5', name: 'Отходы магния', class: '5' },
  { code: '4 61 010 25 20 5', name: 'Отходы кальция', class: '5' },
  { code: '4 61 010 26 20 5', name: 'Отходы натрия', class: '5' },
  { code: '4 61 010 27 20 5', name: 'Отходы калия', class: '5' },
  { code: '4 61 010 28 20 5', name: 'Отходы лития', class: '5' },
  { code: '4 61 010 29 20 5', name: 'Отходы бария', class: '5' },
  { code: '4 61 010 30 20 5', name: 'Отходы стронция', class: '5' },
  { code: '4 61 010 31 20 5', name: 'Отходы бериллия', class: '5' },
  { code: '4 61 010 32 20 5', name: 'Отходы скандия', class: '5' },
  { code: '4 61 010 33 20 5', name: 'Отходы иттрия', class: '5' },
  { code: '4 61 010 34 20 5', name: 'Отходы лантана', class: '5' },
  { code: '4 61 010 35 20 5', name: 'Отходы церия', class: '5' },
  { code: '4 61 010 36 20 5', name: 'Отходы празеодима', class: '5' },
  { code: '4 61 010 37 20 5', name: 'Отходы неодима', class: '5' },
  { code: '4 61 010 38 20 5', name: 'Отходы прометия', class: '5' },
  { code: '4 61 010 39 20 5', name: 'Отходы самария', class: '5' },
  { code: '4 61 010 40 20 5', name: 'Отходы европия', class: '5' },
  { code: '4 61 010 41 20 5', name: 'Отходы гадолиния', class: '5' },
  { code: '4 61 010 42 20 5', name: 'Отходы тербия', class: '5' },
  { code: '4 61 010 43 20 5', name: 'Отходы диспрозия', class: '5' },
  { code: '4 61 010 44 20 5', name: 'Отходы голомия', class: '5' },
  { code: '4 61 010 45 20 5', name: 'Отходы эрбия', class: '5' },
  { code: '4 61 010 46 20 5', name: 'Отходы тулия', class: '5' },
  { code: '4 61 010 47 20 5', name: 'Отходы иттербия', class: '5' },
  { code: '4 61 010 48 20 5', name: 'Отходы лютеция', class: '5' },
  { code: '4 61 010 49 20 5', name: 'Отходы гафния', class: '5' },
  { code: '4 61 010 50 20 5', name: 'Отходы тантала', class: '5' },
  // Отходы горнодобывающей промышленности
  { code: '2 11 000 01 21 4', name: 'Хвосты обогащения руд цветных металлов', class: '4' },
  { code: '2 11 000 02 21 4', name: 'Хвосты обогащения железных руд', class: '4' },
  { code: '2 11 000 03 21 4', name: 'Хвосты обогащения золотосодержащих руд', class: '4' },
  { code: '2 11 100 01 21 4', name: 'Вскрышные породы (пустая порода)', class: '4' },
  { code: '2 11 100 02 21 4', name: 'Отходы дробления руды', class: '4' },
  { code: '2 11 200 01 21 4', name: 'Шламы обогащения руд', class: '4' },
  { code: '2 11 300 01 21 4', name: 'Пыль рудная', class: '4' },

  // Отработанные масла и ГСМ
  { code: '4 06 110 01 31 3', name: 'Масла индустриальные отработанные', class: '3' },
  { code: '4 06 110 02 31 3', name: 'Масла гидравлические отработанные', class: '3' },
  { code: '4 06 110 03 31 3', name: 'Масла трансмиссионные отработанные', class: '3' },
  { code: '4 06 110 04 31 3', name: 'Масла компрессорные отработанные', class: '3' },
  { code: '4 06 110 05 31 3', name: 'Масла турбинные отработанные', class: '3' },
  { code: '4 06 110 06 31 3', name: 'Масла трансформаторные отработанные', class: '3' },
  { code: '4 06 150 01 31 3', name: 'Масла моторные отработанные', class: '3' },

  // Нефтепродукты и загрязненные материалы
  { code: '4 06 170 01 31 4', name: 'Эмульсии масляные отработанные', class: '4' },
  { code: '4 06 130 01 31 4', name: 'Обтирочный материал, загрязненный маслами', class: '4' },
  { code: '4 06 130 02 31 4', name: 'Ветошь промасленная', class: '4' },
  { code: '4 06 140 01 31 4', name: 'Фильтры масляные отработанные', class: '4' },
  { code: '4 06 160 01 31 4', name: 'Топливо моторное отработанное', class: '4' },

  // Строительные отходы
  { code: '8 12 101 01 61 4', name: 'Бой бетонных изделий', class: '4' },
  { code: '8 12 101 02 61 4', name: 'Бой железобетонных изделий', class: '4' },
  { code: '8 12 102 01 61 4', name: 'Бой кирпичной кладки', class: '4' },
  { code: '8 12 103 01 61 4', name: 'Бой керамической плитки', class: '4' },
  { code: '8 12 104 01 61 4', name: 'Отходы гипсокартона', class: '4' },
  { code: '8 12 105 01 61 4', name: 'Отходы минеральной ваты', class: '4' },
  { code: '8 12 106 01 61 4', name: 'Отходы пенопласта строительного', class: '4' },

  // Твердые коммунальные отходы
  { code: '7 33 100 01 72 4', name: 'Мусор от офисных помещений несортированный', class: '4' },
  { code: '7 33 110 01 72 4', name: 'Мусор от бытовых помещений организаций', class: '4' },
  { code: '7 33 120 01 72 4', name: 'Отходы упаковки из смешанных материалов', class: '4' },
  { code: '7 33 130 01 72 4', name: 'Крупногабаритные отходы', class: '4' },
  { code: '7 33 140 01 72 4', name: 'Смет уличный', class: '4' },

  // Полимерные отходы
  { code: '4 38 121 11 24 5', name: 'Тара полиэтиленовая чистая', class: '5' },
  { code: '4 38 121 12 24 5', name: 'Тара полиэтиленовая загрязненная', class: '5' },
  { code: '4 38 121 21 24 5', name: 'Пленка полиэтиленовая', class: '5' },
  { code: '4 38 122 11 24 5', name: 'Тара ПЭТФ загрязненная', class: '5' },
  { code: '4 38 122 12 24 5', name: 'Тара ПЭТФ чистая', class: '5' },
  { code: '4 38 123 11 24 5', name: 'Тара полипропиленовая', class: '5' },
  { code: '4 38 124 11 24 5', name: 'Тара полистирольная', class: '5' },

  // Древесные отходы
  { code: '3 01 101 01 42 4', name: 'Опилки древесные', class: '4' },
  { code: '3 01 102 01 42 4', name: 'Стружка древесная', class: '4' },
  { code: '3 01 103 01 42 4', name: 'Обрезки древесины', class: '4' },
  { code: '3 01 104 01 42 4', name: 'Горбыль древесный', class: '4' },
  { code: '3 01 105 01 42 4', name: 'Древесная пыль', class: '4' },
  { code: '3 01 106 01 42 4', name: 'Кора древесная', class: '4' },

  // Осадки и шламы
  { code: '7 23 100 01 41 4', name: 'Осадок очистных сооружений', class: '4' },
  { code: '7 23 101 01 41 4', name: 'Избыточный активный ил', class: '4' },
  { code: '7 23 102 01 41 4', name: 'Осадок промывки фильтров', class: '4' },
  { code: '7 23 103 01 41 4', name: 'Шлам очистки ливневых вод', class: '4' },
  { code: '7 23 104 01 41 4', name: 'Осадок нейтрализации сточных вод', class: '4' },

  // Химические отходы
  { code: '4 41 100 01 32 3', name: 'Лакокрасочные средства просроченные', class: '3' },
  { code: '4 41 100 02 32 3', name: 'Эмали отработанные', class: '3' },
  { code: '4 41 200 01 32 3', name: 'Растворители отработанные', class: '3' },
  { code: '4 41 300 01 32 3', name: 'Клеи просроченные', class: '3' },

  // Медицинские отходы (для предприятий с медпунктами)
  { code: '7 41 100 01 20 4', name: 'Медицинские отходы класса Б', class: '4' },
  { code: '7 41 100 02 20 4', name: 'Медицинские отходы класса В', class: '4' },
  { code: '7 41 200 01 20 4', name: 'Просроченные лекарственные средства', class: '4' },

  // Автомобильные отходы
  { code: '4 31 200 01 99 5', name: 'Шины пневматические отработанные', class: '5' },
  { code: '4 31 200 02 99 5', name: 'Камеры резиновые отработанные', class: '5' },
  { code: '4 34 100 01 31 4', name: 'Аккумуляторы свинцовые отработанные', class: '4' },
  { code: '4 34 200 01 31 4', name: 'Аккумуляторы щелочные отработанные', class: '4' },
  { code: '4 35 100 01 31 4', name: 'Тормозные колодки отработанные', class: '4' },
  { code: '4 36 100 01 31 4', name: 'Фильтры воздушные отработанные', class: '4' },
  { code: '4 36 200 01 31 4', name: 'Фильтры топливные отработанные', class: '4' },

  // Отходы электроники
  { code: '4 82 200 01 52 4', name: 'Компьютеры устаревшие', class: '4' },
  { code: '4 82 200 02 52 4', name: 'Мониторы устаревшие', class: '4' },
  { code: '4 82 200 03 52 4', name: 'Принтеры устаревшие', class: '4' },
  { code: '4 82 300 01 52 4', name: 'Люминесцентные лампы отработанные', class: '2' },
  { code: '4 82 301 01 52 4', name: 'Светодиодные лампы отработанные', class: '4' },
  { code: '4 82 400 01 52 4', name: 'Кабели и провода меди', class: '4' },
  { code: '4 82 400 02 52 4', name: 'Кабели и провода алюминия', class: '4' },
  { code: '4 82 400 03 52 4', name: 'Кабели и провода смешанные', class: '4' },

  // Пищевые отходы
  { code: '7 22 100 01 31 4', name: 'Пищевые отходы кухонь', class: '4' },
  { code: '7 22 100 02 31 4', name: 'Отходы переработки овощей', class: '4' },
  { code: '7 22 100 03 31 4', name: 'Просроченная продукция', class: '4' },

  // Опасные отходы 1-2 класса
  { code: '4 70 100 01 11 2', name: 'Ртутные лампы отработанные', class: '2' },
  { code: '4 70 200 01 11 2', name: 'Термометры ртутные отработанные', class: '2' },
  { code: '4 70 300 01 11 2', name: 'Приборы с ртутным заполнением', class: '2' },
  { code: '4 60 200 01 11 2', name: 'Отходы гальванических производств', class: '2' },
  { code: '4 60 100 01 12 1', name: 'ПХБ-содержащие отходы', class: '1' },
  { code: '4 60 100 02 12 1', name: 'Отходы, содержащие диоксины', class: '1' },

  { code: '8 12 107 01 61 4', name: 'Отходы асбестоцементные (шифер)', class: '4' },
  { code: '8 12 108 01 61 4', name: 'Отходы рубероида', class: '4' },
  { code: '8 12 109 01 61 4', name: 'Отходы стекловаты', class: '4' },
  { code: '8 12 110 01 61 4', name: 'Отходы линолеума', class: '4' },
  { code: '8 12 111 01 61 4', name: 'Отходы ламината', class: '4' },
  { code: '8 12 112 01 61 4', name: 'Отходы паркетной доски', class: '4' },
  { code: '8 12 113 01 61 4', name: 'Отходы сэндвич-панелей', class: '4' },
  { code: '8 12 114 01 61 4', name: 'Отходы профнастила', class: '4' },
  { code: '8 12 115 01 61 4', name: 'Отходы металлочерепицы', class: '4' },
  { code: '8 12 116 01 61 4', name: 'Отходы кровельных материалов битумных', class: '4' },

  // Отходы упаковки и тары
  { code: '4 38 125 11 24 5', name: 'Тара картонная чистая', class: '5' },
  { code: '4 38 125 12 24 5', name: 'Тара картонная загрязненная', class: '5' },
  { code: '4 38 126 11 24 5', name: 'Тара бумажная', class: '5' },
  { code: '4 38 127 11 24 5', name: 'Тара деревянная чистая', class: '5' },
  { code: '4 38 127 12 24 5', name: 'Тара деревянная загрязненная', class: '5' },
  { code: '4 38 128 11 24 5', name: 'Тара металлическая чистая', class: '5' },
  { code: '4 38 128 12 24 5', name: 'Тара металлическая загрязненная', class: '5' },
  { code: '4 38 129 11 24 5', name: 'Тара стеклянная чистая', class: '5' },
  { code: '4 38 129 12 24 5', name: 'Тара стеклянная загрязненная', class: '5' },
  { code: '4 38 130 11 24 5', name: 'Стрейч-пленка', class: '5' },
  { code: '4 38 131 11 24 5', name: 'Скорлупа полиэтиленовая', class: '5' },
  { code: '4 38 132 11 24 5', name: 'Лента полипропиленовая', class: '5' },

  // Отходы металлообработки
  { code: '3 01 201 01 21 4', name: 'Стружка стальная', class: '4' },
  { code: '3 01 201 02 21 4', name: 'Стружка чугунная', class: '4' },
  { code: '3 01 201 03 21 4', name: 'Стружка алюминиевая', class: '4' },
  { code: '3 01 201 04 21 4', name: 'Стружка медная', class: '4' },
  { code: '3 01 201 05 21 4', name: 'Стружка бронзовая', class: '4' },
  { code: '3 01 201 06 21 4', name: 'Стружка латунная', class: '4' },
  { code: '3 01 202 01 21 4', name: 'Шлак сварочный', class: '4' },
  { code: '3 01 203 01 21 4', name: 'Окалина стальная', class: '4' },
  { code: '3 01 204 01 21 4', name: 'Абразивные круги отработанные', class: '4' },
  { code: '3 01 205 01 21 4', name: 'Отходы шлифовальных материалов', class: '4' },

  // Отходы сельского хозяйства
  { code: '1 11 100 01 21 4', name: 'Навоз крупного рогатого скота', class: '4' },
  { code: '1 11 100 02 21 4', name: 'Навоз свиной', class: '4' },
  { code: '1 11 100 03 21 4', name: 'Помет птичий', class: '4' },
  { code: '1 11 200 01 21 4', name: 'Солома зерновых', class: '4' },
  { code: '1 11 200 02 21 4', name: 'Сено', class: '4' },
  { code: '1 11 300 01 21 4', name: 'Силос', class: '4' },
  { code: '1 11 400 01 21 4', name: 'Отходы овощехранилищ', class: '4' },
  { code: '1 11 500 01 21 4', name: 'Шелуха подсолнечника', class: '4' },
  { code: '1 11 501 01 21 4', name: 'Лузга гречихи', class: '4' },
  { code: '1 11 502 01 21 4', name: 'Шрот подсолнечный', class: '4' },
  { code: '1 11 600 01 21 4', name: 'Жмых льняной', class: '4' },

  // Отходы лакокрасочных материалов
  { code: '4 41 110 01 32 3', name: 'Краски акриловые просроченные', class: '3' },
  { code: '4 41 110 02 32 3', name: 'Краски масляные просроченные', class: '3' },
  { code: '4 41 110 03 32 3', name: 'Краски порошковые просроченные', class: '3' },
  { code: '4 41 120 01 32 3', name: 'Лаки просроченные', class: '3' },
  { code: '4 41 130 01 32 3', name: 'Грунтовки просроченные', class: '3' },
  { code: '4 41 140 01 32 3', name: 'Шпатлевки просроченные', class: '3' },
  { code: '4 41 150 01 32 3', name: 'Шпатлевки полиэфирные', class: '3' },
  { code: '4 41 160 01 32 3', name: 'Отвердители для красок', class: '3' },
  { code: '4 41 170 01 32 3', name: 'Тара из-под лакокрасочных материалов', class: '4' },

  // Отходы химических производств
  { code: '4 42 100 01 31 4', name: 'Кислота серная отработанная', class: '4' },
  { code: '4 42 200 01 31 4', name: 'Кислота соляная отработанная', class: '4' },
  { code: '4 42 300 01 31 4', name: 'Кислота азотная отработанная', class: '4' },
  { code: '4 42 400 01 31 4', name: 'Кислота ортофосфорная отработанная', class: '4' },
  { code: '4 43 100 01 31 4', name: 'Щелочи отработанные', class: '4' },
  { code: '4 44 100 01 31 4', name: 'Органические растворители отработанные', class: '4' },
  { code: '4 44 200 01 31 4', name: 'Ацетон отработанный', class: '4' },
  { code: '4 44 300 01 31 4', name: 'Бензол отработанный', class: '4' },
  { code: '4 44 400 01 31 4', name: 'Толуол отработанный', class: '4' },
  { code: '4 44 500 01 31 4', name: 'Уайт-спирит отработанный', class: '4' },

  // Отходы водоочистки и водоподготовки
  { code: '7 24 100 01 41 4', name: 'Отработанные ионообменные смолы', class: '4' },
  { code: '7 24 200 01 41 4', name: 'Отработанные загрузки фильтров', class: '4' },
  { code: '7 24 300 01 41 4', name: 'Отработанный активированный уголь', class: '4' },
  { code: '7 24 400 01 41 4', name: 'Отходы мембранных установок', class: '4' },
  { code: '7 24 500 01 41 4', name: 'Отходы обезжелезивания воды', class: '4' },
  { code: '7 24 600 01 41 4', name: 'Отходы умягчения воды', class: '4' },

  // Отходы энергетики
  { code: '3 02 100 01 21 4', name: 'Зола угольная', class: '4' },
  { code: '3 02 100 02 21 4', name: 'Шлак угольный', class: '4' },
  { code: '3 02 100 03 21 4', name: 'Золошлаковая смесь', class: '4' },
  { code: '3 02 200 01 21 4', name: 'Зола древесная', class: '4' },
  { code: '3 02 300 01 21 4', name: 'Отходы сжигания мазута', class: '4' },
  { code: '3 02 400 01 21 4', name: 'Отходы газоочистки котельных', class: '4' },

  // Текстильные отходы
  { code: '3 04 100 01 20 4', name: 'Отходы хлопчатобумажные', class: '4' },
  { code: '3 04 100 02 20 4', name: 'Отходы синтетических тканей', class: '4' },
  { code: '3 04 100 03 20 4', name: 'Отходы шерстяные', class: '4' },
  { code: '3 04 100 04 20 4', name: 'Отходы льняные', class: '4' },
  { code: '3 04 200 01 20 4', name: 'Обрезь кожи', class: '4' },
  { code: '3 04 200 02 20 4', name: 'Кожевенная пыль', class: '4' },

  // Отходы резины и пластмасс
  { code: '4 31 100 01 24 5', name: 'Отходы резины невулканизированной', class: '5' },
  { code: '4 31 100 02 24 5', name: 'Резиновая крошка', class: '5' },
  { code: '4 31 100 03 24 5', name: 'Резиновая пыль', class: '5' },
  { code: '4 31 300 01 25 5', name: 'Отходы конвейерных лент', class: '5' },
  { code: '4 38 200 01 24 5', name: 'Отходы ПВХ', class: '5' },
  { code: '4 38 200 02 24 5', name: 'Отходы полиуретана', class: '5' },
  { code: '4 38 200 03 24 5', name: 'Отходы полиамида', class: '5' },
  { code: '4 38 200 04 24 5', name: 'Отходы поликарбоната', class: '5' },
  { code: '4 38 200 05 24 5', name: 'Отходы оргстекла', class: '5' },
  { code: '4 38 200 06 24 5', name: 'Отходы фторопласта', class: '5' },

  // Прочие отходы
  { code: '7 44 100 01 20 4', name: 'Смет с территории', class: '4' },
  { code: '7 44 200 01 20 4', name: 'Песок, загрязненный нефтепродуктами', class: '4' },
  { code: '7 44 300 01 20 4', name: 'Грунт, загрязненный нефтепродуктами', class: '4' },
  { code: '7 44 400 01 20 4', name: 'Отходы уборки территории предприятия', class: '4' },
  { code: '7 44 500 01 20 4', name: 'Снег загрязненный', class: '4' },
  { code: '7 44 600 01 20 4', name: 'Лед загрязненный', class: '4' },
  { code: '7 99 100 01 20 4', name: 'Отходы (мусор) от уборки помещений', class: '4' },

  // Сельхозотходы, животноводство
  { code: '1 11 100 01 21 4', name: 'Навоз крупного рогатого скота (подстилочный)', class: '4' },
  { code: '1 11 100 02 21 4', name: 'Навоз КРС (бесподстилочный)', class: '4' },
  { code: '1 11 100 03 21 4', name: 'Помет птичий (куриный)', class: '4' },
  { code: '1 11 100 04 21 4', name: 'Помет птичий (индюшиный)', class: '4' },
  { code: '1 11 200 01 21 4', name: 'Солома зерновых культур', class: '4' },
  { code: '1 11 200 02 21 4', name: 'Сено', class: '4' },
  { code: '1 11 300 01 21 4', name: 'Силос', class: '4' },
  { code: '1 11 400 01 21 4', name: 'Сенаж', class: '4' },
  { code: '1 11 500 01 21 4', name: 'Отходы силоса', class: '4' },
  { code: '1 11 600 01 21 4', name: 'Отходы кормоцеха', class: '4' },
  { code: '1 11 700 01 21 4', name: 'Зерновые отходы (отходы элеватора)', class: '4' },
  { code: '1 11 800 01 21 4', name: 'Жом свекловичный', class: '4' },
  { code: '1 11 900 01 21 4', name: 'Барда зерновая', class: '4' },
  { code: '1 11 901 01 21 4', name: 'Меласса (кормовая патока) отходы', class: '4' },
  { code: '1 12 100 01 21 4', name: 'Отходы санитарного забоя животных', class: '3' },
  { code: '1 12 100 02 21 4', name: 'Биологические отходы (павшие животные)', class: '3' },
  { code: '1 12 200 01 21 4', name: 'Ветеринарные отходы', class: '3' },
  { code: '1 12 300 01 21 4', name: 'Отходы убоя скота (шкуры, шерсть)', class: '4' },
  { code: '1 12 300 02 21 4', name: 'Кровь животных (отходы)', class: '4' },
  { code: '1 12 300 03 21 4', name: 'Жир животный технический (отходы)', class: '4' },
  { code: '1 99 100 01 21 4', name: 'Просроченная молочная продукция', class: '4' },
  { code: '1 99 100 02 21 4', name: 'Отходы молокозавода', class: '4' },
  { code: '1 99 100 03 21 4', name: 'Отходы сыроделия (сыворотка)', class: '4' },
  { code: '1 99 100 04 21 4', name: 'Отходы маслоделия (пахта)', class: '4' },
  { code: '1 99 200 01 21 4', name: 'Отходы моек оборудования пищевых производств', class: '4' },
  { code: '1 99 300 01 21 4', name: 'Осадок очистки сточных вод пищевого производства', class: '4' },
  // Офисные отходы (для любого эксперта / консультанта)
  { code: '7 33 100 01 72 4', name: 'Мусор от офисных помещений', class: '4' },
  { code: '7 33 110 01 72 4', name: 'Отходы канцелярской продукции', class: '4' },
  { code: '7 33 120 01 72 4', name: 'Макулатура офисная', class: '5' },
  { code: '4 38 121 11 24 5', name: 'Тара полиэтиленовая от офисной техники', class: '5' },
  { code: '4 82 300 01 52 4', name: 'Люминесцентные лампы отработанные', class: '2' },
  { code: '4 82 301 01 52 4', name: 'Светодиодные лампы отработанные', class: '4' },
  { code: '4 82 200 01 52 4', name: 'Компьютерная техника устаревшая', class: '4' },
  { code: '4 82 200 02 52 4', name: 'Оргтехника устаревшая', class: '4' },
  { code: '4 82 400 01 52 4', name: 'Кабели и провода (от офиса)', class: '4' },
  { code: '4 38 125 11 24 5', name: 'Картон от офисной упаковки', class: '5' },
  { code: '4 38 125 12 24 5', name: 'Картон загрязненный', class: '5' },
  { code: '7 33 130 01 72 4', name: 'Крупногабаритный мусор офисный', class: '4' },
  { code: '7 33 140 01 72 4', name: 'Отходы уборки офисных помещений', class: '4' },
  { code: '4 06 130 01 31 4', name: 'Обтирочный материал загрязненный (принтеры)', class: '4' },
  { code: '4 34 200 01 31 4', name: 'Аккумуляторы от ИБП отработанные', class: '4' },
  { code: '3 04 100 01 20 4', name: 'Отходы мягкой мебели (офис)', class: '4' },

  // Текстильные отходы
  { code: '3 04 100 01 20 4', name: 'Отходы хлопчатобумажной ткани', class: '4' },
  { code: '3 04 100 02 20 4', name: 'Отходы синтетических тканей (полиэстер)', class: '4' },
  { code: '3 04 100 03 20 4', name: 'Отходы шерстяной ткани', class: '4' },
  { code: '3 04 100 04 20 4', name: 'Отходы льняной ткани', class: '4' },
  { code: '3 04 100 05 20 4', name: 'Отходы вискозной ткани', class: '4' },
  { code: '3 04 100 06 20 4', name: 'Отходы шелковой ткани', class: '4' },
  { code: '3 04 100 07 20 4', name: 'Отходы нетканых материалов', class: '4' },
  { code: '3 04 100 08 20 4', name: 'Отходы трикотажного полотна', class: '4' },
  { code: '3 04 200 01 20 4', name: 'Концы пряжи (отходы прядения)', class: '4' },
  { code: '3 04 200 02 20 4', name: 'Сливы пряжи', class: '4' },
  { code: '3 04 200 03 20 4', name: 'Отходы ниток', class: '4' },
  { code: '3 04 300 01 20 4', name: 'Отходы красильно-отделочного производства', class: '4' },
  { code: '3 04 300 02 20 4', name: 'Отходы тканевой пыли', class: '4' },
  { code: '3 04 300 03 20 4', name: 'Шлихта отработанная', class: '4' },
  { code: '3 04 400 01 20 4', name: 'Отходы упаковочной ткани', class: '4' },
  { code: '3 04 500 01 20 4', name: 'Бой ткацких челноков', class: '4' },
  { code: '3 04 600 01 20 4', name: 'Отходы синтетических волокон', class: '4' },
  { code: '3 04 600 02 20 4', name: 'Полипропиленовая фибра отходы', class: '4' },
  { code: '3 04 700 01 20 4', name: 'Осаждения красильных ванн', class: '4' },
  { code: '3 04 800 01 20 4', name: 'Масла технические ткацких станков отработанные', class: '3' },
  { code: '4 38 121 11 24 5', name: 'Тара полиэтиленовая от красителей', class: '5' },
  { code: '4 38 121 12 24 5', name: 'Тара полиэтиленовая загрязненная красителями', class: '5' },
  { code: '4 06 130 01 31 4', name: 'Обтирочный материал ткацких станков', class: '4' },
  { code: '4 31 200 01 99 5', name: 'Транспортные ленты отработанные', class: '5' },
  { code: '4 31 300 01 25 5', name: 'Приводные ремни отработанные', class: '5' },
];

// === ЛОГИКА АВТОКОМПЛИТА ДЛЯ ЖДО (TRANSFER) ===

// Ссылки на инпуты ЖДО
const transferNameInput = ref(null);
const transferCodeInput = ref(null);

const showTransferNameSuggestions = ref(false);
const showTransferCodeSuggestions = ref(false);

// === ФИЛЬТРАЦИЯ НАЗВАНИЙ ДЛЯ ЖДО ===
const transferNameSuggestions = computed(() => {
  const query = newTransfer.value.waste_type.toLowerCase().trim();
  if (!query) return [];
  return FKKO_DB.filter(item => item.name.toLowerCase().startsWith(query)).slice(0, 10);
});

function handleTransferNameInput(event) {
  showTransferNameSuggestions.value = true;
  const val = event.target.value;
  newTransfer.value.waste_type = val;

  if (!val || !val.trim()) {
    newTransfer.value.fkko_code = '';
    newTransfer.value.hazard_class = '';
    showTransferNameSuggestions.value = false;
    return;
  }

  const exactMatch = FKKO_DB.find(item => item.name.toLowerCase() === val.toLowerCase());
  if (exactMatch) {
    newTransfer.value.fkko_code = exactMatch.code;
    newTransfer.value.hazard_class = exactMatch.class;
  } else {
    newTransfer.value.fkko_code = '';
    newTransfer.value.hazard_class = '';
  }
}

async function selectTransferNameSuggestion(item) {
  newTransfer.value.waste_type = item.name;
  newTransfer.value.fkko_code = item.code;
  newTransfer.value.hazard_class = item.class;

  // Android Fix: прямое вмешательство в DOM
  if (transferNameInput.value) {
    transferNameInput.value.value = item.name;
    transferNameInput.value.dispatchEvent(new Event('input', { bubbles: true }));
  }

  showTransferNameSuggestions.value = false;
  await nextTick();
  if (transferNameInput.value) transferNameInput.value.focus();
}


// === ФИЛЬТРАЦИЯ КОДОВ ДЛЯ ЖДО ===
const transferCodeSuggestions = computed(() => {
  const query = newTransfer.value.fkko_code.replace(/\s/g, '').toLowerCase();
  if (!query) return [];
  return FKKO_DB.filter(item => item.code.replace(/\s/g, '').toLowerCase().startsWith(query)).slice(0, 10);
});

function handleTransferCodeInput() {
  showTransferCodeSuggestions.value = true;
  const val = newTransfer.value.fkko_code;
  const cleanInput = val.replace(/\s/g, '');

  if (!cleanInput) {
    newTransfer.value.waste_type = '';
    newTransfer.value.hazard_class = '';
    showTransferCodeSuggestions.value = false;
    return;
  }

  const exactMatch = FKKO_DB.find(item => item.code.replace(/\s/g, '') === cleanInput);
  if (exactMatch) {
    newTransfer.value.waste_type = exactMatch.name;
    newTransfer.value.hazard_class = exactMatch.class;
  } else {
    newTransfer.value.waste_type = '';
    newTransfer.value.hazard_class = '';
  }
}

async function selectTransferCodeSuggestion(item) {
  newTransfer.value.fkko_code = item.code;
  newTransfer.value.waste_type = item.name;
  newTransfer.value.hazard_class = item.class;

  // Android Fix: прямое вмешательство в DOM
  if (transferCodeInput.value) {
    transferCodeInput.value.value = item.code;
    transferCodeInput.value.dispatchEvent(new Event('input', { bubbles: true }));
  }

  showTransferCodeSuggestions.value = false;
  await nextTick();
  if (transferCodeInput.value) transferCodeInput.value.focus();
}


</script>
