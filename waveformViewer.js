function getRecordName() {
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const recordName = urlParams.get('record');
    return recordName;
};


function plotWaveform(waveformData) {
    // Select button
    let waveformName = Object.keys(waveformData);
    d3.select("#selectButton")
        .selectAll("myOptions")
            .data(waveformName)
        .enter()
            .append("option")
        .text(function(d) {return d;})
        .attr("value", function(d) {return d;});

    // Set geometry
    let margin = { top: 10, right: 30, bottom: 30, left: 60 },
        width = 800 - margin.left - margin.right,
        height = 300 - margin.top - margin.bottom;

    let svg = d3.select("#waveformGraph")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform",
            "translate(" + margin.left + "," + margin.top + ")");

    // Add x axis
    let waveformLength = waveformData[waveformName[0]].length
    let xScale = d3.scaleLinear()
        .domain([0, (waveformLength - 1) / 100])
        .range([0, width]);
    xAxis = svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(xScale));

    // Add y axis
    function absMax(waveformData) {
        return d3.max(waveformData.map(Math.abs));
    };

    let yLim = Math.ceil(absMax(waveformData[waveformName[0]]) * 1.2);
    let yScale = d3.scaleLinear()
        .domain([-yLim, yLim])
        .range([height, 0]);
    yAxis = svg.append("g")
        .call(d3.axisLeft(yScale));

    // Plot line
    function formatData(yData) {
        let xData = d3.ticks(0, (yData.length - 1) / 100, yData.length);
        let xyData = [];
        let i;
        for (i = 0; i < xData.length; i++) {
            xyData.push({ x: xData[i], y: yData[i] });
        }
        return xyData;
    };

    let lineGenerator = d3.line()
        .x(function (d) { return xScale(d.x); })
        .y(function (d) { return yScale(d.y); });

    let xyData = formatData(waveformData[waveformName[0]]);
    let line = svg.append("path")
        .datum(xyData)
        .attr("class", "line")
        .attr("d", lineGenerator);

    // Update Chart
    function update(selectedComp) {
        let xyData = formatData(waveformData[selectedComp]);
        
        line
            .datum(xyData)
            .transition()
            .duration(1000)
            .attr("class", "line")
            .attr("d", lineGenerator);
        
        let yLim = Math.ceil(absMax(waveformData[selectedComp]) * 1.2);
        let yScale = d3.scaleLinear()
            .domain([-yLim, yLim])
            .range([height, 0]);
        yAxis
            .transition()
            .duration(1000)
            .call(d3.axisLeft(yScale))
    }

    d3.select("#selectButton").on("change", function(d) {
        let selectedComp = d3.select(this).property("value");
        update(selectedComp);
    });
};




// read json
async function fetchJson() {
    const src = `/json/${getRecordName()}.json`
    const response = await fetch(src);
    return await response.json();
};

fetchJson().then(waveformData => { plotWaveform(waveformData) });
