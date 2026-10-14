
document.addEventListener("DOMContentLoaded", async function () {
    console.log("FLEET.JS IS RUNNING");

    if (!location.pathname.endsWith("fleet.html")) return;

    const body = document.getElementById("fleet-table");
    const mapElement = document.getElementById("fleet-map");

    let vehicles = [];
    let markers = [];
    let map = null;
    let isLoading = false;

    // SHOW STATUS MESSAGE
    function showMessage(message) {
        console.log(message);

        const element = document.getElementById("gps-status");
        if (element) element.textContent = message;
    }

    // UPDATE TEXT
    function setText(id, value) {
        const element = document.getElementById(id);
        if (element) element.textContent = value;
    }

    // PREVENT HTML INJECTION
    function escapeHTML(value) {
        return String(value ?? "").replace(/[&<>"']/g, char => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        })[char]);
    }

    // VALIDATE VEHICLE STATUS
    function validStatus(value) {
        if (typeof value !== "string") return null;

        return ["Available", "On Delivery", "Maintenance"].find(
            status => status.toLowerCase() === value.trim().toLowerCase()
        );
    }

    // INITIALIZE MAP
    if (!mapElement) {
        showMessage("Map container not found in fleet.html.");
    } else if (!window.L) {
        showMessage("Leaflet failed to load. Check fleet.html scripts.");
    } else {
        map = L.map(mapElement).setView([12.8797, 121.7740], 6);

        // OPENSTREETMAP TILES - NO CARTO API KEY
        const streetLayer = L.tileLayer(
            "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
            {
                attribution: "&copy; OpenStreetMap contributors",
                maxZoom: 19
            }
        );

        let tileErrorShown = false;

        streetLayer.on("tileerror", function (event) {
            console.error("OpenStreetMap tile error:", event);

            if (!tileErrorShown) {
                tileErrorShown = true;
                showMessage(
                    "Map tiles failed to load. Check your internet connection or browser blocking."
                );
            }
        });

        streetLayer.addTo(map);

        map.whenReady(function () {
            setTimeout(function () {
                map.invalidateSize();
            }, 500);
        });
    }

    // LOAD VEHICLES FROM SUPABASE
    async function loadVehicles() {
        if (isLoading) return;

        if (!window.supabaseClient) {
            showMessage("Supabase connection not found. Check supabase.js.");
            return;
        }

        isLoading = true;

        try {
            const { data, error } = await window.supabaseClient
                .from("vehicle_locations")
                .select("*")
                .order("id");

            if (error) {
                console.error("Supabase error:", error.message);
                showMessage("Unable to load vehicles: " + error.message);
                return;
            }

            vehicles = (data || []).map(item => ({
                id: item.id,
                vehicleId: item.vehicle_id,
                plate: item.plate_number || "",
                driver: item.driver || "",
                status: item.status || "Available",
                latitude: item.latitude,
                longitude: item.longitude
            }));

            renderFleet();
            renderMap();

        } catch (error) {
            console.error("Vehicle loading error:", error);
            showMessage("Unable to load vehicle data.");
        } finally {
            isLoading = false;
        }
    }

    // DISPLAY VEHICLE MARKERS
    function renderMap() {
        if (!map) return;

        markers.forEach(marker => map.removeLayer(marker));
        markers = [];

        vehicles.forEach(vehicle => {
            if (
                vehicle.latitude == null ||
                vehicle.longitude == null
            ) {
                return;
            }

            const lat = Number(vehicle.latitude);
            const lng = Number(vehicle.longitude);

            if (
                !Number.isFinite(lat) ||
                !Number.isFinite(lng) ||
                lat < -90 || lat > 90 ||
                lng < -180 || lng > 180
            ) {
                return;
            }

            const marker = L.marker([lat, lng]).addTo(map);

            marker.bindPopup(`
                <strong>Vehicle:</strong> ${escapeHTML(vehicle.vehicleId)}<br>
                <strong>Plate:</strong> ${escapeHTML(vehicle.plate)}<br>
                <strong>Driver:</strong> ${escapeHTML(vehicle.driver)}<br>
                <strong>Status:</strong> ${escapeHTML(vehicle.status)}
            `);

            markers.push(marker);
        });

        if (markers.length === 1) {
            map.setView(markers[0].getLatLng(), 15);
        } else if (markers.length > 1) {
            map.fitBounds(
                L.featureGroup(markers).getBounds(),
                { padding: [30, 30], maxZoom: 15 }
            );
        }

        showMessage(
            markers.length > 0
                ? markers.length + " vehicle location(s) displayed."
                : "Map loaded. No vehicle coordinates available yet."
        );

        setTimeout(function () {
            if (map) map.invalidateSize();
        }, 200);
    }

    // DISPLAY VEHICLE TABLE AND COUNTS
    function renderFleet() {
        setText("total-vehicles", vehicles.length);

        setText(
            "active-vehicles",
            vehicles.filter(v => v.status === "On Delivery").length
        );

        setText(
            "available-vehicles",
            vehicles.filter(v => v.status === "Available").length
        );

        setText(
            "maintenance-vehicles",
            vehicles.filter(v => v.status === "Maintenance").length
        );

        if (!body) return;

        body.innerHTML = "";

        if (vehicles.length === 0) {
            const row = body.insertRow();
            const cell = row.insertCell();
            cell.colSpan = 7;
            cell.textContent = "No vehicles found.";
            return;
        }

        vehicles.forEach(vehicle => {
            const row = body.insertRow();

            [
                vehicle.vehicleId,
                "—",
                vehicle.plate,
                vehicle.driver,
                "—",
                vehicle.status
            ].forEach(value => {
                row.insertCell().textContent = value ?? "";
            });

            const actions = row.insertCell();

            actions.append(
                makeButton("Edit", () => editVehicle(vehicle.id)),
                document.createTextNode(" "),
                makeButton(
                    "Delete",
                    () => deleteVehicle(vehicle.id),
                    true
                )
            );
        });
    }

    // CREATE BUTTON
    function makeButton(label, action, danger = false) {
        const button = document.createElement("button");
        button.textContent = label;

        if (danger) {
            button.style.backgroundColor = "#dc2626";
            button.style.color = "white";
        }

        button.addEventListener("click", action);
        return button;
    }

    // ADD VEHICLE
    async function addVehicle() {
        const plate = prompt("Vehicle plate number:");
        if (!plate?.trim()) return;

        if (vehicles.some(v =>
            v.plate.toLowerCase() === plate.trim().toLowerCase()
        )) {
            alert("That plate number already exists.");
            return;
        }

        const driver = prompt("Driver name:");
        if (!driver?.trim()) return;

        const input = prompt(
            "Status: Available, On Delivery, or Maintenance",
            "Available"
        );

        if (input === null) return;

        const status = validStatus(input);

        if (!status) {
            alert("Enter Available, On Delivery, or Maintenance.");
            return;
        }

        const { error } = await window.supabaseClient
            .from("vehicle_locations")
            .insert({
                vehicle_id: crypto.randomUUID(),
                plate_number: plate.trim(),
                driver: driver.trim(),
                status
            });

        if (error) {
            console.error(error);
            alert("Unable to save vehicle: " + error.message);
            return;
        }

        await loadVehicles();
        showMessage("Vehicle saved successfully.");
    }

    // EDIT VEHICLE
    async function editVehicle(id) {
        const vehicle = vehicles.find(v => v.id === id);
        if (!vehicle) return;

        const plate = prompt("Vehicle plate:", vehicle.plate);
        if (!plate?.trim()) return;

        if (vehicles.some(v =>
            v.id !== id &&
            v.plate.toLowerCase() === plate.trim().toLowerCase()
        )) {
            alert("That plate number already exists.");
            return;
        }

        const driver = prompt("Driver name:", vehicle.driver);
        if (!driver?.trim()) return;

        const input = prompt(
            "Status: Available, On Delivery, or Maintenance",
            vehicle.status
        );

        if (input === null) return;

        const status = validStatus(input);

        if (!status) {
            alert("Enter Available, On Delivery, or Maintenance.");
            return;
        }

        const { error } = await window.supabaseClient
            .from("vehicle_locations")
            .update({
                plate_number: plate.trim(),
                driver: driver.trim(),
                status
            })
            .eq("id", id);

        if (error) {
            alert("Unable to update vehicle: " + error.message);
            return;
        }

        await loadVehicles();
        showMessage("Vehicle updated successfully.");
    }

    // DELETE VEHICLE
    async function deleteVehicle(id) {
        const vehicle = vehicles.find(v => v.id === id);
        if (!vehicle) return;

        if (!confirm("Delete vehicle " + vehicle.plate + "?")) return;

        const { error } = await window.supabaseClient
            .from("vehicle_locations")
            .delete()
            .eq("id", id);

        if (error) {
            alert("Unable to delete vehicle: " + error.message);
            return;
        }

        await loadVehicles();
        showMessage("Vehicle deleted successfully.");
    }

    // ADD VEHICLE BUTTON TO PAGE
    function addButton() {
        if (!body) return;

        const container = body.closest(".content-card");
        if (!container) return;

        if (container.querySelector('[data-auto-button="fleet-table"]')) {
            return;
        }

        const button = document.createElement("button");
        button.textContent = "+ Add Vehicle";
        button.dataset.autoButton = "fleet-table";
        button.style.marginBottom = "15px";
        button.addEventListener("click", addVehicle);

        const tableContainer = body.closest(".table-container");

        if (tableContainer) {
            container.insertBefore(button, tableContainer);
        }
    }

    // LOGOUT
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

    // START
    addButton();
    await loadVehicles();

    // REFRESH EVERY 30 SECONDS
    setInterval(function () {
        if (!document.hidden) {
            loadVehicles();
        }
    }, 30000);
});
