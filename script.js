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

        /**
         * A customized popup on the map.
         */
        class Popup extends google.maps.OverlayView {
            position;
            containerDiv;
            constructor(position, content) {
                super();
                this.position = position;
                content.classList.add("popup-bubble");
                // This zero-height div is positioned at the bottom of the bubble.
                const bubbleAnchor = document.createElement("div");
                bubbleAnchor.classList.add("popup-bubble-anchor");
                bubbleAnchor.appendChild(content);
                // This zero-height div is positioned at the bottom of the tip.
                this.containerDiv = document.createElement("div");
                this.containerDiv.classList.add("popup-container");
                this.containerDiv.appendChild(bubbleAnchor);
                // Optionally stop clicks, etc., from bubbling up to the map.
                Popup.preventMapHitsAndGesturesFrom(this.containerDiv);
            }

            /** Called when the popup is added to the map. */
            onAdd() {
                this.getPanes().floatPane.appendChild(this.containerDiv);
            }

            /** Called when the popup is removed from the map. */
            onRemove() {
                if (this.containerDiv.parentElement) {
                    this.containerDiv.parentElement.removeChild(this.containerDiv);
                }
            }

            /** Called each frame when the popup needs to draw itself. */
            draw() {
                const divPosition = this.getProjection().fromLatLngToDivPixel(
                    this.position
                );
                // Hide the popup when it is far out of view.
                const display =
                    Math.abs(divPosition.x) < 4000 && Math.abs(divPosition.y) < 4000
                    ? "block"
                    : "none";

                if (display === "block") {
                    this.containerDiv.style.left = divPosition.x + "px";
                    this.containerDiv.style.top = divPosition.y + "px";
                }

                if (this.containerDiv.style.display !== display) {
                    this.containerDiv.style.display = display;
                }
            }
        }
        firebase.database().ref("locations").on('value', snapshot => {
            const data = snapshot.val();
            console.log(data);
            for (const location in locations) {
                locations[location].marker.setMap(null);
                delete markers[location];
            }
            const markerContainer = document.getElementById("markers");
            markerContainer.innerHTML = "";

            for (const location in data) {
                locations[location] = data[location];
                const container = gen("div");
                container.appendChild(genCardTitle(location));
                container.appendChild(
                    genCardTime(
                        locations[location].queue,
                        locations[location].workers,
                        locations[location].workRate
                    )
                );
                markerContainer.appendChild(container);
                data.marker = new Popup(new google.maps.LatLng(locations[location].lat, locations[location].long), container);
                data.marker.setMap(map);
            }
        });
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
        console.log(queue);
        const timeLeft = Object.values(queue).reduce((acc, curr) => acc + curr)
        const estTime = timeLeft / (workers * workRate)
        time.textContent = "Est. " + (estTime > 60 ? "60+ mins" : estTime + " mins");
        return time;
    }

    function gen(tag) {
        return document.createElement(tag);
    }
})();