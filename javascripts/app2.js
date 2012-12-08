/*
 * @file
 * Pack layout
 *
 * @see:
 *   https://github.com/mbostock/d3/wiki/Pack-Layout
 *   http://bl.ocks.org/4063530
 */

/*
 * Set some map properties...
 */
var margin = {left: 20, top: 20, right: 20, bottom: 20}
  , width = 600 - margin.left - margin.right
  , height = 600 - margin.top - margin.bottom;

var radius = Math.min(width, height) / 2
   , color = function(name) {return legend[name]}
   , formatNumber = d3.format(',')
   , formatFloat = d3.format('.2');

var legend = {
  TSTAD: '#009999',
  antwerpen: '#336666',
  'berendrecht-zandvliet': '#006666',
  ekeren: '#33cccc',
  merksem: '#66cccc',
  hoboken: '#009999',
  wilrijk: '#336666',
  berchem: '#006666',
  borgerhout: '#33cccc',
  deurne: '#66cccc',
};


var legend = {
  antwerpen: '#FFF7FB',
  'berendrecht-zandvliet': '#ECE7F2',
  ekeren: '#D0D1E6',
  merksem: '#A6BDDB',
  hoboken: '#74A9CF',
  wilrijk: '#3690C0',
  berchem: '#0570B0',
  borgerhout: '#045A8D',
  deurne: '#023858',
};

var legend = {
  antwerpen: '#74A9CF',
  'berendrecht-zandvliet': '#A6BDDB',
  ekeren: '#D0D1E6',
  merksem: '#A6BDDB',
  hoboken: '#74A9CF',
  wilrijk: '#3690C0',
  berchem: '#0570B0',
  borgerhout: '#045A8D',
  deurne: '#0570B0',
};

var displayLabels = {
  district: 'district',
  area: "square kilometers",
  population: 'people',
  schools: 'schools',
  companies: 'companies',
  culture: 'activities'
};

var opp = {
  antwerpen: 87.30,
  berchem: 5.79,
  'berendrecht-zandvliet': 52.66,
  borgerhout:  3.93,
  deurne:  13.06,
  ekeren:  8.07,
  hoboken: 10.67,
  merksem: 8.28,
  wilrijk: 13.61
}


/*
 * Draw the canvas...
 */
var svg = d3.select('.canvas').append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
  .append('g')
    .attr('transform', 'translate(' + width / 2 + ',' + height/2 + ')');

  var partition = d3.layout.partition()
    .sort(null)
    .size([2 * Math.PI, radius * radius])
    .value(function(d) { return 0; });

  var arc = d3.svg.arc()
    .startAngle(function(d) { return d.x; })
    .endAngle(function(d) { return d.x + d.dx; })
    .innerRadius(function(d) { return Math.sqrt(d.y) + 30; })
    .outerRadius(function(d) { return Math.sqrt(d.y + d.dy); });

var data
  , data_h
  , ant
  , label = []
  , display = ['district']
  , stat;


/*
 * Grab the data.
 *
 * Data is loaded async, callback is called when data
 * is fetched.
 */ 
d3.csv('data/csv/bevolking.html', function(csv) {
  console.log(csv);
  data = csv;
  ant = generateDataTree(data);
  console.log(ant);
  // Data is set, start drawing...
  drawShapes();
  drawDisplayLabel();
});



/*
 * Draws the circle pack layout...
 */
function drawShapes() {

  var path = svg.datum(ant).selectAll('path')
      .data(partition.nodes)
    .enter().append('path')
      .attr('display', function(d) { return d.depth ? null : 'none'; })
      .attr('d', arc)
      .style('stroke', '#fff')
      .style('fill', function(d) {
        var val =  (d.children ? d : d.parent).name;
        return color(val); 
      })
      .style('fill-rule', 'evenodd')
      .each(stash)
      .on('mouseover', function(d, i){
        label.push(d);
        drawLabel();
        changeColor(d, i, this);
      })
      .on('mouseout', function(d, i) {
        label.shift();
        drawLabel();
        revertColor(d, i, this);
      });


  d3.selectAll('input').on('change', function change() {
    display.push(this.value);
    var value = display === 'district' ?
      function(d) { return d.district; } :
      function(d) { 
        console.log(display);
        return d[display]; 
      };

    display.shift();
    drawDisplayLabel();

    path.data(partition.value(value).nodes)
      .transition()
        .duration(1500)
        .attrTween('d', arcTween);
  });


  /*
   * Draw the graph.
   */
  setTimeout(function(){
    path.data(partition.value(function(){ return 1;}).nodes)
      .transition()
        .duration(1500)
        .attrTween('d', arcTween);
  }, 750);


  /*
   * Show rest of page.
   */
  setTimeout(function(){
    $('#facets').fadeIn('slow');
  }, 3500);

  setTimeout(function(){
    $('.fixed').fadeIn('slow');
  }, 3800);

}


