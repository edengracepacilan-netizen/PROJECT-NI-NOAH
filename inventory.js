document.addEventListener("DOMContentLoaded", function () {
    const currentPage = window.location.pathname.split("/").pop();

    if (currentPage !== "inventory.html") {
        return;
    }

    function loadProducts() {
        try {
            const savedProducts = localStorage.getItem("salamenceProducts");

            if (savedProducts === null) {
                return [];
            }

            const parsedProducts = JSON.parse(savedProducts);
            return Array.isArray(parsedProducts) ? parsedProducts : [];
        } catch (error) {
            return [];
        }
    }

    function saveProducts() {
        localStorage.setItem("salamenceProducts", JSON.stringify(products));
    }

    function nextId(items) {
        return items.length
            ? Math.max(...items.map(item => Number(item.id) || 0)) + 1
            : 1;
    }

    let products = loadProducts();

    function setText(id, value) {
        const element = document.getElementById(id);

        if (element) {
            element.textContent = value;
        }
    }

    function renderInventory() {
        const lowStock = products.filter(
            product => Number(product.stock) > 0 && Number(product.stock) <= 5
        ).length;

        const outOfStock = products.filter(
            product => Number(product.stock) <= 0
        ).length;

        const inStock = products.filter(
            product => Number(product.stock) > 5
        ).length;

        setText("total-products", products.length);
        setText("in-stock", inStock);
        setText("low-stock", lowStock);
        setText("out-of-stock", outOfStock);

        const tableBody = document.getElementById("inventory-table");

        if (!tableBody) return;

        tableBody.innerHTML = "";

        products.forEach(function (product) {
            const row = document.createElement("tr");

            const stock = Number(product.stock) || 0;

            const status = stock <= 0
                ? "Out of Stock"
                : stock <= 5
                    ? "Low Stock"
                    : "In Stock";

            [
                product.name,
                product.sku,
                stock,
                product.warehouse,
                status
            ].forEach(value => {
                const cell = document.createElement("td");
                cell.textContent = value ?? "";
                row.appendChild(cell);
            });

            const actions = document.createElement("td");

            const editButton = document.createElement("button");
            editButton.textContent = "Edit";
            editButton.style.marginRight = "6px";
            editButton.addEventListener("click", function () {
                editProduct(product.id);
            });

            const deleteButton = document.createElement("button");
            deleteButton.textContent = "Delete";
            deleteButton.style.backgroundColor = "#dc2626";
            deleteButton.addEventListener("click", function () {
                deleteProduct(product.id);
            });

            actions.append(editButton, deleteButton);
            row.appendChild(actions);
            tableBody.appendChild(row);
        });
    }

    function addProduct() {
        const name = prompt("Product name:");
        if (name === null || !name.trim()) return;

        const sku = prompt("SKU / Product code:");
        if (sku === null || !sku.trim()) return;

        if (products.some(product =>
            String(product.sku).toLowerCase() === sku.trim().toLowerCase()
        )) {
            alert("That SKU already exists.");
            return;
        }

        const stockInput = prompt("Quantity in stock:", "0");
        if (stockInput === null || stockInput.trim() === "") return;

        const stock = Number(stockInput);

        if (!Number.isInteger(stock) || stock < 0) {
            alert("Enter a whole number of 0 or higher for stock.");
            return;
        }

        const warehouse = prompt("Warehouse name:", "Warehouse A");
        if (warehouse === null || !warehouse.trim()) return;

        const priceInput = prompt("Unit price:", "0");
        if (priceInput === null || priceInput.trim() === "") return;

        const price = Number(priceInput);

        if (!Number.isFinite(price) || price < 0) {
            alert("Enter a valid price.");
            return;
        }

        products.push({
            id: nextId(products),
            name: name.trim(),
            sku: sku.trim(),
            stock: stock,
            warehouse: warehouse.trim(),
            price: price
        });

        saveProducts();
        renderInventory();
    }

    function editProduct(id) {
        const product = products.find(item => item.id === id);
        if (!product) return;

        const name = prompt("Product name:", product.name);
        if (name === null || !name.trim()) return;

        const sku = prompt("SKU:", product.sku);
        if (sku === null || !sku.trim()) return;

        if (products.some(item =>
            item.id !== id &&
            String(item.sku).toLowerCase() === sku.trim().toLowerCase()
        )) {
            alert("That SKU already exists.");
            return;
        }

        const stockInput = prompt("Stock quantity:", product.stock);
        if (stockInput === null || stockInput.trim() === "") return;

        const stock = Number(stockInput);

        if (!Number.isInteger(stock) || stock < 0) {
            alert("Enter a whole number of 0 or higher.");
            return;
        }

        const warehouse = prompt("Warehouse:", product.warehouse);
        if (warehouse === null || !warehouse.trim()) return;

        const priceInput = prompt("Unit price:", product.price);
        if (priceInput === null || priceInput.trim() === "") return;

        const price = Number(priceInput);

        if (!Number.isFinite(price) || price < 0) {
            alert("Enter a valid price.");
            return;
        }

        Object.assign(product, {
            name: name.trim(),
            sku: sku.trim(),
            stock: stock,
            warehouse: warehouse.trim(),
            price: price
        });

        saveProducts();
        renderInventory();
    }

    function deleteProduct(id) {
        const product = products.find(item => item.id === id);
        if (!product) return;

        if (!confirm("Delete " + product.name + "?")) return;

        products = products.filter(item => item.id !== id);

        saveProducts();
        renderInventory();
    }

    function setupAddButton() {
        const tableBody = document.getElementById("inventory-table");
        if (!tableBody) return;

        const table = tableBody.closest("table");
        if (!table) return;

        const container = table.closest(".content-card") || table.parentElement;
        if (!container || container.querySelector('[data-auto-button="inventory-table"]')) {
            return;
        }

        const button = document.createElement("button");
        button.textContent = "＋ Add Product";
        button.dataset.autoButton = "inventory-table";
        button.style.marginBottom = "15px";
        button.addEventListener("click", addProduct);

        container.insertBefore(button, table.parentElement);
    }

    const searchInput = document.getElementById("search-input");
    const filterSelect = document.getElementById("stock-filter");

    function filterInventory() {
        const searchTerm = searchInput
            ? searchInput.value.trim().toLowerCase()
            : "";

        const selectedFilter = filterSelect
            ? filterSelect.value
            : "all";

        const tableBody = document.getElementById("inventory-table");
        if (!tableBody) return;

        tableBody.innerHTML = "";

        const filteredProducts = products.filter(function (product) {
            const matchesSearch =
                String(product.name).toLowerCase().includes(searchTerm) ||
                String(product.sku).toLowerCase().includes(searchTerm) ||
                String(product.warehouse).toLowerCase().includes(searchTerm);

            const stock = Number(product.stock) || 0;

            const matchesFilter =
                selectedFilter === "all" ||
                (selectedFilter === "in-stock" && stock > 5) ||
                (selectedFilter === "low-stock" && stock > 0 && stock <= 5) ||
                (selectedFilter === "out-of-stock" && stock <= 0);

            return matchesSearch && matchesFilter;
        });

        filteredProducts.forEach(function (product) {
            const row = document.createElement("tr");
            const stock = Number(product.stock) || 0;

            const status = stock <= 0
                ? "Out of Stock"
                : stock <= 5
                    ? "Low Stock"
                    : "In Stock";

            [
                product.name,
                product.sku,
                stock,
                product.warehouse,
                status
            ].forEach(value => {
                const cell = document.createElement("td");
                cell.textContent = value ?? "";
                row.appendChild(cell);
            });

            const actions = document.createElement("td");

            const editButton = document.createElement("button");
            editButton.textContent = "Edit";
            editButton.style.marginRight = "6px";
            editButton.addEventListener("click", function () {
                editProduct(product.id);
            });

            const deleteButton = document.createElement("button");
            deleteButton.textContent = "Delete";
            deleteButton.style.backgroundColor = "#dc2626";
            deleteButton.addEventListener("click", function () {
                deleteProduct(product.id);
            });

            actions.append(editButton, deleteButton);
            row.appendChild(actions);
            tableBody.appendChild(row);
        });
    }

    if (searchInput) {
        searchInput.addEventListener("input", filterInventory);
    }

    if (filterSelect) {
        filterSelect.addEventListener("change", filterInventory);
    }

    renderInventory();
    setupAddButton();
});
