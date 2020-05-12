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
                {field: 'pop_density',
                 displayName: 'Population Density',
                 colorMap: colorbrewer.YlGnBu[6]},
                {field: 'total_cases',
                 displayName: 'Total Covid-19 Cases',
                 colorMap: colorbrewer.YlOrRd[6]},
                 {field: 'case_density',
                  displayName: 'Covid-19 Cases Per 100,000',
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
  closeButton: true,
  closeOnClick: false,
  className: 'round'
  });

  //add tooltip
function addPopup(layer, e) {
  console.log(e.features);
  map.getCanvas().style.cursor = 'pointer';
  var coordinates = e.features[0].geometry.coordinates.slice();
  var fill_html = document.createElement('ul');
  var name = e.features[0].properties['Name'];
  var state = e.features[0].properties['State'];
  var population = d3.format(',')(e.features[0].properties['population']);
  var cases = d3.format(',')(e.features[0].properties['total_cases']);

  var name_item = document.createElement('h1');
  name_item.className = 'txt-bold'
  name_item.textContent = `${name}, ${state}`;
  fill_html.appendChild(name_item);

  var pop_item = document.createElement('li');
  pop_item.className = 'txt-s';
  pop_item.textContent = `Population: `
  var pop_value = document.createElement('strong');
  pop_value.textContent = `${population}`;
  pop_item.appendChild(pop_value);
  fill_html.appendChild(pop_item);
  var cases_item = document.createElement('li');
  cases_item.className = 'txt-s';
  cases_item.textContent = `Covid-19 Cases: `
  var case_count = document.createElement('strong');
  case_count.textContent = `${cases}`;
  cases_item.appendChild(case_count);
  fill_html.appendChild(cases_item);

  if (layer['field'] != 'population' && layer['field'] != 'total_cases'){
  var layer_data = e.features[0].properties[layer['field']];
  layer_data = d3.format(',')(layer_data);
  var item = document.createElement('li');
  item.className = 'txt-s';
  item.textContent = `${layer.displayName}: `
  var number = document.createElement('strong');
  number.textContent = `${layer_data}`;
  item.appendChild(number);
  fill_html.appendChild(item);};

  while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
  coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
  }
  // Populate the popup and set its coordinates
  popup
  .setLngLat(e.lngLat)
  .setHTML(fill_html.outerHTML)
  .addTo(map);
}

