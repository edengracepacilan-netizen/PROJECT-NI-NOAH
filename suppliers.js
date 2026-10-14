
document.addEventListener("DOMContentLoaded", function () {
    const page = location.pathname.split("/").pop();

    if (page !== "suppliers.html") return;

    function load(key, defaults) {
        try {
            const data = localStorage.getItem(key);

            if (data === null) {
                localStorage.setItem(key, JSON.stringify(defaults));
                return defaults;
            }

            return JSON.parse(data);
        } catch {
            return defaults;
        }
    }

    function save(key, data) {
        localStorage.setItem(key, JSON.stringify(data));
    }

    function nextId(items) {
        return items.length
            ? Math.max(...items.map(item => Number(item.id) || 0)) + 1
            : 1;
    }

    function setText(id, value) {
        const element = document.getElementById(id);
        if (element) element.textContent = value;
    }

    let suppliers = load("salamenceSuppliers", [
        {
            id: 1,
            name: "ABC Supplies",
            contact: "09171234567",
            email: "abc@example.com"
        },
        {
            id: 2,
            name: "XYZ Trading",
            contact: "09181234567",
            email: "xyz@example.com"
        }
    ]);

    let orders = load("salamenceOrders", [
        {
            id: 1,
            orderNo: "ORD-001",
            supplier: "ABC Supplies",
            status: "Pending"
        },
        {
            id: 2,
            orderNo: "ORD-002",
            supplier: "XYZ Trading",
            status: "Pending"
        },
        {
            id: 3,
            orderNo: "ORD-003",
            supplier: "ABC Supplies",
            status: "Completed"
        }
    ]);

    function persistAll() {
        save("salamenceSuppliers", suppliers);
        save("salamenceOrders", orders);
    }

    function makeButton(label, action, danger = false) {
        const button = document.createElement("button");
        button.textContent = label;

        if (danger) {
            button.style.backgroundColor = "#dc2626";
            button.style.color = "#ffffff";
        }

        button.onclick = action;
        return button;
    }

    function renderSuppliers() {
        setText("total-suppliers", suppliers.length);
        setText("total-orders", orders.length);

        setText(
            "pending-orders",
            orders.filter(order => order.status === "Pending").length
        );

        setText(
            "completed-orders",
            orders.filter(order => order.status === "Completed").length
        );

        const supplierBody = document.getElementById("supplier-table");

        if (supplierBody) {
            supplierBody.innerHTML = "";

            suppliers.forEach(supplier => {
                const row = supplierBody.insertRow();

                [
                    supplier.name,
                    supplier.contact,
                    supplier.email
                ].forEach(value => {
                    row.insertCell().textContent = value ?? "";
                });

                const actions = row.insertCell();

                actions.append(
                    makeButton(
                        "Edit",
                        () => editSupplier(supplier.id)
                    ),
                    makeButton(
                        "Delete",
                        () => deleteSupplier(supplier.id),
                        true
                    )
                );
            });
        }

        const orderBody = document.getElementById("supplier-orders-table");

        if (orderBody) {
            orderBody.innerHTML = "";

            orders.forEach(order => {
                const row = orderBody.insertRow();

                [
                    order.orderNo,
                    order.supplier,
                    order.status
                ].forEach(value => {
                    row.insertCell().textContent = value ?? "";
                });

                const actions = row.insertCell();

                actions.append(
                    makeButton(
                        "Change Status",
                        () => changeOrderStatus(order.id)
                    ),
                    makeButton(
                        "Delete",
                        () => deleteOrder(order.id),
                        true
                    )
                );
            });
        }
    }

    function addSupplier() {
        const name = prompt("Supplier name:");
        if (!name?.trim()) return;

        const contact = prompt("Contact number:");
        if (!contact?.trim()) return;

        const email = prompt("Email address:");
        if (!email?.trim()) return;

        suppliers.push({
            id: nextId(suppliers),
            name: name.trim(),
            contact: contact.trim(),
            email: email.trim()
        });

        persistAll();
        refreshAll();
    }

    function editSupplier(id) {
        const supplier = suppliers.find(item => item.id === id);
        if (!supplier) return;

        const name = prompt("Supplier name:", supplier.name);
        if (!name?.trim()) return;

        const contact = prompt("Contact number:", supplier.contact);
        if (!contact?.trim()) return;

        const email = prompt("Email address:", supplier.email);
        if (!email?.trim()) return;

        const oldName = supplier.name;

        supplier.name = name.trim();
        supplier.contact = contact.trim();
        supplier.email = email.trim();

        orders.forEach(order => {
            if (order.supplier === oldName) {
                order.supplier = supplier.name;
            }
        });

        persistAll();
        refreshAll();
    }

    function deleteSupplier(id) {
        const supplier = suppliers.find(item => item.id === id);
        if (!supplier) return;

        if (orders.some(order => order.supplier === supplier.name)) {
            alert(
                "This supplier has orders. Delete or update those orders first."
            );
            return;
        }

        if (!confirm("Delete supplier " + supplier.name + "?")) return;

        suppliers = suppliers.filter(item => item.id !== id);

        persistAll();
        refreshAll();
    }

    function addOrder() {
        if (!suppliers.length) {
            alert("Add a supplier first.");
            return;
        }

        const orderNo = prompt(
            "Order number:",
            "ORD-" + String(nextId(orders)).padStart(3, "0")
        );

        if (!orderNo?.trim()) return;

        if (
            orders.some(
                order =>
                    order.orderNo.toLowerCase() ===
                    orderNo.trim().toLowerCase()
            )
        ) {
            alert("That order number already exists.");
            return;
        }

        const supplierName = prompt(
            "Supplier name: " + suppliers.map(s => s.name).join(", "),
            suppliers[0].name
        );

        if (!supplierName?.trim()) return;

        const supplier = suppliers.find(
            item =>
                item.name.toLowerCase() ===
                supplierName.trim().toLowerCase()
        );

        if (!supplier) {
            alert("Please use a supplier name from the supplier list.");
            return;
        }

        orders.push({
            id: nextId(orders),
            orderNo: orderNo.trim(),
            supplier: supplier.name,
            status: "Pending"
        });

        persistAll();
        refreshAll();
    }

    function changeOrderStatus(id) {
        const order = orders.find(item => item.id === id);
        if (!order) return;

        const input = prompt(
            "Type Pending or Completed:",
            order.status
        );

        if (input === null) return;

        const status = ["Pending", "Completed"].find(
            value => value.toLowerCase() === input.trim().toLowerCase()
        );

        if (!status) {
            alert("Use Pending or Completed.");
            return;
        }

        order.status = status;

        persistAll();
        refreshAll();
    }

    function deleteOrder(id) {
        const order = orders.find(item => item.id === id);
        if (!order) return;

        if (!confirm("Delete order " + order.orderNo + "?")) return;

        orders = orders.filter(item => item.id !== id);

        persistAll();
        refreshAll();
    }

    function addButton(tableId, label, action) {
        const body = document.getElementById(tableId);
        const table = body?.closest("table");
        const container =
            table?.closest(".content-card") || table?.parentElement;

        if (
            !table ||
            !container ||
            container.querySelector(`[data-auto-button="${tableId}"]`)
        ) return;

        const button = document.createElement("button");
        button.textContent = label;
        button.dataset.autoButton = tableId;
        button.style.marginBottom = "15px";
        button.onclick = action;

        container.insertBefore(button, table.parentElement);
    }

    function refreshAll() {
        renderSuppliers();

        addButton(
            "supplier-table",
            "＋ Add Supplier",
            addSupplier
        );

        addButton(
            "supplier-orders-table",
            "＋ Add Order",
            addOrder
        );
    }

    document.getElementById("logout-button")?.addEventListener(
        "click",
        function (event) {
            event.preventDefault();

            if (confirm("Are you sure you want to log out?")) {
                sessionStorage.removeItem("isLoggedIn");
                location.replace("login.html");
            }
        }
    );

    refreshAll();
});
