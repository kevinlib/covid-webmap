mapboxgl.accessToken = 'pk.eyJ1Ijoia2V2aW5saWIiLCJhIjoiY2pyZ3A4aWw5MWdpejN5cG8xYTFhM3dwcCJ9.aqXOtI48eIJELxrnMwkj9w';
const map = new mapboxgl.Map({
container: 'map',
style: 'mapbox://styles/mapbox/light-v10',
center: [-96.7, 41.9],
zoom: 3,
maxzoom: 15
});
async function load_map() {
  var data = await d3.json("./data/data.json");
  var layers = [{field: 'population',
                displayName: 'Population',
                colorMap: colorbrewer.YlGnBu[6]},
                {field: 'total_cases',
                 displayName: 'Covid-19 Cases',
                 colorMap: colorbrewer.YlOrRd[6]},
                {field: 'CVD_deathrate',
                 displayName: 'Cardio-Vascular Disease Rate',
                 colorMap: colorbrewer.YlOrRd[6]},
                {field: 'total_pop_estimate',
                 displayName: '2018 Projected Total Population',
                 colorMap: colorbrewer.YlGnBu[6]},
                {field: 'White',
                 displayName: 'White Projected (2018)',
                 colorMap: colorbrewer.YlGnBu[6]},
                {field: 'Black',
                 displayName: 'Black Projected (2018)',
                 colorMap: colorbrewer.YlGnBu[6]},
                {field: 'Hispanic',
                 displayName: 'Hispanic Projected (2018)',
                 colorMap: colorbrewer.YlGnBu[6]},
                {field: 'Asian',
                 displayName: 'Asian Projected (2018)',
                 colorMap: colorbrewer.YlGnBu[6]},
                {field: 'poverty_rate',
                 displayName: 'Poverty Rate',
                 colorMap: colorbrewer.YlOrRd[6]},
                {field: 'diabetes_rate',
                 displayName: 'Diabetes Rate',
                 colorMap: colorbrewer.YlOrRd[6]}]

  // Create a popup, but don't add it to the map yet.
  var popup = new mapboxgl.Popup({
  closeButton: false,
  closeOnClick: false,
  className: 'round'
  });
  map.on('load', function() {
  map.addSource('counties', {
    'type': 'vector',
    'url': 'mapbox://kevinlib.32zfduyq'
    });
//add layers
layers.forEach(function(layer) {
  var values = data.map(a => a[layer['field']]);
  var min = Math.min.apply(null, values);
  var max = Math.max.apply(null, values);
  layer.colorScale = d3.scaleQuantile()
      .domain(values)
      .range(layer['colorMap'])
  var quantiles = layer.colorScale.quantiles();
  quantiles.unshift(min)
  quantiles.push(max)
  quantiles = quantiles.map(a => d3.format(".2s")(a.toString()))
  // quantiles = Math.round.apply(null, quantiles);
  layer.quantiles = quantiles;
  var expression = ['match', ['get', 'GEOID']];
  // bin data
  // Calculate color for each state based on the population
  data.forEach(function(row) {
  var color = layer.colorScale(row[layer['field']])
  expression.push(row['GEOID'], color);
  });
  // Last value is the default, used where there is no data
  expression.push('#FFFFFF');
  map.addLayer(
  {
  'id': layer['displayName'],
  'type': 'fill',
  'source': 'counties',
  'source-layer': 'data-1mbq73',
  'layout': {'visibility': 'none'},
  'paint': {
  'fill-color': expression,
  'fill-outline-color': '#000000',
  'fill-opacity': 0.7}
});
});
//set first layer to visible
map.setLayoutProperty(layers[0]['displayName'], 'visibility', 'visible');

//add legend
layers.forEach(function(layer) {
  var legendContainer = document.getElementById('legend-container');
  var legend = document.createElement('div');
  legend.className = 'none absolute right bottom mb24 mr24 round px12 py12 bg-white w360';
  legend.id = layer['field'] + ' key';
  var legendText = document.createElement('strong');
  legendText.className = 'block mb12';
  legendText.textContent = layer['displayName'];
  legend.appendChild(legendText);
  var div1 = document.createElement('div');
  var div2 = document.createElement('div');
  div1.className = 'grid mb6';
  div2.className ='grid txt-xs';
  layer['colorMap'].forEach(function(color_step){
    var color =  document.createElement('div');
    color.className = 'col h12';
    color.style.backgroundColor = color_step;
    div1.appendChild(color);});
  layer['quantiles'].forEach(function(step){
    var text =  document.createElement('div');
    text.className = 'col flex-child--grow';
    text.textContent = step
    div2.appendChild(text);
  });
  legend.appendChild(div1);
  legend.appendChild(div2);

  legendContainer.appendChild(legend);
  });


var legendContainer = document.getElementById('legend-container');
// add menu
const btn_default = 'flex-parent-inline btn color-gray-dark round bg-transparent shadow-darken25-on-hover color-white-on-active bg-blue-on-active ml3'
layers.forEach(function(layer, i) {
  var id = layer['displayName'];
  var link = document.createElement('a');
  link.href = '#';
  link.className = btn_default;
  link.textContent = id;

  link.onclick = function(e) {
  var clickedLayer = this.textContent;
  e.preventDefault();
  e.stopPropagation();
  var visibility = map.getLayoutProperty(clickedLayer, 'visibility');
  if (visibility === 'visible') {
    map.setLayoutProperty(clickedLayer, 'visibility', 'none');
    this.classList.remove('is-active');
    legendContainer.children[i].classList.add('none');
  }
  else {
    this.classList.add('is-active');
    map.setLayoutProperty(clickedLayer, 'visibility', 'visible');
    legendContainer.children[i].classList.remove('none');
  }
  };
  var menu = document.getElementById('menu');
  menu.appendChild(link);
});

var menu = document.getElementById('menu');
var links = menu.querySelectorAll("a");
layers.forEach(function (layer, i) {
  var visibility = map.getLayoutProperty(layer.displayName, 'visibility');
  if (visibility === 'visible') {
    links[i].classList.add('is-active');
    legendContainer.children[i].classList.remove('none');}
    else {
      links[i].classList.remove('is-active');
    legendContainer.children[i].classList.add('none');}
  });
var spinner = document.getElementById('spinner');
spinner.remove();
});
// add tooltip
layers.forEach(function (layer) {
  map.on('mouseenter', layer['displayName'], function(e) {
  // Change the cursor style as a UI indicator.
  map.getCanvas().style.cursor = 'pointer';
  var coordinates = e.features[0].geometry.coordinates.slice();
  var fill_html = document.createElement('ul');
  var name = e.features[0].properties['Name'];
  var state = e.features[0].properties['State'];
  var population = d3.format(',')(e.features[0].properties['population']);
  var cases = d3.format(',')(e.features[0].properties['total_cases']);

  var name_item = document.createElement('li');
  name_item.className = 'txt-bold';
  name_item.textContent = `County: ${name}`;
  var state_item = document.createElement('li');
  state_item.className = 'txt-bold';
  state_item.textContent = `State: ${state}`;
  var pop_item = document.createElement('li');
  pop_item.className = 'txt-bold';
  pop_item.textContent = `Population: ${population}`;
  var cases_item = document.createElement('li');
  cases_item.className = 'txt-bold';
  cases_item.textContent = `Covid-19 Cases: ${cases}`;
  fill_html.appendChild(name_item);
  fill_html.appendChild(state_item);
  fill_html.appendChild(pop_item);
  fill_html.appendChild(cases_item);

  if (layer['field'] != 'population' && layer['field'] != 'total_cases'){
  var layer_data = e.features[0].properties[layer['field']];
  if (layer['field'] == 'total_pop_estimate'){
    layer_data = d3.format(',')(layer_data);
  };
  var item = document.createElement('li');
  item.className = 'txt-bold';
  item.textContent = `${layer.displayName}: ${layer_data}`;
  fill_html.appendChild(item);};

  while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
  coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
  }
  // Populate the popup and set its coordinates
  // based on the feature found.
  popup
  .setLngLat(e.lngLat)
  .setHTML(fill_html.outerHTML)
  .addTo(map);
  });

  map.on('mouseleave', layer['displayName'], function() {
  map.getCanvas().style.cursor = '';
  popup.remove();
  });
});
};
load_map();
