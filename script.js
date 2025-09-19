document.addEventListener('DOMContentLoaded', () => {
    // ===================================================================
    // NOVA LÓGICA: CONTROLE DE VISUALIZAÇÃO (ADMIN VS. USUÁRIO)
    // ===================================================================
    const setupView = () => {
        const urlParams = new URLSearchParams(window.location.search);
        const isAdmin = urlParams.get('admin') === 'true';

        const adminControls = document.getElementById('admin-controls');
        const adminStoreList = document.getElementById('admin-store-list');
        const headerSubtitle = document.getElementById('header-subtitle');
        const mainLayout = document.getElementById('main-layout');

        if (!isAdmin) {
            // Esconde os painéis de administrador
            if (adminControls) adminControls.style.display = 'none';
            if (adminStoreList) adminStoreList.style.display = 'none';
            if (headerSubtitle) headerSubtitle.style.display = 'none';

            // Centraliza o painel de busca para o usuário
            if (mainLayout) {
                mainLayout.className = 'flex justify-center';
            }
        }
    };
    
    setupView(); // Executa a verificação assim que a página carrega

    // ===================================================================
    // CONFIGURAÇÃO E INICIALIZAÇÃO DO FIREBASE (mantido)
    // ===================================================================
    const firebaseConfig = {
      apiKey: "AIzaSyBlNtGXSkFLR8l98ulSGUWvMJ9TtHJkcFQ",
      authDomain: "gerenciador-desenha-lojas.firebaseapp.com",
      projectId: "gerenciador-desenha-lojas",
      storageBucket: "gerenciador-desenha-lojas.appspot.com",
      messagingSenderId: "786339235530",
      appId: "1:786339235530:web:e1f695e7df9c4348df5633"
    };

    firebase.initializeApp(firebaseConfig);
    const db = firebase.firestore();

    // ===================================================================
    // O RESTANTE DO SEU CÓDIGO PERMANECE IGUAL
    // ===================================================================

    // Selecionando os elementos do HTML
    const addStoreForm = document.getElementById('add-store-form');
    const storeNumberInput = document.getElementById('store-number');
    const storePasswordInput = document.getElementById('store-password');
    const searchInput = document.getElementById('search-store-number');
    const searchResultDiv = document.getElementById('search-result');
    const storeList = document.getElementById('store-list');
    const toast = document.getElementById('toast');
    const importForm = document.getElementById('import-form');
    const bulkImportData = document.getElementById('bulk-import-data');

    let localStores = [];

    const showToast = (message, duration = 3000) => {
        toast.textContent = message;
        toast.classList.add('show');
        setTimeout(() => { toast.classList.remove('show'); }, duration);
    };

    const renderStores = () => {
        storeList.innerHTML = '';
        if (localStores.length === 0) {
            storeList.innerHTML = '<li class="text-center text-gray-500">Nenhuma loja cadastrada.</li>';
            return;
        }
        const sortedStores = [...localStores].sort((a, b) => a.number.localeCompare(b.number, undefined, {numeric: true}));
        
        sortedStores.forEach(store => {
            const li = document.createElement('li');
            li.className = 'flex items-center justify-between bg-gray-50 p-3 rounded-lg hover:bg-gray-100';
            li.innerHTML = `
                <div>
                    <span class="font-semibold text-indigo-700">Loja: ${store.number}</span>
                    <span class="text-gray-600 ml-4">Senha: ${store.password}</span>
                </div>
                <button data-store-id="${store.id}" class="delete-btn text-red-500 hover:text-red-700">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" style="pointer-events: none;">
                        <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clip-rule="evenodd" />
                    </svg>
                </button>
            `;
            storeList.appendChild(li);
        });
    };

    db.collection('lojas').orderBy('number').onSnapshot(snapshot => {
        localStores = [];
        snapshot.forEach(doc => {
            localStores.push({ id: doc.id, ...doc.data() });
        });
        renderStores();
    });

    const addStore = (e) => {
        e.preventDefault();
        const number = storeNumberInput.value.trim();
        const password = storePasswordInput.value.trim();

        if (number && password) {
            if (localStores.some(store => store.number === number)) {
                showToast(`A loja número ${number} já existe.`);
                return;
            }
            db.collection('lojas').add({ number, password })
                .then(() => {
                    showToast('Loja adicionada com sucesso!');
                    addStoreForm.reset();
                    storeNumberInput.focus();
                })
                .catch(err => {
                    console.error("Erro ao adicionar loja:", err);
                    showToast('Erro ao adicionar loja.');
                });
        }
    };

    const deleteStore = (e) => {
        const button = e.target.closest('.delete-btn');
        if (button) {
            const storeIdToDelete = button.dataset.storeId;
            db.collection('lojas').doc(storeIdToDelete).delete()
                .then(() => {
                    showToast(`Loja removida.`);
                })
                .catch(err => {
                    console.error("Erro ao remover loja:", err);
                    showToast('Erro ao remover loja.');
                });
        }
    };

    const searchStore = (e) => {
        const searchTerm = e.target.value.trim();
        if (!searchTerm) {
            searchResultDiv.innerHTML = '<span class="text-gray-500">A senha aparecerá aqui.</span>';
            return;
        }
        const foundStore = localStores.find(store => store.number === searchTerm);
        if (foundStore) {
            searchResultDiv.innerHTML = `<div class="text-center"><p class="text-2xl font-bold text-indigo-600">${foundStore.password}</p></div>`;
        } else {
            searchResultDiv.innerHTML = '<span class="text-red-500 font-medium">Loja não encontrada.</span>';
        }
    };
    
    const importStores = (e) => {
        e.preventDefault();
        const data = bulkImportData.value.trim();
        if (!data) return;

        const batch = db.batch();
        const lines = data.split('\n');
        let importedCount = 0;
        let duplicateCount = 0;

        lines.forEach(line => {
            const parts = line.split(/[,;\t]/).map(part => part.trim());
            if (parts.length === 2) {
                const [number, password] = parts;
                if (number && password) {
                    if (!localStores.some(store => store.number === number)) {
                        const newStoreRef = db.collection('lojas').doc();
                        batch.set(newStoreRef, { number, password });
                        importedCount++;
                    } else {
                        duplicateCount++;
                    }
                }
            }
        });

        batch.commit()
            .then(() => {
                showToast(`${importedCount} loja(s) importada(s). ${duplicateCount} duplicada(s).`);
                importForm.reset();
            })
            .catch(err => {
                console.error("Erro na importação em massa: ", err);
                showToast("Erro ao importar lojas.");
            });
    };

    // Adiciona os listeners apenas se os formulários existirem para evitar erros
    if (addStoreForm) addStoreForm.addEventListener('submit', addStore);
    if (importForm) importForm.addEventListener('submit', importStores);
    
    storeList.addEventListener('click', deleteStore);
    searchInput.addEventListener('input', searchStore);
});
