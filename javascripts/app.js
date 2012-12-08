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
  , width = 700 - margin.left - margin.right
  , height = 700 - margin.top - margin.bottom;

var radius = Math.min(width, height) / 2
  , color = d3.scale.category20c();


/*
 * Draw the canvas...
 */
var svg = d3.select('#container').append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
  .append('g')
    .attr('transform', 'translate(' + width / 2 + ',' + height/2 + ')');

  var partition = d3.layout.partition()
    .sort(null)
    .size([2 * Math.PI, radius * radius])
    .value(function(d) { return 1; });

  var arc = d3.svg.arc()
    .startAngle(function(d) { return d.x; })
    .endAngle(function(d) { return d.x + d.dx; })
    .innerRadius(function(d) { return Math.sqrt(d.y); })
    .outerRadius(function(d) { return Math.sqrt(d.y + d.dy); });

var data
  , data_h
  , ant;


/*
 * Grab the data.
 *
 * Data is loaded async, callback is called when data
 * is fetched.
 */ 
d3.csv('data/csv/__all.csv', function(csv) {
  console.log(csv);
  data = csv;
  ant = generateDataTree(data);
  console.log(ant);
  // Data is set, start drawing...
  drawShapes();
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
      .style('fill', function(d) { return color((d.children ? d : d.parent).name); })
      .style('fill-rule', 'evenodd')
      .each(stash);

  d3.selectAll('input').on('change', function change() {
    var val = this.value;
    var value = val === 'district' ?
      function(d) { return 1; } :
      function(d) { 
        console.log(val);
        return d[val]; 
      };

    path.data(partition.value(value).nodes)
      .transition()
        .duration(1500)
        .attrTween('d', arcTween);

  });
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
    
      // Create a district when it does not yest exist...
      if (data[i].district) {
        var district = districtExist(data[i].district) ?
          getDistrict(data[i].district) :
          createDistrict(data[i].district);
    
        // Add it up
        var data_type = data[i].data_type;
        if (!district[data_type]) district[data_type] = 1;
        district[data_type] = district[data_type] + 1;
      }
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

