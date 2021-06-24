// Set chart container 
var svgWidth = 900;
var svgHeight = 500;

var margin = {
  top: 50,
  right: 80,
  bottom: 80,
  left: 80
};

var width = svgWidth - margin.left - margin.right;
var height = svgHeight - margin.top - margin.bottom;

// SVG wrapper to hold the chart 
var svg = d3
  .select("#scatter")
  .classed("chart", true)
  .append("svg")
  .attr("width", svgWidth)
  .attr("height", svgHeight)

// Append an SVG group
var chartGroup = svg.append("g")
  .attr("transform", `translate(${margin.left}, ${margin.top})`);

// Initial Params
var chosenXAxis = "poverty";
var chosenYAxis = "healthcare";

// functions for scaling data 
function xScale(data, chosenXAxis) {

  var xLinearScale = d3.scaleLinear()
    .domain([
      d3.min(data, d => d[chosenXAxis] * 0.9),
      d3.max(data, d => d[chosenXAxis])
    ])
    .range([0, width]);
  return xLinearScale;
}

function yScale(data, chosenYAxis) {
  var yLinearScale = d3.scaleLinear()
    .domain([
      d3.max(data, d => d[chosenYAxis]),
      d3.min(data, d => d[chosenYAxis] * 0.8)
    ])
    .range([0, height]);
  return yLinearScale;
}

function renderAxes(newXScale, xAxis) {
  var bottomAxis = d3.axisBottom(newXScale);

  xAxis.transition()
    .duration(1000)
    .call(bottomAxis);

  return xAxis;
}

function renderYAxes(newYScale, yAxis) {
  var leftAxis = d3.axisLeft(newYScale);

  yAxis.transition()
    .duration(1000)
    .call(leftAxis);

  return yAxis;
}

// Function to update circles 
function renderCircles(circlesGroup, newXScale, chosenXAxis) {

  circlesGroup.transition()
    .duration(1000)
    .attr("cx", d => newXScale(d[chosenXAxis]));

  return circlesGroup;
}

function renderYCircles(circlesGroup, newYScale, chosenYAxis) {

  circlesGroup.transition()
    .duration(1000)
    .attr("cy", d => newYScale(d[chosenYAxis]));

  return circlesGroup;
}

// Function to move circle labels
function moveLabels(circleText, newXScale, chosenXAxis) {

  circleText.transition()
    .duration(1000)
    .attr("dx", d => newXScale(d[chosenXAxis]))

  return circleText;
}
function moveYLabels(circleText, newYScale, chosenYAxis) {

  circleText.transition()
    .duration(1000)
    .attr("dy", d => newYScale(d[chosenYAxis] - 0.3))

  return circleText;
}

// function used for updating circles group with new tooltip
function updateToolTip(chosenXAxis, circlesGroup, chosenYAxis) {

  if (chosenXAxis != 'income') {
    var toolTip = d3.tip()
      .attr("class", "d3-tip")
      .offset([40, -60])
      .html(function (data) {
        return (
          `${data['state']}<br>
          ${chosenXAxis}: ${data[chosenXAxis]}%<br> 
          ${chosenYAxis}: ${data[chosenYAxis]}%`
        )
      });
  }

  else { // adds '$' for income axis 
    var toolTip = d3.tip()
      .attr("class", "d3-tip")
      .html(function (data) {
        return (
          `${data['state']}<br>
          ${chosenXAxis}: $${data[chosenXAxis]}<br> 
          ${chosenYAxis}: ${data[chosenYAxis]}%`)
      });
  }

  circlesGroup.call(toolTip);

  circlesGroup.on("mouseover", function (data) {
    toolTip.show(data, this);
  })
    .on("mouseout", function (data, index) {
      toolTip.hide(data);
    });

  return circlesGroup;
};

