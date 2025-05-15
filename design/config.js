const searchInput = document.getElementById('search');
const searchSuggestions = document.getElementById('searchSuggestions');
const suggestionList = document.getElementById('suggestionList');
const searchHistory = document.getElementById('searchHistory');
const openHistoryButton = document.getElementById('openHistoryButton');
const historyModal = document.getElementById('historyModal');
const closeHistoryButton = document.getElementById('closeHistoryButton');
const clearHistoryButton = document.getElementById('clearHistoryButton');
let suggestions = []; // Array de sugestões da tabela

// Faz uma solicitação GET para a rota /buscar_dados da sua API
// Função para buscar dados da API e atualizar a tabela
async function fetchDataAndPopulateTable() {
    try {
        const response = await fetch('http://localhost:5000/buscar_dados', {
            headers: {
                'Accept': 'application/json'
            }
        });

        // Verificação adicional
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            throw new TypeError("A resposta não é JSON");
        }

        const data = await response.json();
        
        // Limpe a tabela corretamente
        const table = document.getElementById('data-table');
        const tbody = table.querySelector('tbody') || table.createTBody();
        tbody.innerHTML = '';

        // Preencha os dados
        data.forEach(item => {
            const row = tbody.insertRow();
            row.innerHTML = `
                <td class="py-2 px-1 border border-gray-300 w-1/2 sm:w-1/4">${item.codigo}</td>
                <td class="py-2 px-4 border border-gray-300 w-1/2 sm:w-3/4">${item.descricao}</td>
            `;
        });
    } catch (error) {
        console.error('Erro detalhado:', error);
        // Feedback visual para o usuário
        document.getElementById('data-table').innerHTML = `
            <tr><td colspan="2" class="text-red-500 p-4 text-center">
                Erro ao carregar dados: ${error.message}
            </td></tr>
        `;
    }
}
  
  // Chame a função para buscar dados e atualizar a tabela
fetchDataAndPopulateTable();
  
 // Variável global para armazenar a pesquisa completa
 var pesquisaCompleta = "";

 // Função para verificar se o Enter foi pressionado
 function verificarEnter(event) {
   if (event.keyCode === 13) {
     // Quando o usuário pressiona Enter, armazene o valor completo da pesquisa
     pesquisaCompleta = document.getElementById("search").value;
   }
 }

 // Função para armazenar o valor da pesquisa quando o usuário sai do campo de pesquisa
 function armazenarPesquisa() {
   // Obtenha o valor digitado pelo usuário
   var valorDaPesquisa = document.getElementById("search").value;

   // Atualize a pesquisa completa apenas se o valor não estiver vazio
   if (valorDaPesquisa.trim() !== "") {
     pesquisaCompleta = valorDaPesquisa;
   }

   // Faça algo com o valor da pesquisa completa
   console.log("Valor da pesquisa completa: " + pesquisaCompleta);
 }

clearHistoryButton.addEventListener('click', () => {
    confirmationMessage.classList.remove('hidden'); // Mostra a mensagem de confirmação
});

confirmDeleteButton.addEventListener('click', () => {
    clearSearchHistory(); // Limpa o histórico de pesquisa
    confirmationMessage.classList.add('hidden'); // Oculta a mensagem de confirmação
});

cancelDeleteButton.addEventListener('click', () => {
    confirmationMessage.classList.add('hidden'); // Oculta a mensagem de confirmação
});
document.getElementById('confirmDeleteButton').addEventListener('click', () => {
    clearSearchHistory();
    showSuccessMessage();
});

function showSuccessMessage() {
    const successMessage = document.getElementById('successMessage');
    successMessage.classList.remove('hidden');

    setTimeout(() => {
        successMessage.classList.add('hidden');
    }, 1500); // Esconde a mensagem de sucesso após 3 segundos (ajustado para 3 segundos)
}

// Barra de Pesquisa no Histórico
// Barra de Pesquisa no Histórico
const searchHistoryInput = document.getElementById('searchHistoryInput');
searchHistoryInput.addEventListener('input', () => {
    filterSearchHistory();
});

