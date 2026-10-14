
document.addEventListener("DOMContentLoaded", function () {
    const chatMessages = document.getElementById("chat-messages");
    const chatForm = document.getElementById("ai-chat-form");
    const chatInput = document.getElementById("ai-chat-input");
    const sendButton = document.getElementById("ai-send-button");
    const chatStatus = document.getElementById("ai-chat-status");

    if (!chatMessages || !chatForm || !chatInput) {
        console.error("AI Chat: Check the IDs in ai-assistant.html.");
        return;
    }

    function addMessage(message, sender) {
        const bubble = document.createElement("div");
        bubble.style.display = "block";
        bubble.style.width = "fit-content";
        bubble.style.maxWidth = "85%";
        bubble.style.padding = "10px 12px";
        bubble.style.margin = "8px 0";
        bubble.style.borderRadius = "10px";
        bubble.style.whiteSpace = "pre-wrap";
        bubble.style.overflowWrap = "anywhere";
        bubble.style.fontSize = "14px";
        bubble.style.lineHeight = "1.5";
        bubble.style.boxSizing = "border-box";

        if (sender === "user") {
            bubble.style.backgroundColor = "#2563eb";
            bubble.style.color = "#fff";
            bubble.style.marginLeft = "auto";
        } else {
            bubble.style.backgroundColor = "#e2e8f0";
            bubble.style.color = "#1e293b";
            bubble.style.marginRight = "auto";
        }

        bubble.textContent = message;
        chatMessages.appendChild(bubble);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function readStorage(key) {
        try {
            const data = localStorage.getItem(key);
            if (!data) return [];
            const parsed = JSON.parse(data);
            return Array.isArray(parsed) ? parsed : [];
        } catch (error) {
            console.error("Storage error:", key, error);
            return [];
        }
    }

    // Creates a map directly inside the chat.
    function addMap(location, title) {
        const query = String(location || "").trim();

        if (!query || query.toLowerCase() === "n/a") {
            addMessage("Walang naka-save na address o coordinates para sa map.", "bot");
            return;
        }

        const card = document.createElement("div");
        card.style.width = "min(100%, 520px)";
        card.style.margin = "8px 0 14px";
        card.style.padding = "12px";
        card.style.background = "#fff";
        card.style.border = "1px solid #cbd5e1";
        card.style.borderRadius = "12px";
        card.style.boxSizing = "border-box";

        const heading = document.createElement("strong");
        heading.textContent = title || "Location Map";
        heading.style.display = "block";
        heading.style.marginBottom = "8px";
        card.appendChild(heading);

        const frame = document.createElement("iframe");
        frame.title = "Map showing " + query;
        frame.src = "https://www.google.com/maps?q=" +
            encodeURIComponent(query) + "&output=embed";
        frame.width = "100%";
        frame.height = "280";
        frame.style.border = "0";
        frame.style.borderRadius = "8px";
        frame.loading = "lazy";
        frame.referrerPolicy = "no-referrer-when-downgrade";
        frame.allowFullscreen = true;
        card.appendChild(frame);

        const link = document.createElement("a");
        link.href = "https://www.google.com/maps/search/?api=1&query=" +
            encodeURIComponent(query);
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.textContent = "Open in Google Maps";
        link.style.display = "inline-block";
        link.style.marginTop = "10px";
        card.appendChild(link);

        chatMessages.appendChild(card);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function getLocation(item) {
        if (!item) return "";

        const lat = item.latitude ?? item.lat;
        const lng = item.longitude ?? item.lng ?? item.lon;

        if (lat !== undefined && lng !== undefined &&
            lat !== "" && lng !== "") {
            return lat + "," + lng;
        }

        return item.location || item.address || item.addressLine ||
            item.fullAddress || "";
    }

    function getBotReply(message) {
        const text = message.toLowerCase().trim();

        const products = readStorage("salamenceProducts");
        const warehouses = readStorage("salamenceWarehouses");
        const vehicles = readStorage("salamenceVehicles");
        const suppliers = readStorage("salamenceSuppliers");
        const orders = readStorage("salamenceOrders");

        if (/^(hi|hello|hey|good morning|good afternoon|good evening)[!. ]*$/.test(text)) {
            return "Hello! I'm the Salamence Tracker assistant. Type 'help' to see available commands.";
        }

        if (text === "help" || text.includes("what can you do") || text.includes("commands")) {
            return "SALAMENCE TRACKER COMMANDS\n\n" +
                "INVENTORY\n" +
                "• Show inventory summary\n" +
                "• Search product Laptop\n" +
                "• Track product Laptop\n" +
                "• Show low stock\n\n" +
                "WAREHOUSES\n" +
                "• Show all warehouses\n" +
                "• Show warehouses on map\n\n" +
                "FLEET\n" +
                "• Show fleet\n" +
                "• Track truck ABC-123\n\n" +
                "SUPPLIERS\n" +
                "• Show all suppliers\n" +
                "• Find supplier ABC\n\n" +
                "ORDERS\n" +
                "• Show pending orders\n" +
                "• Show completed orders";
        }

        // Track a product and show its warehouse map.
        if (text.startsWith("track product ") ||
            text.startsWith("where is product ")) {
            const query = text
                .replace(/^track product /, "")
                .replace(/^where is product /, "")
                .trim();

            const matches = products.filter(p =>
                String(p.name || "").toLowerCase().includes(query) ||
                String(p.sku || "").toLowerCase().includes(query)
            );

            if (!matches.length) {
                return "Product not found: " + query +
                    "\nCheck the product name or SKU in Inventory.";
            }

            matches.forEach(p => {
                const warehouseName = p.warehouse || p.warehouseName || "";
                const warehouse = warehouses.find(w =>
                    String(w.name || "").toLowerCase() ===
                    String(warehouseName).toLowerCase()
                );

                const exactSpot = [
                    p.aisle && "Aisle " + p.aisle,
                    p.rack && "Rack " + p.rack,
                    p.shelf && "Shelf " + p.shelf,
                    p.bin && "Bin " + p.bin
                ].filter(Boolean).join(", ");

                addMessage(
                    "PRODUCT TRACKING\n\n" +
                    "Product: " + (p.name || "N/A") + "\n" +
                    "SKU: " + (p.sku || "N/A") + "\n" +
                    "Stock: " + (p.stock ?? "N/A") + "\n" +
                    "Warehouse: " + (warehouseName || "N/A") + "\n" +
                    "Inside location: " + (exactSpot || p.location || "Not recorded") +
                    "\nAddress: " + (getLocation(warehouse) || "Not recorded"),
                    "bot"
                );

                const mapLocation = getLocation(warehouse) ||
                    getLocation(p);

                if (mapLocation) {
                    addMap(mapLocation, (p.name || "Product") + " — Warehouse Map");
                } else {
                    addMessage(
                        "Walang address o coordinates ang product/warehouse na ito. " +
                        "Idagdag muna ang location sa system para maipakita sa mapa.",
                        "bot"
                    );
                }
            });

            return "";
        }

        // Show warehouse locations and individual maps.
        if (text.includes("warehouse")) {
            if (!warehouses.length) return "Walang warehouse records sa system.";

            const located = warehouses.filter(w => getLocation(w));

            addMessage(
                "WAREHOUSE LIST\n\n" +
                warehouses.map(w =>
                    (w.name || "Unnamed warehouse") +
                    "\nAddress: " + (getLocation(w) || "Not recorded") +
                    "\nStatus: " + (w.status || "N/A") +
                    "\nCapacity: " + (w.capacity ?? "N/A")
                ).join("\n\n"),
                "bot"
            );

            if (text.includes("map")) {
                located.forEach(w => addMap(getLocation(w), w.name || "Warehouse"));
                if (!located.length) {
                    addMessage("Walang warehouse na may naka-save na address o coordinates.", "bot");
                }
            }

            return "";
        }

        // Fleet details. A map is shown only when a real location is saved.
        if (text.startsWith("track truck ") ||
            text.startsWith("track vehicle ")) {
            const query = text.replace(/^track (truck|vehicle) /, "").trim();
            const matches = vehicles.filter(v =>
                String(v.plate || "").toLowerCase().includes(query)
            );

            if (!matches.length) return "Walang sasakyang nakita para sa: " + query;

            matches.forEach(v => {
                addMessage(
                    "VEHICLE TRACKING\n\nPlate: " + (v.plate || "N/A") +
                    "\nDriver: " + (v.driver || "N/A") +
                    "\nStatus: " + (v.status || "N/A") +
                    "\nLocation: " + (getLocation(v) || "Not recorded") +
                    "\n\nLive GPS tracking works only if GPS data is connected.",
                    "bot"
                );
                if (getLocation(v)) addMap(getLocation(v), "Vehicle " + v.plate);
            });
            return "";
        }

        if (text.includes("fleet") || text.includes("vehicle") ||
            text.includes("truck") || text.includes("delivery")) {
            if (!vehicles.length) return "Walang vehicle records sa system.";

            return "FLEET SUMMARY\n\nTotal vehicles: " + vehicles.length +
                "\nAvailable: " + vehicles.filter(v =>
                    String(v.status || "").toLowerCase() === "available"
                ).length +
                "\nOn delivery: " + vehicles.filter(v =>
                    String(v.status || "").toLowerCase().includes("delivery")
                ).length +
                "\n\n" + vehicles.map(v =>
                    "Plate: " + (v.plate || "N/A") +
                    "\nDriver: " + (v.driver || "N/A") +
                    "\nStatus: " + (v.status || "N/A") +
                    "\nLocation: " + (getLocation(v) || "Not recorded")
                ).join("\n\n");
        }

        // Supplier search and supplier list.
        if (text.startsWith("find supplier ")) {
            const query = text.replace(/^find supplier /, "").trim();
            const matches = suppliers.filter(s =>
                String(s.name || "").toLowerCase().includes(query)
            );

            if (!matches.length) return "Supplier not found: " + query;

            matches.forEach(s => {
                addMessage(
                    "SUPPLIER DETAILS\n\nName: " + (s.name || "N/A") +
                    "\nContact: " + (s.contact || "N/A") +
                    "\nEmail: " + (s.email || "N/A") +
                    "\nAddress: " + (getLocation(s) || "Not recorded"),
                    "bot"
                );
                if (getLocation(s)) addMap(getLocation(s), s.name + " — Supplier Location");
            });
            return "";
        }

        if (text.includes("supplier")) {
            if (!suppliers.length) return "Walang supplier records sa system.";

            return "SUPPLIER LIST\n\n" + suppliers.map(s =>
                s.name + "\nContact: " + (s.contact || "N/A") +
                "\nEmail: " + (s.email || "N/A") +
                "\nLocation: " + (getLocation(s) || "Not recorded")
            ).join("\n\n");
        }

        // Inventory summary and low stock.
        if (text.includes("inventory summary") ||
            text.includes("stock summary") ||
            text.includes("total products") ||
            text.includes("how many products")) {
            return "INVENTORY SUMMARY\n\nProducts: " + products.length +
                "\nTotal units: " + products.reduce(
                    (sum, p) => sum + Number(p.stock || 0), 0
                ) +
                "\nLow stock (5 or fewer): " +
                products.filter(p => Number(p.stock) > 0 && Number(p.stock) <= 5).length +
                "\nOut of stock: " +
                products.filter(p => Number(p.stock) <= 0).length;
        }

        if (text.includes("low stock") || text.includes("out of stock")) {
            const low = products.filter(p => Number(p.stock) <= 5);
            return low.length
                ? "LOW STOCK PRODUCTS\n\n" + low.map(p =>
                    (p.name || "Unnamed") + " — " + p.stock + " units"
                ).join("\n")
                : "No low-stock products found.";
        }

        if (text.startsWith("search product ") || text.startsWith("find product ")) {
            const query = text.replace(/^(search|find) product /, "").trim();
            const matches = products.filter(p =>
                String(p.name || "").toLowerCase().includes(query) ||
                String(p.sku || "").toLowerCase().includes(query)
            );

            return matches.length
                ? "PRODUCT SEARCH RESULTS\n\n" + matches.map(p =>
                    "Name: " + p.name +
                    "\nSKU: " + (p.sku || "N/A") +
                    "\nStock: " + (p.stock ?? "N/A") +
                    "\nWarehouse: " + (p.warehouse || p.warehouseName || "N/A") +
                    "\nLocation: " + (p.location || "Not recorded")
                ).join("\n\n")
                : "No product found: " + query;
        }

        if (text.includes("inventory") || text.includes("product") || text.includes("stock")) {
            return products.length
                ? "INVENTORY LIST\n\n" + products.map(p =>
                    p.name + " — " + p.stock + " units"
                ).join("\n") + "\n\nUse 'Track product Laptop' for its location."
                : "Walang product records sa system.";
        }

        // Orders.
        if (text.includes("pending order") || text.includes("completed order") ||
            text.includes("order summary")) {
            const wanted = text.includes("pending") ? "pending" :
                text.includes("completed") ? "completed" : "";

            const filtered = wanted
                ? orders.filter(o => String(o.status || "").toLowerCase() === wanted)
                : orders;

            return "ORDER REPORT\n\nTotal orders: " + orders.length +
                "\nPending: " + orders.filter(o =>
                    String(o.status || "").toLowerCase() === "pending"
                ).length +
                "\nCompleted: " + orders.filter(o =>
                    String(o.status || "").toLowerCase() === "completed"
                ).length +
                (wanted ? "\n\n" + (filtered.length ? filtered.map(o =>
                    (o.orderNo || o.id || "Order") +
                    "\nSupplier: " + (o.supplier || "N/A") +
                    "\nStatus: " + (o.status || "N/A")
                ).join("\n\n") : "No " + wanted + " orders.") : "");
        }

        if (text.includes("thank")) return "You're welcome! I'm here to help.";
        if (/^(bye|goodbye|see you)[!. ]*$/.test(text)) return "Goodbye! Have a great day.";

        return "I couldn't match that command.\n\nType 'help' to see available commands.";
    }

    function sendMessage(event) {
        event.preventDefault();

        const message = chatInput.value.trim();
        if (!message) return;

        addMessage(message, "user");
        chatInput.value = "";
        chatInput.focus();

        if (sendButton) sendButton.disabled = true;
        if (chatStatus) chatStatus.textContent = "Preparing reply...";

        window.setTimeout(function () {
            const reply = getBotReply(message);
            if (reply) addMessage(reply, "bot");

            if (sendButton) sendButton.disabled = false;
            if (chatStatus) chatStatus.textContent = "Ready";
        }, 250);
    }

    chatForm.addEventListener("submit", sendMessage);

    addMessage(
        "Hello! I'm the Salamence Tracker assistant.\nType 'help' to see available commands.",
        "bot"
    );

    if (chatStatus) chatStatus.textContent = "Ready";
});
