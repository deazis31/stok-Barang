function exitToIndex() {
    window.location.href = 'index.html';
}

function resetForm() {
    document.getElementById('itemForm').reset();
    document.getElementById('editIndex').value = '-1';
    document.getElementById('submitButton').textContent = 'Tambah';
    document.getElementById('formTitle').textContent = 'Input Barang Masuk';
    document.getElementById('cancelEditButton').style.display = 'none';
}

function cancelEdit() {
    resetForm();
}

function loadAdminData() {
    try {
        const items = JSON.parse(localStorage.getItem('items')) || [];
        const transactions = JSON.parse(localStorage.getItem('transactions')) || [];

        // Update Product Table
        const productTable = document.getElementById('productTable');
        productTable.innerHTML = '';
        items.forEach((item, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${item.name}</td>
                <td>${item.date}</td>
                <td>${item.stock || 0}</td>
                <td>${item.photo ? `<img src="${item.photo}" alt="Foto"/>` : '-'}</td>
                <td>
                    <button onclick="editProduct(${index})" class="btn-edit">Edit</button>
                    <button onclick="deleteProduct(${index})" class="btn-delete">Delete</button>
                </td>
            `;
            productTable.appendChild(row);
        });

        // Update Transaction Table
        const transactionTable = document.getElementById('transactionTable');
        transactionTable.innerHTML = '';
        transactions.forEach((t, index) => {
            const profit = t.sellPrice && t.buyPrice ? t.sellPrice - t.buyPrice : '-';
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${t.name}</td>
                <td>${t.date}</td>
                <td>Rp${t.buyPrice || '-'}</td>
                <td>Rp${t.sellPrice || '-'}</td>
                <td>Rp${profit}</td>
                <td>${t.photo ? `<img src="${t.photo}" alt="Foto"/>` : '-'}</td>
                <td>${t.type}</td>
                <td>${t.quantity || '-'}</td>
                <td><button onclick="deleteTransaction(${index})" class="btn-delete">Delete</button></td>
            `;
            transactionTable.appendChild(row);
        });

        // Update Chart
        const profitData = transactions
            .filter(t => t.type === 'Masuk' && t.sellPrice && t.buyPrice)
            .reduce((acc, t) => {
                const date = t.date;
                const profit = t.sellPrice - t.buyPrice;
                acc[date] = (acc[date] || 0) + profit;
                return acc;
            }, {});
        const labels = Object.keys(profitData);
        const data = Object.values(profitData);

        const ctx = document.getElementById('profitChart').getContext('2d');
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Keuntungan',
                    data: data,
                    borderColor: 'blue',
                    fill: false
                }]
            },
            options: {
                scales: {
                    x: { title: { display: true, text: 'Tanggal' } },
                    y: { title: { display: true, text: 'Keuntungan (Rp)' } }
                }
            }
        });
        console.log('Data Admin dimuat:', { items, transactions });
    } catch (error) {
        console.error('Error saat memuat data:', error.message);
        alert('Gagal memuat data: ' + error.message);
    }
}

document.getElementById('itemForm').addEventListener('submit', function(e) {
    e.preventDefault();
    try {
        const name = document.getElementById('itemName').value;
        const date = document.getElementById('itemDate').value;
        const buyPrice = parseFloat(document.getElementById('itemBuyPrice').value);
        const sellPrice = parseFloat(document.getElementById('itemSellPrice').value);
        const stock = parseInt(document.getElementById('itemStock').value);
        const photoInput = document.getElementById('itemPhoto');
        const editIndex = parseInt(document.getElementById('editIndex').value);
        let photo = null;

        if (photoInput.files[0]) {
            const reader = new FileReader();
            reader.onload = function(e) {
                photo = e.target.result;
                saveOrUpdateItem({ name, date, buyPrice, sellPrice, stock, photo }, editIndex);
            };
            reader.readAsDataURL(photoInput.files[0]);
        } else {
            const items = JSON.parse(localStorage.getItem('items')) || [];
            photo = editIndex >= 0 ? items[editIndex].photo : null;
            saveOrUpdateItem({ name, date, buyPrice, sellPrice, stock, photo }, editIndex);
        }
    } catch (error) {
        console.error('Error saat input barang:', error.message);
        alert('Gagal input barang: ' + error.message);
    }
});

function saveOrUpdateItem(item, editIndex) {
    try {
        const items = JSON.parse(localStorage.getItem('items')) || [];
        const transactions = JSON.parse(localStorage.getItem('transactions')) || [];

        if (editIndex >= 0) {
            // Update existing item
            const oldItem = items[editIndex];
            items[editIndex] = item;
            const transactionIndex = transactions.findIndex(t => 
                t.type === 'Masuk' && t.name === oldItem.name && t.date === oldItem.date
            );
            if (transactionIndex >= 0) {
                transactions[transactionIndex] = { ...item, type: 'Masuk' };
            }
            alert('Barang berhasil diperbarui');
            console.log('Barang diperbarui:', item);
        } else {
            // Add new item
            items.push(item);
            transactions.push({ ...item, type: 'Masuk' });
            alert('Barang berhasil disimpan');
            console.log('Barang disimpan:', item);
        }

        localStorage.setItem('items', JSON.stringify(items));
        localStorage.setItem('transactions', JSON.stringify(transactions));
        loadAdminData();
        resetForm();
    } catch (error) {
        console.error('Error saat menyimpan/perbarui barang:', error.message);
        alert('Gagal menyimpan/perbarui barang: ' + error.message);
    }
}

