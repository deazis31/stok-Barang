let lastTransaction = null;

function exitToIndex() {
    window.location.href = 'index.html';
}

function loadKasirData() {
    try {
        const items = JSON.parse(localStorage.getItem('items')) || [];
        const itemTable = document.getElementById('itemTable');
        const sellItemSelects = document.querySelectorAll('.sellItem');
        itemTable.innerHTML = '';
        sellItemSelects.forEach(select => {
            select.innerHTML = '<option value="">Pilih Barang</option>';
        });

        items.forEach(item => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${item.name}</td>
                <td>Rp${item.sellPrice}</td>
                <td>${item.stock || 0}</td>
            `;
            itemTable.appendChild(row);

            sellItemSelects.forEach(select => {
                const option = document.createElement('option');
                option.value = item.name;
                option.textContent = `${item.name} (Rp${item.sellPrice}, Stok: ${item.stock || 0})`;
                select.appendChild(option);
            });
        });
        updateItemRows();
        console.log('Daftar barang dimuat:', items);
    } catch (error) {
        console.error('Error saat memuat data:', error.message);
        alert('Gagal memuat data: ' + error.message);
    }
}

function addItemRow() {
    const itemSelection = document.getElementById('itemSelection');
    const newRow = document.createElement('div');
    newRow.className = 'item-row';
    newRow.innerHTML = `
        <select class="sellItem" onchange="updateItemRows()">
            <option value="">Pilih Barang</option>
        </select>
        <input type="number" class="itemQuantity" placeholder="Jumlah" min="1">
        <button type="button" class="btn-delete" onclick="removeItemRow(this)">Hapus</button>
    `;
    itemSelection.appendChild(newRow);
    loadKasirData();
}

function removeItemRow(button) {
    button.parentElement.remove();
    updateItemRows();
}

function updateItemRows() {
    const items = JSON.parse(localStorage.getItem('items')) || [];
    const rows = document.querySelectorAll('.item-row');
    const selectedItemsBody = document.getElementById('selectedItemsBody');
    selectedItemsBody.innerHTML = '';
    let total = 0;

    rows.forEach(row => {
        const itemName = row.querySelector('.sellItem').value;
        const quantity = parseInt(row.querySelector('.itemQuantity').value) || 0;
        if (itemName && quantity > 0) {
            const item = items.find(i => i.name === itemName);
            if (item) {
                const subtotal = item.sellPrice * quantity;
                total += subtotal;
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${item.name}</td>
                    <td>Rp${item.sellPrice}</td>
                    <td>${quantity}</td>
                    <td>Rp${subtotal}</td>
                `;
                selectedItemsBody.appendChild(tr);
            }
        }
    });

    document.getElementById('changeResult').textContent = `Total: Rp${total}`;
}

document.getElementById('cashierForm').addEventListener('submit', function(e) {
    e.preventDefault();
    try {
        const items = JSON.parse(localStorage.getItem('items')) || [];
        const rows = document.querySelectorAll('.item-row');
        const customerMoney = parseFloat(document.getElementById('customerMoney').value);
        let total = 0;
        const transactionItems = [];

        rows.forEach(row => {
            const itemName = row.querySelector('.sellItem').value;
            const quantity = parseInt(row.querySelector('.itemQuantity').value);
            if (itemName && quantity > 0) {
                const item = items.find(i => i.name === itemName);
                if (!item) throw new Error(`Barang ${itemName} tidak ditemukan`);
                if (item.stock < quantity) throw new Error(`Stok ${itemName} tidak cukup! Stok tersedia: ${item.stock}`);
                const subtotal = item.sellPrice * quantity;
                total += subtotal;
                transactionItems.push({ item, quantity, subtotal });
            }
        });

        if (transactionItems.length === 0) throw new Error('Tidak ada barang yang dipilih');
        if (isNaN(customerMoney) || customerMoney < total) {
            throw new Error('Uang tidak cukup atau input tidak valid');
        }

        const change = customerMoney - total;
        document.getElementById('changeResult').textContent = `Total: Rp${total}, Kembalian: Rp${change}`;
        document.getElementById('printButton').disabled = false;

        lastTransaction = { items: transactionItems, total, customerMoney, change };
        transactionItems.forEach(({ item, quantity }) => sellItem(item.name, quantity));

        console.log('Transaksi berhasil:', lastTransaction);
    } catch (error) {
        console.error('Error saat transaksi:', error.message);
        document.getElementById('changeResult').textContent = `Error: ${error.message}`;
        document.getElementById('printButton').disabled = true;
    }
});

function sellItem(itemName, quantity) {
    try {
        const items = JSON.parse(localStorage.getItem('items')) || [];
        const transactions = JSON.parse(localStorage.getItem('transactions')) || [];
        const item = items.find(i => i.name === itemName);
        if (!item) throw new Error('Barang tidak ditemukan');

        // Kurangi stok
        item.stock -= quantity;
        if (item.stock < 0) throw new Error('Stok tidak cukup');

        transactions.push({
            name: item.name,
            date: new Date().toISOString().split('T')[0],
            buyPrice: item.buyPrice,
            sellPrice: item.sellPrice,
            photo: item.photo,
            type: 'Keluar',
            quantity: quantity
        });

        localStorage.setItem('items', JSON.stringify(items));
        localStorage.setItem('transactions', JSON.stringify(transactions));
        document.getElementById('cashierForm').reset();
        document.getElementById('itemSelection').innerHTML = `
            <div class="item-row">
                <select class="sellItem" onchange="updateItemRows()">
                    <option value="">Pilih Barang</option>
                </select>
                <input type="number" class="itemQuantity" placeholder="Jumlah" min="1">
                <button type="button" class="btn-delete" onclick="removeItemRow(this)">Hapus</button>
            </div>
        `;
        loadKasirData();
        console.log('Barang terjual:', itemName, 'Jumlah:', quantity, 'Stok tersisa:', item.stock);
    } catch (error) {
        console.error('Error saat menjual barang:', error.message);
        document.getElementById('changeResult').textContent = `Error: ${error.message}`;
        document.getElementById('printButton').disabled = true;
    }
}

function printTransaction() {
    if (!lastTransaction) {
        alert('Tidak ada transaksi untuk dicetak');
        return;
    }

    const { items, total, customerMoney, change } = lastTransaction;
    let itemDetails = '';
    items.forEach(({ item, quantity, subtotal }) => {
        itemDetails += `
            <p><strong>Nama Barang:</strong> ${item.name}</p>
            <p><strong>Jumlah:</strong> ${quantity}</p>
            <p><strong>Harga Satuan:</strong> Rp${item.sellPrice}</p>
            <p><strong>Subtotal:</strong> Rp${subtotal}</p>
            <hr>
        `;
    });

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html>
        <head><title>Cetak Transaksi</title></head>
        <body>
            <h1>Detail Transaksi</h1>
            ${itemDetails}
            <p><strong>Total:</strong> Rp${total}</p>
            <p><strong>Uang Pelanggan:</strong> Rp${customerMoney}</p>
            <p><strong>Kembalian:</strong> Rp${change}</p>
            <script>window.print(); window.close();</script>
        </body>
        </html>
    `);
    printWindow.document.close();
}

// Load data saat halaman dimuat
loadKasirData();
console.log('Halaman Kasir dimuat');