function getArrayDepth(value) {
  return Array.isArray(value) ?
    1 + Math.max(...value.map(getArrayDepth)) :
    0;
}


  map.on('load', function() {
    map.addSource('counties', {
    'type': 'vector',
    'url': 'mapbox://kevinlib.1wbbmql3'
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
  'source-layer': 'data-118w2o',
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
  div2.className ='grid grid--gut30 txt-xs';
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
});
var spinner = document.getElementById('spinner');
spinner.remove();
// add tooltip
layers.forEach(function (layer) {
  map.on('click', layer['displayName'], function(e) {
  addPopup(layer, e);
  });

  map.on('mouseenter', layer['displayName'], function(e) {
  map.getCanvas().style.cursor = 'pointer';
  });

  map.on('mouseleave', layer['displayName'], function() {
  map.getCanvas().style.cursor = '';
  //popup.remove();
  });
});

function addHistogram(){
  var dropDown = document.querySelector('select');
  layers.forEach(function (layer) {
  var option = document.createElement('option');
  option.textContent = layer['displayName'];
  dropDown.appendChild(option);});

  var histogramWidget = document.querySelector('as-histogram-widget');
  var field = layers[0]['field']; //default

function createHistogram(histogramWidget, field){
  x = d3.scaleLinear()
        .domain(d3.extent(data, function(d) { return d[field]; }));

  hist = d3.histogram()
  .value(function(d) { return d[field]; })
  .domain(x.domain())
  .thresholds(x.ticks(100))(data);
  rearrange = function(a){return {start: a.x0, end: a.x1, value: a.length}};
  histogramWidget.data = hist.map(rearrange);
  histogramWidget.xAxisOptions = {ticks: 10};

  histogramWidget.tooltipFormatter = function (data) {
    return histogramWidget.defaultFormatter(data);
  }

  histogramWidget.addEventListener('selectionChanged', function (e) {
    layers.forEach(function (layer) {
    if (e.detail === null) {
      // clear filter
      map.setFilter(layer['displayName'], null);
    } else {
      filter_min = ['>=', ['get', field], e.detail.selection[0]]
      filter_max = ['<=', ['get', field], e.detail.selection[1]]
      map.setFilter(layer['displayName'], ['all', filter_min, filter_max]);
    }
  })});}
createHistogram(histogramWidget, field);
function onChange(){

  var select_id = document.querySelector("select");
  var histogramWidget = document.querySelector('as-histogram-widget');
  var field = layers[select_id.selectedIndex]['field'];
  createHistogram(histogramWidget, field);
  }
dropDown.addEventListener("change", onChange);
}
buttons = ['button-menu', 'button-filter', 'button-legend', 'button-search'];
buttons.forEach(function(i) {
  var item = document.getElementById(i);
  item.onclick = function(e){
    // map of btn id to document id
    const name = {'button-menu':'menu','button-filter':'filter-container', 'button-legend':'legend-container', 'button-search':'search-bar'};
    var control = document.getElementById(name[this.id]);
    if (this.classList.contains('is-active')){
      control.classList.add('hide-visually');
      this.classList.remove('is-active');}
    else {
      control.classList.remove('hide-visually');
      this.classList.add('is-active');}
  }});
addHistogram();
var search_bar = document.querySelector("input");

function getUniqueFeatures(array, comparatorProperty) {
var existingFeatureKeys = {};
// Because features come from tiled vector data, feature geometries may be split
// or duplicated across tile boundaries and, as a result, features may appear
// multiple times in query results.
var uniqueFeatures = array.filter(function(el) {
if (existingFeatureKeys[el.properties[comparatorProperty]]) {
return false;
} else {
existingFeatureKeys[el.properties[comparatorProperty]] = true;
return true;
}
});
return uniqueFeatures;

}

// markers saved here
var currentMarkers=[];
var nameList = _.orderBy(data, ['Name', 'State'], ['asc', 'desc']).map(function(a){ return `${a.Name}, ${a.State}` });
// var datalist = document.querySelector('datalist');
// datalist.id = 'names';
// nameList.forEach(function(name) {
// var option = document.createElement('option');
// option.value = name;
// datalist.appendChild(option)});

// constructs the suggestion engine

var names = new Bloodhound({
  datumTokenizer: Bloodhound.tokenizers.whitespace,
  queryTokenizer: Bloodhound.tokenizers.whitespace,
  // `states` is an array of state names defined in "The Basics"
  local: nameList,
  limit: 10
});

$('.typeahead').typeahead({
  hint: true,
  highlight: false,
},
{
  name: 'names',
  source: names,
  limit: 10
});

$('.typeahead').bind('typeahead:change', function(e) {
  userSearch(e.target.value);
});

$('.typeahead').bind('typeahead:select', function(ev, suggestion) {
  userSearch(suggestion);
});

$('.typeahead').bind('typeahead:cursorchange', function(ev, suggestion) {
  userSearch(suggestion);
});

$('.typeahead').bind('typeahead:autocomplete', function(ev, suggestion) {
  userSearch(suggestion);
});

function userSearch(value) {
  // remove markers
  if (currentMarkers != null) {
      for (var i = currentMarkers.length - 1; i >= 0; i--) {
        currentMarkers[i].remove();
      }
  }
  var input = _.split(value, ',', 2)
  input = _.map(input, _.trim)
  county_name = _.startCase(input[0])
  state_name = _.upperCase(input[1])
  var filter_expression;
  if (!state_name){
    filter_expression = ['==', 'Name', county_name]
  }
  else {
    filter_county = ['==', ['get', 'Name'], county_name]
    filter_state = ['==', ['get', 'State'], state_name]
    filter_expression = ['all', filter_county, filter_state];
  }
  //Find all features in one source layer in a vector source
  var features = map.querySourceFeatures('counties', {
  sourceLayer: 'data-118w2o', filter: filter_expression});
  features = getUniqueFeatures(features, 'GEOID');
  if (features.length > 0) {

  //don't use feature state. need to add new layer for highlighting, tooltip
  features.forEach(function(f){
    //addPopupSearch(f)
    var coords = f.geometry.coordinates;
    var coords = _.flattenDepth(f.geometry.coordinates, getArrayDepth(coords) - 2);
    coords = coords.map(function(a){ return {'lon': a[0], 'lat': a[1]} });
    var mean_lon = _.meanBy(coords, 'lon');
    var mean_lat = _.meanBy(coords, 'lat');
    var centroid = [mean_lon, mean_lat];

    var fill_html = document.createElement('ul');
    fill_html.className = 'ml6 mr6'
    var name = f.properties['Name'];
    var state = f.properties['State'];
    var name_item = document.createElement('h1');
    name_item.className = 'txt-bold txt-l'
    name_item.textContent = `${name}, ${state}`;
    fill_html.appendChild(name_item);

    layers.forEach(function(layer){
      var layer_data = f.properties[layer['field']];
      layer_data = d3.format(',')(layer_data);
      var item = document.createElement('li');
      item.className = 'txt-s';
      item.textContent = `${layer.displayName}: `
      var number = document.createElement('strong');
      number.textContent = `${layer_data}`;
      item.appendChild(number);
      fill_html.appendChild(item);
    });
    var marker_popup = new mapboxgl.Popup({
    closeButton: true,
    closeOnClick: false,
    className: 'round',
    maxWidth: 'none'
    }).setHTML(fill_html.outerHTML);


    var marker = new mapboxgl.Marker({color:'#ff00fb'})
                .setLngLat(centroid)
                .setPopup(marker_popup)
                .addTo(map);
    currentMarkers.push(marker);
  });
  }
}

$('#search-clear').click(function() {
$('.typeahead').typeahead('val','');
$('.typeahead').typeahead('close');
// remove markers
if (currentMarkers != null) {
    for (var i = currentMarkers.length - 1; i >= 0; i--) {
      currentMarkers[i].remove();
    }
}
});
};
load_map();
