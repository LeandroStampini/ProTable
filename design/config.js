// config.js

// Base da API
const API_BASE = 'http://localhost:5000';

// Elementos DOM
const searchInput = document.getElementById('search');
const suggestionContainer = document.getElementById('searchSuggestions');
const suggestionUl = document.getElementById('suggestionList');
const resetButton = document.getElementById('resetSearchButton');
const searchHistoryInput = document.getElementById('searchHistoryInput');
const searchHistory = document.getElementById('searchHistory');

const elements = {
    tbody: document.querySelector('#data-table tbody'),
    currentPage: document.getElementById('currentPage'),
    loadingOverlay: document.getElementById('loadingOverlay'),
    infoContent: document.getElementById('infoContent')
};

// Configurações
const itemsPerPage = 20;
const searchHistoryKey = 'protable_search_history';
let currentPage = 1;
let totalItems = 0;
let isSearching = false;
let lastSearchTerm = '';

// Carrega e normaliza histórico (strings → objetos)
const rawHistory = JSON.parse(localStorage.getItem(searchHistoryKey)) || [];
let searchHistoryItems = rawHistory.map(item => {
    if (typeof item === 'string') {
        return { query: item, timestamp: new Date().toISOString() };
    }
    return item;
});

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    loadInitialData();
    renderSearchHistory();
    setupEventListeners();
});

// Carregar dados iniciais
async function loadInitialData() {
    showLoading();
    try {
        const resp = await fetch(`${API_BASE}/buscar_dados?page=1&limit=${itemsPerPage}`);
        const data = await resp.json();
        totalItems = data.total;
        populateTable(data.items);
        updatePaginationControls();
    } catch (err) {
        handleDataError(err);
    } finally {
        hideLoading();
    }
}

// Popular tabela
function populateTable(items) {
    const frag = document.createDocumentFragment();
    items.forEach(item => {
        const row = document.createElement('tr');
        row.className = 'hover:bg-gray-50 smooth-transition';
        row.innerHTML = `
            <td class="py-2 px-4 border">${item.codigo}</td>
            <td class="py-2 px-4 border">${item.descricao}</td>
        `;
        row.addEventListener('click', () => showItemDetails(item));
        frag.appendChild(row);
    });
    elements.tbody.innerHTML = '';
    elements.tbody.appendChild(frag);
}

// Detalhes do item
function showItemDetails(item) {
    elements.infoContent.innerHTML = `
        <h3 class="font-bold text-lg mb-2">${item.codigo}</h3>
        <p class="mb-2">${item.descricao}</p>
        <p class="text-sm text-gray-500">Última atualização: ${new Date().toLocaleString()}</p>
    `;
}

// Busca paginada
async function fetchPaginatedData(page) {
    showLoading();
    try {
        const params = new URLSearchParams({ page, limit: itemsPerPage });
        if (isSearching && lastSearchTerm) params.set('search', lastSearchTerm);
        const resp = await fetch(`${API_BASE}/buscar_dados?${params.toString()}`);
        const data = await resp.json();
        totalItems = data.total;
        populateTable(data.items);
        updatePaginationControls();
    } catch (err) {
        handleDataError(err);
    } finally {
        hideLoading();
    }
}

// Atualiza paginação
function updatePaginationControls() {
    const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
    elements.currentPage.textContent = `Página ${currentPage} de ${totalPages}`;
    document.getElementById('prevPage').disabled = currentPage === 1;
    document.getElementById('nextPage').disabled = currentPage >= totalPages;
}

// Histórico
function addToSearchHistory(query) {
    const timestamp = new Date().toISOString();
    searchHistoryItems = searchHistoryItems
        .filter(item => item.query.toLowerCase() !== query.toLowerCase());
    searchHistoryItems.unshift({ query, timestamp });
    searchHistoryItems = searchHistoryItems.slice(0, 10);
    localStorage.setItem(searchHistoryKey, JSON.stringify(searchHistoryItems));
    renderSearchHistory();
}

function renderSearchHistory() {
    const filter = searchHistoryInput.value.trim().toLowerCase();
    const list = searchHistoryItems.filter(item =>
        item.query.toLowerCase().includes(filter)
    );
    searchHistory.innerHTML = list.map(item => `
        <li class="p-3 hover:bg-gray-100 rounded-lg cursor-pointer flex justify-between items-center"
            onclick="applySearchFromHistory('${escapeHtml(item.query)}')">
            <div>
                <span>${item.query}</span><br>
                <small class="text-gray-500">${new Date(item.timestamp).toLocaleString()}</small>
            </div>
            <button class="text-red-500 hover:text-red-700"
                    onclick="removeFromHistory(event, '${escapeHtml(item.query)}')">
                <i class="fas fa-times"></i>
            </button>
        </li>
    `).join('');
}

