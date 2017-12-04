var width = 800, height = 500;
var projection = d3.geoAlbersUsa().translate([width/2, height/2]);
var path = d3.geoPath().projection(projection);

var svg = d3.select("#map").append("svg")
	.attr("width", width)
	.attr("height", height);

var mapTooltip = d3.select("body").append("div")
	.attr("class", "tooltipMap")
	.style("opacity", 0);

//make the pie chart all grey
var colorScheme = [
	"#BFBFBF",
	"#BFBFBF",
	"#BFBFBF",
	"#BFBFBF",
	"#BFBFBF",
	"#BFBFBF",
	"#BFBFBF",
	"#BFBFBF",
	"#BFBFBF",
	"#BFBFBF"
];

//creates map of US
d3.json("us.json", function(us){
	svg.selectAll("path")
		.data(us.features)
		.enter()
		.append("path")
			.attr("d", path)
			.attr("class", "states")
});

//read the data set, and put into variable
d3.csv("ufo_sightings_data_us_scrubbed.csv", 
	function(data){
		initialData = data;
		addSightingsByYear(data);
	}
);

//fills the map with locations of the sightings by year
function addSightingsByYear(){
	//remove all current sightings for updateCommands
	d3.selectAll(".sightings").remove();
	
	//get the current year
	var selectedYear = document.getElementById("slider").value;
	
	//filter our data: get sightings by year
	var sightingsByYear = initialData.filter(
		function(d){
			return d.year == selectedYear;
		}
	);
	
	//populate map with sightings by year
	var sightings = svg.selectAll(".sightings")
		.data(sightingsByYear)
		.enter()
		.append("circle")
			.attr("cx", 
				function(d){
					return projection([d.longitude, d.latitude])[0];
				}
			)
			.attr("cy", 
				function(d){
					return projection([d.longitude, d.latitude])[1];
				}
			)
			.attr("r", 3)
			.attr("class", "sightings");
			
	sightings.on("mouseover",
		function(d){
			mapTooltip.transition()
				.duration(250)
				.style("opacity", 1);
			
			mapTooltip.html(d.city + ", " + d.state + " Shape: " + d.shape)
				.style("left", (d3.event.pageX + 15) + "px")
				.style("top", (d3.event.pageY - 28) + "px");
		}
	);
	
	sightings.on("mouseout",
		function(d){
			mapTooltip.transition()
			.duration(250)
			.style("opacity", 0);
		}
	);
			
	//update the headers
	updateHeaders(selectedYear, sightingsByYear);
	
	//update the pie chart
	updatePieChart("#chart", colorScheme, sightingsByYear);

}//end addSightingsByYear()

//updates the year and count texts
function updateHeaders(year, data){
	//update year text
	d3.select(".year").text("Year: " + year);
	
	//get number of sightings in that year
	var countByYear = d3.nest()
		.key(
			function(d){
				return d.year;
			}
		)
		.rollup(
			function(values){
				return values.length;
			}
		)
		.entries(data);
	
	//update number of sightings text
	d3.select(".count").text(
		function(d, i){
			if(countByYear[i] == undefined)
				return "Sightings: 0";
			return "Sightings: " + countByYear[i].value
		}
	);
}//end updateHeaders(...)

//update map if slider is changed
d3.select("#slider").on("input", 
	function() {
		addSightingsByYear();
	}
);

//updates pie chart based on current year & data set
function updatePieChart(domElementToAppendTo, scheme, sightings){
	//clears out the DOM elements to update properly
	d3.selectAll(".tooltipChart").remove();
	d3.selectAll(".legend").remove();
	d3.selectAll(".rect").remove();
	d3.selectAll(".arc").remove();
	d3.select(domElementToAppendTo).select("svg").remove();
	
	//get shapes and their counts
	var countByShape = d3.nest()
		.key(
			function(d){
				return d.shape;
			}
		)
		.rollup(
			function(values){
				return values.length;
			}
		)
		.entries(sightings);
		
	//initialize counts to 0
	var shapesData = [
		{label:"Chevron",	value: 0},
		{label:"Cross",		value: 0},
		{label:"Cylinder",	value: 0},
		{label:"Diamond",	value: 0},
		{label:"Disk",		value: 0},
		{label:"Formation",	value: 0},
		{label:"Pyramid",	value: 0},
		{label:"Rectangle",	value: 0},
		{label:"Sphere",	value: 0},
		{label:"Other",		value: 0}
	];
	
	//update values for shapesData
	for(var i = 0; i < countByShape.length; i++){
		for(var j = 0; j < shapesData.length; j++){
			if(countByShape[i].key == shapesData[j].label){
				shapesData[j].value = countByShape[i].value;
				continue;
			}
		}
	}
	
	
	var margin = {top: 50, bottom: 50, left: 50, right: 50};
	var width = 500 - margin.left - margin.right, height = width, radius = Math.min(width, height) / 2;
	var donutWidth = 75;
	var legendRectSize = 18;
	var legendSpacing = 4;
	
	shapesData.forEach(
		function(item){
			item.enabled = true;
		}
	);
	
	var color = d3.scaleOrdinal().range(scheme);
	var chart = d3.select(domElementToAppendTo)
		.append("svg")
		.attr("width", width)
		.attr("height", height)
		.append("g")
		.attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");
	
	var arc = d3.arc()
		.outerRadius(radius - 10)
		.innerRadius(50);
	
	var pie = d3.pie()
		.sort(null)
		.value(function(d) { return d.value; });
	
	var tooltip = d3.select(domElementToAppendTo)
		.append('div')
		.attr('class', 'tooltipChart');
	
	tooltip.append('div')
		.attr('class', 'label');

	tooltip.append('div')
		.attr('class', 'count');

	tooltip.append('div')
		.attr('class', 'percent');
	
	var g = chart.selectAll('.arc')
		.data(pie(shapesData))
		.enter().append('g')
		.attr("class", "arc");
		
	g.append("path")
		.attr('d', arc)
		.attr('fill', 
			function(d, i) {
				return color(d.data.label);
			}
		)
		.each(
			function(d){
				this._current = d;
			}
		);
	
	g.on('mouseover', 
		function(d){
			var total = d3.sum(shapesData.map(
				function(d){
					if(d.enabled)
						return d.value;
					return 0;
				}
			));

			var percent = Math.round(1000 * d.data.value / total) / 10;
			tooltip.select('.label').html(d.data.label.toUpperCase()).style('color','black');
			tooltip.select('.count').html(d.data.value);
			tooltip.select('.percent').html(percent + '%');

			tooltip.style('display', 'block');
			tooltip.style('opacity',2);
			
			d3.select(this)
				.interrupt()
				.transition()
				.duration(300)
				.ease(d3.easeCubic)
				.attr('transform', 'scale(1.05)')
			
			  
		}
	);
	
	g.on('mousemove', 
		function(d){
			tooltip.style('top', (d3.event.layerY + 10) + 'px')
			.style('left', (d3.event.layerX - 25) + 'px');
		}
	);
	
	g.on('mouseout', 
		function(){
			tooltip.style('display', 'none');
			tooltip.style('opacity',0);
			
			d3.select(this)
				.interrupt()
				.transition()
				.duration(300)
				.ease(d3.easeCubic)
				.attr('transform', 'scale(1)')
				.style('filter', 'none')
		}
	);
	
}//end updatePieChart(...)

d3.select(self.frameElement).style("height", "675px");
	
	
