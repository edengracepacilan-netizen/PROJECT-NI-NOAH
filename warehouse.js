
document.addEventListener("DOMContentLoaded", function () {
    const currentPage = window.location.pathname.split("/").pop();

    if (currentPage !== "warehouse.html") return;

    function loadData(key, defaultData) {
        const savedData = localStorage.getItem(key);

        if (savedData === null) {
            localStorage.setItem(key, JSON.stringify(defaultData));
            return defaultData;
        }

        try {
            const data = JSON.parse(savedData);
            return Array.isArray(data) ? data : defaultData;
        } catch (error) {
            return defaultData;
        }
    }

    function saveData(key, data) {
        localStorage.setItem(key, JSON.stringify(data));
    }

    let products = loadData("salamenceProducts", []);
    let warehouses = loadData("salamenceWarehouses", [
        { id: 1, name: "Warehouse A", location: "Cebu City", capacity: 500, status: "Active" },
        { id: 2, name: "Warehouse B", location: "Mandaue City", capacity: 300, status: "Active" }
    ]);

    let history = loadData("salamenceWarehouseHistory", []);

    function nextId(items) {
        return items.length
            ? Math.max(...items.map(item => Number(item.id) || 0)) + 1
            : 1;
    }

    function saveAll() {
        saveData("salamenceProducts", products);
        saveData("salamenceWarehouses", warehouses);
        saveData("salamenceWarehouseHistory", history);
    }

    function setText(id, value) {
        const element = document.getElementById(id);
        if (element) element.textContent = value;
    }

    function recordHistory(action, details) {
        history.unshift({
            id: nextId(history),
            date: new Date().toLocaleString(),
            action: action,
            details: details
        });

        saveData("salamenceWarehouseHistory", history);
    }

    function getWarehouseStock(warehouseName) {
        return products
            .filter(product => product.warehouse === warehouseName)
            .reduce((sum, product) => sum + Number(product.stock || 0), 0);
    }

    function setupAddButton() {
        const tableBody = document.getElementById("warehouse-table");
        if (!tableBody) return;

        const table = tableBody.closest("table");
        if (!table) return;

        const container = table.closest(".content-card") || table.parentElement;
        if (!container || container.querySelector('[data-auto-button="warehouse-table"]')) return;

        const button = document.createElement("button");
        button.textContent = "＋ Add Warehouse";
        button.dataset.autoButton = "warehouse-table";
        button.style.marginBottom = "15px";
        button.addEventListener("click", addWarehouse);

        container.insertBefore(button, table.parentElement);
    }

    function renderWarehouses() {
        setText("total-warehouses", warehouses.length);
        setText(
            "stored-products",
            products.reduce((sum, product) => sum + Number(product.stock || 0), 0)
        );
        setText("warehouse-locations", new Set(warehouses.map(w => w.location)).size);

        const tableBody = document.getElementById("warehouse-table");
        if (!tableBody) return;

        tableBody.innerHTML = "";

        warehouses.forEach(function (warehouse) {
            const stored = getWarehouseStock(warehouse.name);
            const capacity = Number(warehouse.capacity) || 0;
            const percentage = capacity > 0
                ? Math.round(stored / capacity * 100)
                : 0;

            const row = document.createElement("tr");

            [
                warehouse.name,
                warehouse.location,
                capacity,
                stored,
                percentage + "%",
                warehouse.status
            ].forEach(value => {
                const cell = document.createElement("td");
                cell.textContent = value ?? "";
                row.appendChild(cell);
            });

            const actions = document.createElement("td");

            const viewButton = document.createElement("button");
            viewButton.textContent = "View Products";
            viewButton.style.marginRight = "5px";
            viewButton.addEventListener("click", () => viewProducts(warehouse));

            const transferButton = document.createElement("button");
            transferButton.textContent = "Transfer Stock";
            transferButton.style.marginRight = "5px";
            transferButton.addEventListener("click", () => transferStock(warehouse));

            const historyButton = document.createElement("button");
            historyButton.textContent = "History";
            historyButton.style.marginRight = "5px";
            historyButton.addEventListener("click", () => viewHistory(warehouse));

            const editButton = document.createElement("button");
            editButton.textContent = "Edit";
            editButton.style.marginRight = "5px";
            editButton.addEventListener("click", () => editWarehouse(warehouse.id));

            const deleteButton = document.createElement("button");
            deleteButton.textContent = "Delete";
            deleteButton.style.backgroundColor = "#dc2626";
            deleteButton.addEventListener("click", () => deleteWarehouse(warehouse.id));

            actions.append(
                viewButton,
                transferButton,
                historyButton,
                editButton,
                deleteButton
            );

            row.appendChild(actions);
            tableBody.appendChild(row);
        });

        renderHistory();
        setupAddButton();
    }

    function viewProducts(warehouse) {
        const assigned = products.filter(
            product => product.warehouse === warehouse.name
        );

        const details = assigned.length
            ? assigned.map(product =>
                product.name + " | SKU: " + product.sku +
                " | Stock: " + product.stock
            ).join("\n")
            : "No products assigned to this warehouse.";

        alert(warehouse.name + "\n\n" + details);
    }

    function transferStock(warehouse) {
        const available = products.filter(
            product =>
                product.warehouse === warehouse.name &&
                Number(product.stock) > 0
        );

        if (!available.length) {
            alert("No products available to transfer.");
            return;
        }

        const productList = available.map((product, index) =>
            (index + 1) + ". " + product.name +
            " (Stock: " + product.stock + ")"
        ).join("\n");

        const choice = prompt("Choose product number:\n\n" + productList);
        if (choice === null || choice.trim() === "") return;

        const index = Number(choice) - 1;

        if (!Number.isInteger(index) || index < 0 || index >= available.length) {
            alert("Invalid product number.");
            return;
        }

        const product = available[index];

        const destinations = warehouses.filter(
            item => item.id !== warehouse.id && item.status === "Active"
        );

        if (!destinations.length) {
            alert("No other active warehouse is available.");
            return;
        }

        const destinationList = destinations.map((item, i) =>
            (i + 1) + ". " + item.name +
            " (Capacity: " + item.capacity + ", Stored: " +
            getWarehouseStock(item.name) + ")"
        ).join("\n");

        const destinationChoice = prompt(
            "Choose destination warehouse:\n\n" + destinationList
        );

        if (destinationChoice === null || destinationChoice.trim() === "") return;

        const destinationIndex = Number(destinationChoice) - 1;

        if (
            !Number.isInteger(destinationIndex) ||
            destinationIndex < 0 ||
            destinationIndex >= destinations.length
        ) {
            alert("Invalid warehouse number.");
            return;
        }

        const destination = destinations[destinationIndex];

        const quantityInput = prompt(
            "Quantity to transfer (Available: " + product.stock + "):"
        );

        if (quantityInput === null || quantityInput.trim() === "") return;

        const quantity = Number(quantityInput);

        if (
            !Number.isInteger(quantity) ||
            quantity <= 0 ||
            quantity > Number(product.stock)
        ) {
            alert("Enter a valid quantity within the available stock.");
            return;
        }

        const destinationCapacity = Number(destination.capacity) || 0;
        const destinationStored = getWarehouseStock(destination.name);

        if (destinationStored + quantity > destinationCapacity) {
            alert("Transfer exceeds the destination warehouse capacity.");
            return;
        }

        const sourceName = warehouse.name;
        const destinationName = destination.name;

        product.stock = Number(product.stock) - quantity;

        let destinationProduct = products.find(item =>
            item.sku === product.sku &&
            item.warehouse === destinationName
        );

        if (destinationProduct) {
            destinationProduct.stock = Number(destinationProduct.stock) + quantity;
        } else {
            products.push({
                ...product,
                id: nextId(products),
                stock: quantity,
                warehouse: destinationName
            });
        }

        recordHistory(
            "Stock Transfer",
            product.name + " (" + product.sku + "), " + quantity +
            " units: " + sourceName + " → " + destinationName
        );

        saveAll();
        renderWarehouses();

        alert(
            "Transfer successful!\n" +
            product.name + ": " + quantity + " units\n" +
            sourceName + " → " + destinationName
        );

        window.dispatchEvent(new Event("inventoryUpdated"));
    }

    function addWarehouse() {
        const name = prompt("Warehouse name:");
        if (name === null || !name.trim()) return;

        if (warehouses.some(w =>
            w.name.toLowerCase() === name.trim().toLowerCase()
        )) {
            alert("That warehouse already exists.");
            return;
        }

        const location = prompt("Warehouse location:");
        if (location === null || !location.trim()) return;

        const capacityInput = prompt("Storage capacity:", "100");
        if (capacityInput === null || capacityInput.trim() === "") return;

        const capacity = Number(capacityInput);

        if (!Number.isInteger(capacity) || capacity <= 0) {
            alert("Enter a whole number greater than 0.");
            return;
        }

        warehouses.push({
            id: nextId(warehouses),
            name: name.trim(),
            location: location.trim(),
            capacity: capacity,
            status: "Active"
        });

        recordHistory("Warehouse Added", name.trim() + " at " + location.trim());
        saveAll();
        renderWarehouses();
    }

    function editWarehouse(id) {
        const warehouse = warehouses.find(w => w.id === id);
        if (!warehouse) return;

        const name = prompt("Warehouse name:", warehouse.name);
        if (name === null || !name.trim()) return;

        if (warehouses.some(w =>
            w.id !== id &&
            w.name.toLowerCase() === name.trim().toLowerCase()
        )) {
            alert("That warehouse already exists.");
            return;
        }

        const location = prompt("Location:", warehouse.location);
        if (location === null || !location.trim()) return;

        const capacityInput = prompt("Storage capacity:", warehouse.capacity);
        if (capacityInput === null || capacityInput.trim() === "") return;

        const capacity = Number(capacityInput);

        if (!Number.isInteger(capacity) || capacity <= 0) {
            alert("Enter a whole number greater than 0.");
            return;
        }

        const oldName = warehouse.name;
        const newName = name.trim();
        const stored = getWarehouseStock(oldName);

        if (stored > capacity) {
            alert("Capacity cannot be lower than the current stock (" + stored + ").");
            return;
        }

        products.forEach(product => {
            if (product.warehouse === oldName) product.warehouse = newName;
        });

        Object.assign(warehouse, {
            name: newName,
            location: location.trim(),
            capacity: capacity
        });

        recordHistory(
            "Warehouse Updated",
            oldName + " changed to " + newName +
            "; location: " + location.trim() +
            "; capacity: " + capacity
        );

        saveAll();
        renderWarehouses();
        window.dispatchEvent(new Event("inventoryUpdated"));
    }

    function deleteWarehouse(id) {
        const warehouse = warehouses.find(w => w.id === id);
        if (!warehouse) return;

        if (products.some(product =>
            product.warehouse === warehouse.name && Number(product.stock) > 0
        )) {
            alert("Transfer or remove the stock assigned to this warehouse before deleting it.");
            return;
        }

        if (!confirm("Delete " + warehouse.name + "?")) return;

        warehouses = warehouses.filter(w => w.id !== id);

        recordHistory("Warehouse Deleted", warehouse.name);
        saveAll();
        renderWarehouses();
    }

    function viewHistory(warehouse) {
        const entries = history.filter(item =>
            item.details.includes(warehouse.name)
        );

        const details = entries.length
            ? entries.map(item =>
                item.date + "\n" + item.action + "\n" + item.details
            ).join("\n\n")
            : "No activity history for this warehouse.";

        alert("Activity History: " + warehouse.name + "\n\n" + details);
    }

    function renderHistory() {
        const tableBody = document.getElementById("warehouse-history-table");
        if (!tableBody) return;

        tableBody.innerHTML = "";

        if (!history.length) {
            const row = document.createElement("tr");
            const cell = document.createElement("td");
            cell.colSpan = 3;
            cell.textContent = "No activity history.";
            row.appendChild(cell);
            tableBody.appendChild(row);
            return;
        }

        history.forEach(item => {
            const row = document.createElement("tr");

            [item.date, item.action, item.details].forEach(value => {
                const cell = document.createElement("td");
                cell.textContent = value ?? "";
                row.appendChild(cell);
            });

            tableBody.appendChild(row);
        });
    }

    renderWarehouses();
});
