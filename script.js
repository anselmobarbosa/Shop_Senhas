document.addEventListener('DOMContentLoaded', () => {
    const addStoreForm = document.getElementById('add-store-form');
    const storeNumberInput = document.getElementById('store-number');
    const storePasswordInput = document.getElementById('store-password');
    const searchInput = document.getElementById('search-store-number');
    const searchResultDiv = document.getElementById('search-result');
    const storeList = document.getElementById('store-list');
    const toast = document.getElementById('toast');
    const importForm = document.getElementById('import-form');
    const bulkImportData = document.getElementById('bulk-import-data');

    let stores = JSON.parse(localStorage.getItem('stores')) || [];

    const saveStores = () => {
        localStorage.setItem('stores', JSON.stringify(stores));
    };

    const showToast = (message, duration = 3000) => {
        toast.textContent = message;
        toast.classList.add('show');
        setTimeout(() => { toast.classList.remove('show'); }, duration);
    };

    const renderStores = () => {
        storeList.innerHTML = '';
        if (stores.length === 0) {
            storeList.innerHTML = '<li class="text-center text-gray-500">Nenhuma loja cadastrada.</li>';
            return;
        }
        const sortedStores = [...stores].sort((a, b) => a.number.localeCompare(b.number, undefined, {numeric: true}));
        sortedStores.forEach(store => {
            const li = document.createElement('li');
            li.className = 'flex items-center justify-between bg-gray-50 p-3 rounded-lg hover:bg-gray-100';
            li.innerHTML = `
                <div>
                    <span class="font-semibold text-indigo-700">Loja: ${store.number}</span>
                    <span class="text-gray-600 ml-4">Senha: ${store.password}</span>
                </div>
                <button data-store-number="${store.number}" class="delete-btn text-red-500 hover:text-red-700">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" style="pointer-events: none;">
                      <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clip-rule="evenodd" />
                    </svg>
                </button>
            `;
            storeList.appendChild(li);
        });
    };

    const addStore = (e) => {
        e.preventDefault();
        const number = storeNumberInput.value.trim();
        const password = storePasswordInput.value.trim();
        if (number && password) {
            if (stores.some(store => store.number === number)) {
                showToast(`A loja número ${number} já existe.`);
                return;
            }
            stores.push({ number, password });
            saveStores();
            renderStores();
            showToast('Loja adicionada com sucesso!');
            addStoreForm.reset();
            storeNumberInput.focus();
        }
    };

    const deleteStore = (e) => {
        const button = e.target.closest('.delete-btn');
        if (button) {
            const storeNumberToDelete = button.dataset.storeNumber;
            const originalIndex = stores.findIndex(s => s.number === storeNumberToDelete);
            if (originalIndex > -1) {
                stores.splice(originalIndex, 1);
                saveStores();
                renderStores();
                showToast(`Loja ${storeNumberToDelete} removida.`);
            }
        }
    };
    
    const searchStore = (e) => {
        const searchTerm = e.target.value.trim().toLowerCase();
        if (!searchTerm) {
            searchResultDiv.innerHTML = '<span class="text-gray-500">A senha aparecerá aqui.</span>';
            return;
        }
        const foundStore = stores.find(store => store.number.toLowerCase() === searchTerm);
        if (foundStore) {
            searchResultDiv.innerHTML = `<div class="text-center"><p class="text-2xl font-bold text-indigo-600">${foundStore.password}</p></div>`;
        } else {
            searchResultDiv.innerHTML = '<span class="text-red-500 font-medium">Loja não encontrada.</span>';
        }
    };

    const importStores = (e) => {
        e.preventDefault();
        const data = bulkImportData.value.trim();
        if (!data) { return; }
        const lines = data.split('\n');
        let importedCount = 0;
        let duplicateCount = 0;
        lines.forEach(line => {
            const parts = line.split(/[,;\t]/).map(part => part.trim());
            if (parts.length === 2) {
                const [number, password] = parts;
                if (number && password) {
                    if (!stores.some(store => store.number === number)) {
                        stores.push({ number, password });
                        importedCount++;
                    } else {
                        duplicateCount++;
                    }
                }
            }
        });
        if (importedCount > 0) {
            saveStores();
            renderStores();
        }
        showToast(`${importedCount} loja(s) importada(s). ${duplicateCount} duplicada(s).`);
        importForm.reset();
    };

    addStoreForm.addEventListener('submit', addStore);
    storeList.addEventListener('click', deleteStore);
    searchInput.addEventListener('input', searchStore);
    importForm.addEventListener('submit', importStores);

    renderStores();
});