// Filtra o Histórico de Pesquisa com base no que o usuário digita
function filterSearchHistory() {
    const query = searchHistoryInput.value.toLowerCase();
    const historyItems = document.querySelectorAll('#searchHistory li');
    historyItems.forEach(item => {
        const text = item.textContent.toLowerCase();
        if (text.includes(query)) {
            // Remove tags <mark> existentes para redefinir o destaque
            item.innerHTML = item.textContent;
            // Destaca o texto correspondente
            const highlightedText = highlightMatch(item.textContent, query);
            item.innerHTML = highlightedText;
            item.style.display = 'block';
        } else {
            item.style.display = 'none';
        }
    });
}

// Função para destacar o texto correspondente com tags <mark>
function highlightMatch(text, query) {
    const regex = new RegExp(`(${query})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
}
// Verifica se o histórico já foi limpado antes
const hasHistoryCleared = localStorage.getItem('historyCleared');

// Se o histórico já foi limpado antes, esconde a mensagem de sucesso
if (hasHistoryCleared) {
    const successMessage = document.getElementById('successMessage');
    successMessage.classList.add('hidden');
}

clearHistoryButton.addEventListener('click', () => {
    // Se o histórico já foi limpado antes, não faz nada
    if (hasHistoryCleared) {
        return;
    }

    // Caso contrário, exibe a mensagem de sucesso e define que o histórico já foi limpado
    showSuccessMessage();
    localStorage.setItem('historyCleared', 'true');
});

function clearSearchHistory() {
    localStorage.removeItem('searchHistory'); // Remove o histórico do localStorage
    searchHistory.innerHTML = ''; // Limpa a lista de histórico exibida na página
    hideHistoryModal(); // Fecha o modal de histórico de pesquisa
}

// Extrai sugestões da tabela
const tableRows = document.querySelectorAll('table tbody tr');
tableRows.forEach(row => {
    const campo = row.querySelector('td:nth-child(1)').textContent.trim();
    const descricao = row.querySelector('td:nth-child(2)').textContent.trim();
    suggestions.push(`${campo} - ${descricao}`);
});

searchInput.addEventListener('input', () => {
    displaySearchSuggestions();
});

searchInput.addEventListener('click', () => {
    displaySearchSuggestions();
});

searchInput.addEventListener('keydown', (event) => {
// Dentro do evento de pressionar Enter no campo de pesquisa
if (event.key === 'Enter') {
    const selectedSuggestion = suggestionList.querySelector('li.active');
    if (selectedSuggestion) {
        // Se uma sugestão estiver selecionada, use o valor da sugestão como pesquisa
        const suggestionValue = selectedSuggestion.textContent;
        searchInput.value = suggestionValue;

        // Salve a pesquisa no histórico
        addToSearchHistory(suggestionValue);

        // Oculte as sugestões
        searchSuggestions.classList.add('hidden');

        // Limpa a classe "active" da sugestão selecionada
        selectedSuggestion.classList.remove('active');
    } else {
        // Se nenhuma sugestão estiver selecionada, use o valor do campo de pesquisa
        const query = searchInput.value.trim();
        if (query !== '') {
            // Salve a pesquisa no histórico
            addToSearchHistory(query);
        }
    }

    // Limpa o campo de pesquisa após salvar a pesquisa no histórico
    searchInput.value = '';

    // Oculta as sugestões após pressionar Enter
    searchSuggestions.classList.add('hidden');
} else if (event.key === 'Tab') {
        if (!searchSuggestions.classList.contains('hidden') && suggestions.length > 0) {
            event.preventDefault(); // Impede o comportamento padrão da tecla "TAB"
            const selectedSuggestion = suggestionList.querySelector('li.active');
            if (!selectedSuggestion) {
                // Se nenhuma sugestão estiver selecionada, selecione a primeira sugestão
                const firstSuggestion = suggestionList.querySelector('li');
                if (firstSuggestion) {
                    firstSuggestion.classList.add('active', 'suggestion-indicator');
                    searchInput.value = firstSuggestion.textContent; // Preenche a barra de pesquisa com a primeira sugestão
                }
            } else {
                // Desselecione a sugestão atual
                selectedSuggestion.classList.remove('active', 'suggestion-indicator');
                // Encontre a próxima sugestão
                const nextSuggestion = selectedSuggestion.nextSibling;
                if (nextSuggestion) {
                    // Se houver uma próxima sugestão, selecione-a
                    nextSuggestion.classList.add('active', 'suggestion-indicator');
                    searchInput.value = nextSuggestion.textContent; // Preenche a barra de pesquisa com a sugestão selecionada
                } else {
                    // Se não houver próxima sugestão, selecione a primeira sugestão
                    const firstSuggestion = suggestionList.querySelector('li');
                    if (firstSuggestion) {
                        firstSuggestion.classList.add('active', 'suggestion-indicator');
                        searchInput.value = firstSuggestion.textContent; // Preenche a barra de pesquisa com a primeira sugestão
                    }
                }
            }
        }
    }
});
// Fechar a lista de sugestões ao pressionar a tecla 'ESC'
document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
        searchSuggestions.classList.add('hidden');
    }
});
searchInput.addEventListener('click', (event) => {
    event.stopPropagation();
});

// Fechar a lista de sugestões ao clicar em qualquer lugar da tela (exceto na barra de pesquisa)
document.addEventListener('click', (event) => {
    const isSearchInput = event.target === searchInput;
    const isSuggestionList = event.target === suggestionList || suggestionList.contains(event.target);

    if (!isSearchInput && !isSuggestionList) {
        searchSuggestions.classList.add('hidden');
    }
});

// Adicione um evento de escuta para desativar a sugestão selecionada ao clicar em qualquer lugar da página
document.addEventListener('click', () => {
    const selectedSuggestion = suggestionList.querySelector('li.active');
    if (selectedSuggestion) {
        selectedSuggestion.classList.remove('active');
    }
});

function scrollToTableRow(query) {
    const tableRow = document.getElementById(query);
    if (tableRow) {
        tableRow.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}
openHistoryButton.addEventListener('click', () => {
    showHistoryModal();
});

closeHistoryButton.addEventListener('click', () => {
    hideHistoryModal();
});


function displaySearchSuggestions() {
    const userQuery = searchInput.value.toLowerCase();
    suggestionList.innerHTML = '';

    if (userQuery === '') {
        searchSuggestions.classList.add('hidden');
        return;
    }

    let found = false;

    suggestions.forEach(suggestion => {
        const suggestionLC = suggestion.toLowerCase();
        if (suggestionLC.includes(userQuery)) {
            found = true;
            const li = document.createElement('li');
            const highlightedSuggestion = highlightMatch(suggestion, userQuery);
            li.innerHTML = highlightedSuggestion;
            li.addEventListener('click', () => {
                searchInput.value = suggestion; // Preenche a barra de pesquisa com a sugestão completa
                searchSuggestions.classList.add('hidden'); // Esconde as sugestões
                searchInput.focus(); // Move o foco de volta para a barra de pesquisa
        });
            suggestionList.appendChild(li);
        }
    });

    if (!found) {
        searchSuggestions.classList.add('hidden');
        return;
    }

    searchSuggestions.classList.remove('hidden');
}


function highlightMatch(suggestion, query) {
    const regex = new RegExp(`(${query})`, 'gi');
    return suggestion.replace(regex, '<span class="bg-yellow-300">$1</span>');
}

function addToSearchHistory(query) {
    const now = new Date();
    const formattedDate = now.toLocaleDateString(); // Apenas a data, sem a hora

    const historyItem = {
        query: query,
        date: formattedDate,
    };

    const history = JSON.parse(localStorage.getItem('searchHistory')) || [];
    history.push(historyItem);
    localStorage.setItem('searchHistory', JSON.stringify(history));

    const li = document.createElement('li');
    li.textContent = `${formattedDate}: ${query}`;
    searchHistory.appendChild(li);
}

function showHistoryModal() {
    historyModal.classList.remove('hidden');
}

function hideHistoryModal() {
    historyModal.classList.add('hidden');
}

// Recupera e exibe o histórico de pesquisa ao carregar a página
const savedHistory = JSON.parse(localStorage.getItem('searchHistory')) || [];
savedHistory.forEach(historyItem => {
    const li = document.createElement('li');
    li.textContent = `${historyItem.date}: ${historyItem.query}`;
    searchHistory.appendChild(li);
});