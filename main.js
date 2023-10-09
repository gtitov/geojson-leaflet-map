var map = L.map('map').setView([55.8, 37.5], 4);

var positron = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png', {
        attribution: '©OpenStreetMap, ©CartoDB'
})
var osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' });

async function getData() {
    var countries = await fetch('./geojson/ne_50m_admin_0_countries.geojson').then(response => response.json());
    var cities = await fetch('./geojson/ne_50m_populated_places.geojson').then(response => response.json());
    var rivers = await fetch('./geojson/ne_50m_rivers_lake_centerlines.geojson').then(response => response.json());
    var lakes = await fetch('./geojson/ne_50m_lakes.geojson').then(response => response.json());
    var datasets = [countries, cities, rivers, lakes]
    return datasets
}

getData().then(
    datasets => {
        var countries = datasets[0]
        var cities = datasets[1]
        var rivers = datasets[2]
        var lakes = datasets[3]

        function getColor(pop) {
            return pop > 1000000000 ? '#800026' :
                   pop > 300000000  ? '#BD0026' :
                   pop > 100000000  ? '#E31A1C' :
                   pop > 50000000   ? '#FC4E2A' :
                   pop > 25000000   ? '#FD8D3C' :
                   pop > 10000000   ? '#FEB24C' :
                   pop > 1000000    ? '#FED976' :
                   '#FFEDA0';
        }

        var countries_layer = L.geoJSON(countries,
            {
                style: function (feature) {
                    return {
                        fillColor: getColor(feature.properties.POP_EST),
                        weight: 1,
                        opacity: 1,
                        color: 'white',
                        fillOpacity: 0.7
                    };
                },
                onEachFeature: function (feature, layer) {
                    layer.bindPopup(`${feature.properties.NAME_RU}: ${feature.properties.POP_EST} чел.`)
                }
            }
        ).addTo(map)

        var rivers_layer = L.geoJSON(rivers,
            {
                style: {
                    weight: 0.5,
                    opacity: 1,
                    color: '#007CE5',
                },
                interactive: false
            }
        ).addTo(map)

        var lakes_layer = L.geoJSON(lakes,
            {
                style: {
                    fillColor: '#ADE4FF',
                    fillOpacity: 1,
                    weight: 0.3,
                    opacity: 1,
                    color: '#007CE5',
                },
                interactive: false
            }
        ).addTo(map)

        var cities_layer = L.geoJSON(cities,
            {
                pointToLayer: function (feature, latlng) {
                    return L.circleMarker(latlng);
                },
                style: {
                    radius: 3,
                    stroke: false,
                    fillOpacity: 0.7,
                    fillColor: "red"
                },
                filter: function(feature) {
                    return feature.properties.POP_MAX >= 1000000
                }
            }
        ).addTo(map)

        var layers = {
            "Страны": countries_layer,
            "Водоёмы": lakes_layer,
            "Реки": rivers_layer,
            "Города": cities_layer
        };

        var basemaps = {
            "Серая подложка": positron,
            "OSM": osm
        }

        L.control.layers(basemaps, layers).addTo(map);

        var legend = L.control({ position: 'bottomright' });

        legend.onAdd = function (map) {

            var div = L.DomUtil.create('div', 'info legend')
            var grades = [0, 1000000, 10000000, 25000000, 50000000, 100000000, 300000000, 1000000000]

            for (var i = 0; i < grades.length; i++) {
                div.innerHTML +=
                    `<i style="background: ${getColor(grades[i] + 1)}"></i>${grades[i]}${grades[i + 1] ? '&ndash;' + grades[i + 1] + '<br>' : '+'}`;
            }

            return div;
        };

        legend.addTo(map);

        map.attributionControl.addAttribution('&copy; Natural Earth');
    }
)
