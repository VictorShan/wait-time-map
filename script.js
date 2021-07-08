"use strict";
(function() {

    const locations = {}

    window.addEventListener("load", init);

    function init() {
        const map = initMap();
        listenToDB(map);
    }

    function initMap() {
        const uwHUB = { lat: 47.65533, lng: -122.30510 };
        return new google.maps.Map(document.getElementById("map"), {
            center: uwHUB,
            zoom: 16,
        });
    }

    function listenToDB(map) {
        firebase.database().ref("locations").on('value', snapshot => {
            const data = snapshot.val();
            for (const location in locations) {
                locations[location].marker.setMap(null);
                locations[location].infoWindow.setMap(null);
                delete locations[location];
            }
            for (const location in data) {
                locations[location] = data[location];
                [locations[location].marker, locations[location].infoWindow] = genMarker(location, data[location], map);
            }
        });
    }

    function genMarker(name, data, map) {
        const container = gen("div");
        container.appendChild(genCardTitle(name));
        container.appendChild(genCardTime(data.queue, data.workers, data.workRate));

        const infoWindow = new google.maps.InfoWindow({
            content: convertDOMToString(container),
            position: new google.maps.LatLng(data.lat, data.long),
        });
        const marker = new google.maps.Marker({
            position: { lat: parseFloat(data.lat), lng: parseFloat(data.long) },
            map,
            title: name,
        });

        let isOpen = true;
        infoWindow.open({
            anchor: null, //marker,
            map,
            shouldFocus: false,
        });
        marker.addListener("click", () => {
            if (isOpen) {
                infoWindow.close();
            } else {
                infoWindow.open({
                    anchor: null,
                    map,
                    shouldFocus: false,
                });
            }
            isOpen = !isOpen;
        });

        return [marker, infoWindow];
    }

    function convertDOMToString(element) {
        const container = gen("div");
        container.appendChild(element);
        return container.innerHTML;
    }

    function genCardTitle(title) {
        const cardTitle = gen("p");
        cardTitle.classList.add("card-title");
        cardTitle.textContent = title;
        return cardTitle;
    }

    function genCardTime(queue, workers, workRate) {
        const time = gen("p");
        time.classList.add("card-time");
        const timeLeft = Object.values(queue).reduce((acc, curr) => acc + curr)
        const estTime = timeLeft / (workers * workRate)
        time.textContent = "Est. " + (estTime > 60 ? "60+ mins" : estTime + " mins");
        return time;
    }

    function gen(tag) {
        return document.createElement(tag);
    }
})();