// Retrieve data from the CSV file and execute everything below
d3.csv("resources/data.csv").then(function (data) {

  // Convert numerical data 
  data.forEach(function (d) {
    d.income = +d.income;
    d.poverty = +d.poverty;
    d.healthcare = +d.healthcare;
    d.smokes = +d.smokes;
  });

  // Scale data
  var xLinearScale = xScale(data, chosenXAxis);
  var yLinearScale = yScale(data, chosenYAxis);

  // Add axes
  var bottomAxis = d3.axisBottom(xLinearScale);
  var leftAxis = d3.axisLeft(yLinearScale);

  var xAxis = chartGroup.append("g")
    .classed("x-axis", true)
    .attr("transform", `translate(0, ${height})`)
    .call(bottomAxis);

  var yAxis = chartGroup.append("g")
    .classed("y-axis", true)
    .call(leftAxis);

  // Add default circles 
  var circlesGroup = chartGroup.selectAll("circle")
    .data(data)
    .enter()
    .append("g")
    .attr("id", "circles")
    .append("circle")
    .classed("stateCircle", true)
    .attr("cx", d => xLinearScale(d[chosenXAxis]))
    .attr("cy", d => yLinearScale(d[chosenYAxis]))
    .attr("r", 15)
    .attr("opacity", ".5");

  // Add state abbreviations to circles 
  var circleText = chartGroup.selectAll("#circles")
    .append("text")
    .text(d => d.abbr)
    .classed("stateText", true)
    .attr("dx", d => xLinearScale(d[chosenXAxis]))
    .attr("dy", d => yLinearScale(d[chosenYAxis] - 0.3));

  // Groups for axis labels 
  var labelsGroup = chartGroup.append("g")
    .attr("transform", `translate(${width / 2}, ${height + 20})`);

  var yLabels = chartGroup.append("g")

  // Axis labels 
  var povertyLabel = labelsGroup.append("text")
    .attr("x", 0)
    .attr("y", 20)
    .attr("value", "poverty") // value to grab for event listener
    .classed("active", true)
    .text("Poverty (%)");

  var ageLabel = labelsGroup.append("text")
    .attr("x", 0)
    .attr("y", 40)
    .attr("value", "age") // value to grab for event listener
    .classed("inactive", true)
    .text("Median Age");

  var incomeLabel = labelsGroup.append("text")
    .attr("x", 0)
    .attr("y", 60)
    .attr("value", "income")
    .classed("inactive", true)
    .text("Median Income");

  var healthcareLabel = yLabels.append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", 0 - (margin.left - 35))
    .attr("x", 0 - (height / 2))
    .attr("dy", "1em")
    .attr("value", "healthcare")
    .classed("active", true)
    .text("Lacking Healthcare (%)");

  var obesityLabel = yLabels.append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", 0 - (margin.left - 15))
    .attr("x", 0 - (height / 2))
    .attr("dy", "1em")
    .attr("value", "obesity")
    .classed("inactive", true)
    .text("Obesity (%)");

  var smokerLabel = yLabels.append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", 0 - (margin.left + 5))
    .attr("x", 0 - (height / 2))
    .attr("dy", "1em")
    .attr("value", "smokes")
    .classed("inactive", true)
    .text("Smokers (%)");

  // updateToolTip function
  var circlesGroup = updateToolTip(chosenXAxis, circlesGroup, chosenYAxis);

  // x axis labels event listener
  labelsGroup.selectAll("text")
    .on("click", function () {

      var value = d3.select(this).attr("value"); // Grab value 

      if (value !== chosenXAxis) {
        chosenXAxis = value;

        // Rescale data and move circles 
        xLinearScale = xScale(data, chosenXAxis);
        xAxis = renderAxes(xLinearScale, xAxis);
        circlesGroup = renderCircles(circlesGroup, xLinearScale, chosenXAxis);
        circleText = moveLabels(circleText, xLinearScale, chosenXAxis);
        circlesGroup = updateToolTip(chosenXAxis, circlesGroup, chosenYAxis);

        // Updates labels to bold
        if (chosenXAxis === "age") {
          ageLabel
            .classed("active", true)
            .classed("inactive", false);
          povertyLabel
            .classed("active", false)
            .classed("inactive", true);
          incomeLabel
            .classed("active", false)
            .classed("inactive", true);
        }

        if (chosenXAxis === 'poverty') {
          povertyLabel
            .classed("active", true)
            .classed("inactive", false);
          ageLabel
            .classed("active", false)
            .classed("inactive", true);
          incomeLabel
            .classed("active", false)
            .classed("inactive", true);
        }

        if (chosenXAxis === 'income') {
          povertyLabel
            .classed("active", false)
            .classed("inactive", true);
          ageLabel
            .classed("active", false)
            .classed("inactive", true);
          incomeLabel
            .classed("active", true)
            .classed("inactive", false);
        }
      }
    });

  yLabels.selectAll("text")
    .on("click", function () {

      var value = d3.select(this).attr("value"); // Grab value 

      if (value !== chosenYAxis) {
        chosenYAxis = value;

        // Rescale data and move circles 
        yLinearScale = yScale(data, chosenYAxis);
        yAxis = renderYAxes(yLinearScale, yAxis);
        circlesGroup = renderYCircles(circlesGroup, yLinearScale, chosenYAxis);
        circleText = moveYLabels(circleText, yLinearScale, chosenYAxis);
        circlesGroup = updateToolTip(chosenXAxis, circlesGroup, chosenYAxis);

        // Updates labels to bold
        if (chosenYAxis === "healthcare") {
          healthcareLabel
            .classed("active", true)
            .classed("inactive", false);
          obesityLabel
            .classed("active", false)
            .classed("inactive", true);
          smokerLabel
            .classed("active", false)
            .classed("inactive", true);
        }

        if (chosenYAxis === 'obesity') {
          healthcareLabel
            .classed("active", false)
            .classed("inactive", true);
          obesityLabel
            .classed("active", true)
            .classed("inactive", false);
          smokerLabel
            .classed("active", false)
            .classed("inactive", true);
        }

        if (chosenYAxis === 'smokes') {
          healthcareLabel
            .classed("active", false)
            .classed("inactive", true);
          obesityLabel
            .classed("active", false)
            .classed("inactive", true);
          smokerLabel
            .classed("active", true)
            .classed("inactive", false);
        }
      }
    });
}).catch(function (error) {
  console.log(error);
});