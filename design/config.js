// Elementos DOM
const searchInput = document.getElementById('search');
const suggestionList = document.getElementById('suggestionList');
const searchHistoryInput = document.getElementById('searchHistoryInput');
const searchHistory = document.getElementById('searchHistory');
const elements = {
    table: document.getElementById('data-table'),
    tbody: document.querySelector('#data-table tbody'),
    paginationControls: document.getElementById('paginationControls'),
    currentPage: document.getElementById('currentPage'),
    loadingOverlay: document.getElementById('loadingOverlay'),
    infoContent: document.getElementById('infoContent')
};

// Configurações
const itemsPerPage = 20;
const searchHistoryKey = 'protable_search_history';
let currentPage = 1;
let totalItems = 0;
let allData = [];
let filteredData = [];
let isSearching = false;
let searchHistoryItems = JSON.parse(localStorage.getItem(searchHistoryKey)) || [];

// Debounce para otimizar pesquisas
const debounce = (func, timeout = 300) => {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => func.apply(this, args), timeout);
    };
};

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
        const response = await fetch(`http://localhost:5000/buscar_dados?page=1&limit=${itemsPerPage}`);
        const data = await response.json();
        allData = data.items;
        totalItems = data.total;
        populateTable(allData);
        updatePaginationControls();
    } catch (error) {
        handleDataError(error);
    } finally {
        hideLoading();
    }
}

// Popular tabela com dados
function populateTable(items) {
    const fragment = document.createDocumentFragment();
    
    items.forEach(item => {
        const row = document.createElement('tr');
        row.className = 'hover:bg-gray-50 smooth-transition';
        row.innerHTML = `
            <td class="py-2 px-4 border">${item.codigo}</td>
            <td class="py-2 px-4 border">${item.descricao}</td>
        `;
        row.addEventListener('click', () => showItemDetails(item));
        fragment.appendChild(row);
    });

    elements.tbody.innerHTML = '';
    elements.tbody.appendChild(fragment);
}

// Mostrar detalhes do item
function showItemDetails(item) {
    elements.infoContent.innerHTML = `
        <h3 class="font-bold text-lg mb-2">${item.codigo}</h3>
        <p class="mb-2">${item.descricao}</p>
        <p class="text-sm text-gray-500">Última atualização: ${new Date().toLocaleString()}</p>
    `;
}

// Buscar dados com paginação
async function fetchPaginatedData(page) {
    showLoading();
    try {
        const url = isSearching 
            ? `http://localhost:5000/buscar_dados?search=${encodeURIComponent(searchInput.value)}&page=${page}&limit=${itemsPerPage}`
            : `http://localhost:5000/buscar_dados?page=${page}&limit=${itemsPerPage}`;
        
        const response = await fetch(url);
        const data = await response.json();
        
        filteredData = data.items;
        totalItems = data.total;
        populateTable(filteredData);
        updatePaginationControls();
    } catch (error) {
        handleDataError(error);
    } finally {
        hideLoading();
    }
}

// Atualizar controles de paginação
function updatePaginationControls() {
    elements.currentPage.textContent = `Página ${currentPage} de ${Math.ceil(totalItems/itemsPerPage)}`;
    document.getElementById('prevPage').disabled = currentPage === 1;
    document.getElementById('nextPage').disabled = (currentPage * itemsPerPage) >= totalItems;
}

// Manipulação do histórico de pesquisa
function addToSearchHistory(query) {
    if (!query.trim()) return;
    
    // Remove duplicatas e limita a 10 itens
    searchHistoryItems = searchHistoryItems.filter(item => item.toLowerCase() !== query.toLowerCase());
    searchHistoryItems.unshift(query);
    searchHistoryItems = searchHistoryItems.slice(0, 10);
    
    localStorage.setItem(searchHistoryKey, JSON.stringify(searchHistoryItems));
    renderSearchHistory();
}

function renderSearchHistory() {
    const filtered = searchHistoryInput.value
        ? searchHistoryItems.filter(item => item.toLowerCase().includes(searchHistoryInput.value.toLowerCase()))
        : searchHistoryItems;
    
    searchHistory.innerHTML = filtered.map(item => `
        <li class="p-3 hover:bg-gray-100 rounded-lg cursor-pointer flex justify-between items-center"
            onclick="applySearchFromHistory('${escapeHtml(item)}')">
            <span>${item}</span>
            <button class="text-red-500 hover:text-red-700" 
                    onclick="removeFromHistory(event, '${escapeHtml(item)}')">
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

// Funções auxiliares
function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
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
        </tr>
    `;
}

// Configuração de eventos
function setupEventListeners() {
    // Pesquisa principal
    searchInput.addEventListener('input', debounce(() => {
        const query = searchInput.value.trim();
        if (query) {
            isSearching = true;
            currentPage = 1;
            fetchPaginatedData(currentPage);
        } else {
            isSearching = false;
            currentPage = 1;
            fetchPaginatedData(currentPage);
        }
    }));

    // Salvar pesquisa apenas ao pressionar Enter
    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const query = searchInput.value.trim();
            if (query) {
                addToSearchHistory(query);
            }
        }
    });

    // Controles de paginação
    document.getElementById('nextPage').addEventListener('click', () => {
        currentPage++;
        fetchPaginatedData(currentPage);
    });

    document.getElementById('prevPage').addEventListener('click', () => {
        currentPage = Math.max(1, currentPage - 1);
        fetchPaginatedData(currentPage);
    });

    // Histórico de pesquisa
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

    searchHistoryInput.addEventListener('input', () => {
        renderSearchHistory();
    });

    // Fechar modais ao clicar fora
    document.addEventListener('click', (e) => {
        if (e.target === document.getElementById('historyModal')) {
            document.getElementById('historyModal').classList.add('hidden');
        }
    });

    // Tecla ESC para fechar modais
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.getElementById('historyModal').classList.add('hidden');
            document.getElementById('searchSuggestions').classList.add('hidden');
        }
    });
}

// Funções globais para uso no HTML
window.applySearchFromHistory = (query) => {
    searchInput.value = query;
    document.getElementById('historyModal').classList.add('hidden');
    isSearching = true;
    currentPage = 1;
    fetchPaginatedData(currentPage);
};

window.removeFromHistory = (event, query) => {
    event.stopPropagation();
    searchHistoryItems = searchHistoryItems.filter(item => item !== query);
    localStorage.setItem(searchHistoryKey, JSON.stringify(searchHistoryItems));
    renderSearchHistory();
};