function clearSearchHistory() {
    searchHistoryItems = [];
    localStorage.removeItem(searchHistoryKey);
    renderSearchHistory();
    showSuccessMessage();
}

// Sugestões
function renderSuggestions() {
    const q = searchInput.value.trim().toLowerCase();
    if (!q) return suggestionContainer.classList.add('hidden');
    const matches = searchHistoryItems
        .filter(item => item.query.toLowerCase().includes(q))
        .slice(0, 5);
    if (!matches.length) return suggestionContainer.classList.add('hidden');
    suggestionUl.innerHTML = matches.map(item => `
        <li class="px-4 py-2" onclick="applySuggestion('${escapeHtml(item.query)}')">
            <div>${item.query}</div>
            <small class="text-gray-400">${new Date(item.timestamp).toLocaleTimeString()}</small>
        </li>
    `).join('');
    suggestionContainer.classList.remove('hidden');
}

// Eventos
function setupEventListeners() {
    searchInput.addEventListener('input', renderSuggestions);

    searchInput.addEventListener('keydown', e => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const q = searchInput.value.trim();
            if (!q) return;
            addToSearchHistory(q);
            lastSearchTerm = q;
            searchInput.value = '';
            suggestionContainer.classList.add('hidden');
            isSearching = true;
            currentPage = 1;
            fetchPaginatedData(currentPage);
        }
    });

    resetButton.addEventListener('click', () => {
        isSearching = false;
        lastSearchTerm = '';
        searchInput.value = '';
        fetchPaginatedData(1);
    });

    document.getElementById('nextPage').addEventListener('click', () => {
        currentPage++;
        fetchPaginatedData(currentPage);
    });
    document.getElementById('prevPage').addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            fetchPaginatedData(currentPage);
        }
    });

    document.getElementById('openHistoryButton').addEventListener('click', () => {
        document.getElementById('historyModal').classList.remove('hidden');
    });
    document.getElementById('closeHistoryButton').addEventListener('click', () => {
        document.getElementById('historyModal').classList.add('hidden');
    });
    document.getElementById('clearHistoryButton').addEventListener('click', () => {
        if (confirm('Tem certeza que deseja limpar todo o histórico de pesquisas?')) {
            clearSearchHistory();
        }
    });
    searchHistoryInput.addEventListener('input', renderSearchHistory);

    document.addEventListener('click', e => {
        if (e.target === document.getElementById('historyModal')) {
            document.getElementById('historyModal').classList.add('hidden');
        }
    });
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') {
            document.getElementById('historyModal').classList.add('hidden');
            suggestionContainer.classList.add('hidden');
        }
    });
}

// Funções Globais
window.applySearchFromHistory = query => {
    lastSearchTerm = query;
    isSearching = true;
    currentPage = 1;
    document.getElementById('historyModal').classList.add('hidden');
    fetchPaginatedData(currentPage);
};
window.removeFromHistory = (e, query) => {
    e.stopPropagation();
    searchHistoryItems = searchHistoryItems.filter(item => item.query !== query);
    localStorage.setItem(searchHistoryKey, JSON.stringify(searchHistoryItems));
    renderSearchHistory();
};
window.applySuggestion = query => {
    lastSearchTerm = query;
    isSearching = true;
    currentPage = 1;
    suggestionContainer.classList.add('hidden');
    fetchPaginatedData(currentPage);
};

// Auxiliares
function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
function showSuccessMessage() {
    const msg = document.getElementById('successMessage');
    msg.classList.remove('hidden');
    setTimeout(() => msg.classList.add('hidden'), 3000);
}
function showLoading() {
    elements.loadingOverlay.classList.remove('hidden');
}
function hideLoading() {
    elements.loadingOverlay.classList.add('hidden');
}
function handleDataError(error) {
    console.error('Erro:', error);
    elements.tbody.innerHTML = `
        <tr>
            <td colspan="2" class="text-red-500 p-4 text-center">
                Erro ao carregar dados: ${error.message}
            </td>
        </tr>`;
}