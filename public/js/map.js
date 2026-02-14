// public/js/map.js

// 1. Safety Check: Ensure data was passed correctly
if (typeof mapListData !== 'undefined' && mapListData.geometry && mapListData.geometry.coordinates) {
    
    const coords = mapListData.geometry.coordinates;
    const latLng = [coords[1], coords[0]];

    // 2. Initialize the map
    // Leaflet uses [Lat, Lng], GeoJSON uses [Lng, Lat]
    const map = L.map('map').setView(latLng, 12);

    // 3. Add Tile Layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    // 4. Custom Red Icon
    const redIcon = L.icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
    });

    // 5. Create the marker
    const marker = L.marker(latLng, { icon: redIcon }).addTo(map);

    // 6. Create Popup Content
    const popupHTML = `
        <div class="review-popup-model">
            <strong>${mapListData.location}, ${mapListData.country}</strong>
            <p style="margin: 0; font-size: 12px;">Exact location provided after booking!</p>
        </div>
    `;

    // Recenter logic
    const recenterBtn = document.getElementById('recenter-btn');
    if (recenterBtn) {
        recenterBtn.addEventListener('click', () => {
            map.flyTo(latLng, 14, {
                duration: 1.5, // Smoothness in seconds
                easeLinearity: 0.25
            });
            marker.openPopup();
        });
    }

    marker.bindPopup(popupHTML);

    // 7. Hover Interactions
    marker.on('mouseover', function () {
        this.openPopup();
    });

    marker.on('mouseout', function () {
        this.closePopup();
    });

} else {
    console.error("Map Data Error: Could not find listing coordinates.");
}