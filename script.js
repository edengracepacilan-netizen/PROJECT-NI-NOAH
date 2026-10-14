
document.addEventListener("DOMContentLoaded", function () {
    const page = location.pathname.split("/").pop();
    if (
        [
            "ai-assistant.html",
            "warehouse.html",
            "inventory.html",
            "suppliers.html",
            "fleet.html"
        ].includes(page)
    ) {
        return;
    }

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

        if (element) {
            element.textContent = value;
        }
    }

    // Products data for Dashboard
    let products = load("salamenceProducts", [
        { id: 1, name: "Product A", stock: 100, price: 50 },
        { id: 2, name: "Product B", stock: 75, price: 100 },
        { id: 3, name: "Product C", stock: 50, price: 150 }
    ]);

    // Read-only vehicle data for Dashboard
    // Vehicle management is handled by fleet.js
    const vehicles = load("salamenceVehicles", [
        {
            id: 1,
            plate: "ABC-1234",
            driver: "Juan Dela Cruz",
            status: "On Delivery"
        },
        {
            id: 2,
            plate: "XYZ-5678",
            driver: "Pedro Santos",
            status: "On Delivery"
        },
        {
            id: 3,
            plate: "DEF-9012",
            driver: "Maria Reyes",
            status: "Available"
        }
    ]);

    function persistProducts() {
        save("salamenceProducts", products);
    }

    function renderProducts() {
        setText("total-products", products.length);

        const body = document.getElementById("product-table");
        if (!body) return;

        body.innerHTML = "";

        products.forEach(product => {
            const row = body.insertRow();

            [
                product.name,
                product.stock,
                product.price
            ].forEach(value => {
                row.insertCell().textContent = value ?? "";
            });
        });
    }

    function renderDashboard() {
        setText("total-products", products.length);

        setText(
            "active-vehicles",
            vehicles.filter(
                vehicle => vehicle.status === "On Delivery"
            ).length
        );

        setText(
            "available-vehicles",
            vehicles.filter(
                vehicle => vehicle.status === "Available"
            ).length
        );

        setText(
            "maintenance-vehicles",
            vehicles.filter(
                vehicle => vehicle.status === "Maintenance"
            ).length
        );

        renderProducts();
    }

    function refreshAll() {
        renderDashboard();
    }

    // Logout
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