/*
 * Draws the label.
 */
function drawLabel() {

  var text = svg.selectAll('text.label')
    .data(label, function(d) { return d.name; });

  text.enter().append('text')
      .attr('class', 'label')
      .attr('y', -190)
      .attr("x", function(d, i) { return 0; })
      .attr("dy", 0)
      .attr("text-anchor", "middle")
      .style("fill-opacity", 1e-6)
    .transition()
      .duration(300)
      .attr('y', -110)
      .style("fill-opacity", 1);

  text.text(function(d) {
    console.log(d);
    return d.name;
  });

  text.exit()
    .transition()
      .duration(400)
      .attr('y', -90)
      .style("fill-opacity", 1e-6)
      .remove();

  drawStats();
}


/*
 * Change color graph block on hover.
 */
function changeColor(d, i, that) {

  d3.select(that).transition()
    .duration(250)
    .style('fill', '#023858');
}


/*
 * Reverts color back to original.
 */
function revertColor(d, i, that) {

  d3.select(that).transition()
    .duration(350)
    .style('fill', function(d) {
      var val =  (d.children ? d : d.parent).name;
      return color(val); 
    });
}


/*
 * Draws the stats.
 */
function drawStats() {

  var stat = svg.selectAll('text.stat')
    .data(label, function(d) { return d.name; });

  stat.enter().append('text')
      .attr('class', 'stat '+ display)
      .attr('y', 50)
      .attr("x", function(d, i) { return 0; })
      .attr("dy", 0)
      .attr("text-anchor", "middle")
      .style("fill-opacity", 1e-6)
    .transition()
      .duration(300)
      .style("fill-opacity", 1);

  stat.text(function(d) {
    if (display == 'area') {
      var fl = +opp[d.name];
      return formatFloat(fl);
    }
    if (display == 'district') return d.code;
    var num = +d[display];
    return formatNumber(num);
  });

  stat.exit()
    .transition()
      .duration(200)
      .style("fill-opacity", 1e-6)
      .remove();
}


/*
 * Display display label.
 */
function drawDisplayLabel() {
  var text = svg.selectAll('text.display')
    .data(display, function(d) { return d; });

  text.enter().append('text')
      .attr('class', 'display')
      .attr('y', 180)
      .attr("x", function(d, i) { return 0; })
      .attr("dy", 0)
      .attr("text-anchor", "middle")
      .style("fill-opacity", 1e-6)
    .transition()
      .duration(300)
      .attr('y', 100)
      .style("fill-opacity", 1);

  text.text(function(d) {
    console.log(d);
    return displayLabels[d];
  });

  text.exit()
    .transition()
      .duration(400)
      .attr('y', 50)
      .style("fill-opacity", 1e-6)
      .remove();
}


function stash(d) {
  d.x0 = d.x;
  d.dx0 = d.dx;
}

function arcTween(a) {
  var i = d3.interpolate({x: a.x0, dx: a.dx0}, a);
  return function(t) {
    var b = i(t);
    a.x0 = b.x;
    a.dx0 = b.dx;
    return arc(b);
  }
}


d3.select(self.frameElement).style('height', height + 'px');


/*
 * Parses data into hierarchical json object.
 */
function generateDataTree(data) {

  // Create root element...
  var root = {
      name: "TSTAD"
    , children: []
  };

  // Return hierarchical tree.
  return createTree();


  /*
   * Creates hierarchical tree
   * from data and root.
   */
  function createTree() {

    // Loop over dataset and create items...
    for (var i = 0, length = data.length; i < length; i++) {
      console.log(data);
    
      if (data[i].district !== 'onbekend') {

        var district = districtExist(data[i].district) ?
          getDistrict(data[i].district) :
          createDistrict(data[i].district);
    
        // Add population
        district.population = data[i].population_2012;
        district.district = 1;
        district.income = data[i].inkomen_2009;
        district.area = data[i].area;
        district.schools = data[i].schools;
        district.culture = data[i].uit_2011;
        district.companies = data[i].companies_2010;
        district.code = data[i].code;
      }
      //
      /*
      district.children = [{
          name: 'men'
        , population: data[i].men_2012
      }, {
          name: 'woman'
        , population: data[i].woman_2012
      }];
      */
    }

    // Finally, return the root
    return root;
  }


  /*
   * Checks whether a given district exists.
   */
  function districtExist(name) {
    for (var i = 0, length = root.children.length; i < length; i++) {
      if (root.children[i].name == name) return true;
    }
    return false;
  }


  /*
   * Return a district part of the current tree.
   */
  function getDistrict(name) {
    for (var i = 0, length = root.children.length; i < length; i++) {
      if (root.children[i].name == name) return root.children[i];
    }
    return false;
  }


  /*
   * Creates a new district and makes it part of the tree.
   */
  function createDistrict(name) {
    var district = {
        name: name
      , children: []
    };
    root.children.push(district);
    return district;
  }
}