function editProduct(index) {
    try {
        const items = JSON.parse(localStorage.getItem('items')) || [];
        const item = items[index];
        if (!item) throw new Error('Barang tidak ditemukan');

        document.getElementById('itemName').value = item.name;
        document.getElementById('itemDate').value = item.date;
        document.getElementById('itemBuyPrice').value = item.buyPrice;
        document.getElementById('itemSellPrice').value = item.sellPrice;
        document.getElementById('itemStock').value = item.stock;
        document.getElementById('editIndex').value = index;
        document.getElementById('submitButton').textContent = 'Update';
        document.getElementById('formTitle').textContent = 'Edit Barang';
        document.getElementById('cancelEditButton').style.display = 'inline-block';
        console.log('Edit barang:', item);
    } catch (error) {
        console.error('Error saat edit barang:', error.message);
        alert('Gagal edit barang: ' + error.message);
    }
}

function deleteProduct(index) {
    try {
        const items = JSON.parse(localStorage.getItem('items')) || [];
        const transactions = JSON.parse(localStorage.getItem('transactions')) || [];
        const item = items[index];
        if (!item) throw new Error('Barang tidak ditemukan');

        if (confirm(`Yakin ingin menghapus ${item.name}?`)) {
            items.splice(index, 1);
            const transactionIndex = transactions.findIndex(t => 
                t.type === 'Masuk' && t.name === item.name && t.date === item.date
            );
            if (transactionIndex >= 0) {
                transactions.splice(transactionIndex, 1);
            }
            localStorage.setItem('items', JSON.stringify(items));
            localStorage.setItem('transactions', JSON.stringify(transactions));
            loadAdminData();
            console.log('Barang dihapus:', item);
        }
    } catch (error) {
        console.error('Error saat menghapus barang:', error.message);
        alert('Gagal menghapus barang: ' + error.message);
    }
}

function deleteTransaction(index) {
    try {
        const transactions = JSON.parse(localStorage.getItem('transactions')) || [];
        const items = JSON.parse(localStorage.getItem('items')) || [];
        const transaction = transactions[index];

        if (!transaction) throw new Error('Transaksi tidak ditemukan');

        if (confirm(`Yakin ingin menghapus transaksi ${transaction.name} (${transaction.type})?`)) {
            transactions.splice(index, 1);
            if (transaction.type === 'Masuk') {
                const itemIndex = items.findIndex(item => item.name === transaction.name && item.date === transaction.date);
                if (itemIndex >= 0) {
                    items.splice(itemIndex, 1);
                }
            }
            localStorage.setItem('items', JSON.stringify(items));
            localStorage.setItem('transactions', JSON.stringify(transactions));
            loadAdminData();
            console.log('Transaksi dihapus:', transaction);
        }
    } catch (error) {
        console.error('Error saat menghapus transaksi:', error.message);
        alert('Gagal menghapus transaksi: ' + error.message);
    }
}

function exportProductsToExcel() {
    try {
        const items = JSON.parse(localStorage.getItem('items')) || [];
        const ws = XLSX.utils.json_to_sheet(items.map(item => ({
            Nama_Barang: item.name,
            Tanggal_Masuk: item.date,
            Harga_Beli: item.buyPrice,
            Harga_Jual: item.sellPrice,
            Stok: item.stock,
            URL_Foto: item.photo || '-'
        })));
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Produk');
        XLSX.writeFile(wb, 'produk.xlsx');
        console.log('Ekspor Produk Excel berhasil');
    } catch (error) {
        console.error('Error saat ekspor Produk Excel:', error.message);
        alert('Gagal ekspor Produk Excel: ' + error.message);
    }
}

function exportToExcel() {
    try {
        const transactions = JSON.parse(localStorage.getItem('transactions')) || [];
        const ws = XLSX.utils.json_to_sheet(transactions.map(t => ({
            Nama_Barang: t.name,
            Tanggal: t.date,
            Harga_Beli: t.buyPrice || '-',
            Harga_Jual: t.sellPrice || '-',
            Keuntungan: t.sellPrice && t.buyPrice ? t.sellPrice - t.buyPrice : '-',
            Tipe: t.type,
            Jumlah: t.quantity || '-'
        })));
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Transaksi');
        XLSX.writeFile(wb, 'transaksi.xlsx');
        console.log('Ekspor Transaksi Excel berhasil');
    } catch (error) {
        console.error('Error saat ekspor Transaksi Excel:', error.message);
        alert('Gagal ekspor Transaksi Excel: ' + error.message);
    }
}

// Load data saat halaman dimuat
loadAdminData();
console.log('Halaman Admin dimuat');