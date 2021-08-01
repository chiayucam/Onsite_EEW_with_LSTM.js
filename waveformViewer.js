function getRecordName() {
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const recordName = urlParams.get('record');
    return recordName;
};


function plotWaveform(waveformData) {
    // Select button
    let waveformNames = Object.keys(waveformData);
    d3.select("#selectButton")
        .selectAll("myOptions")
        .data(waveformNames)
        .enter()
        .append("option")
        .text(function (d) { return d; })
        .attr("value", function (d) { return d; });

    // Set geometry
    let margin = { top: 30, right: 60, bottom: 40, left: 60 },
        width = 700 - margin.left - margin.right,
        height = 300 - margin.top - margin.bottom;

    let svg = d3.select("#waveformGraph")
        .append("svg")
        .attr("preserveAspectRatio", "xMinYMin meet")
        .attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
        .append("g")
        .attr("transform",
            "translate(" + margin.left + "," + margin.top + ")");

    // Add x axis
    let waveformLength = waveformData[waveformNames[0]].length
    let xScale = d3.scaleLinear()
        .domain([0, (waveformLength - 1) / 100])
        .range([0, width]);
    xAxis = svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(xScale));

    xTitle = svg.append("text")
        .attr("text-anchor", "end")
        .attr("x", width / 2 + margin.right)
        .attr("y", height + margin.top + 5)
        .attr("font-size", "14px")
        .text("Time (sec)");

    // Add y axis
    function absMax(waveformData) {
        return d3.max(waveformData.map(Math.abs));
    };

    let yLim = Math.ceil(absMax(waveformData[waveformNames[0]]) * 1.1);
    let yScale = d3.scaleLinear()
        .domain([-yLim, yLim])
        .range([height, 0]);
    yAxis = svg.append("g")
        .call(d3.axisLeft(yScale));

    yTitle = svg.append("text")
        .attr("text-anchor", "middle")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2 - margin.top +margin.bottom)
        .attr("y", -margin.left + 25)
        .attr("font-size", "14px")
        .text("Acceleration (cm/s^2)");

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

    let xyData = formatData(waveformData[waveformNames[0]]);
    let line = svg.append("path")
        .datum(xyData)
        .attr("class", "line")
        .attr("d", lineGenerator);

    // Update Chart
    function update(selectedComp) {
        let yLim = Math.ceil(absMax(waveformData[selectedComp]) * 1.1);
        let yScale = d3.scaleLinear()
            .domain([-yLim, yLim])
            .range([height, 0]);
        yAxis
            .transition()
            .duration(500)
            .call(d3.axisLeft(yScale))

        let yTitleText;
        const waveformNamesAcc = waveformNames.slice(0, 3);
        if (waveformNamesAcc.includes(selectedComp)) {
            yTitleText = "Acceleration (cm/s^2)"
        } else {
            yTitleText = "Velocity (cm/s)"
        }
        
        yTitle
            .text(yTitleText)

        let lineGenerator = d3.line()
            .x(function (d) { return xScale(d.x); })
            .y(function (d) { return yScale(d.y); });
        let xyData = formatData(waveformData[selectedComp]);
        line
            .datum(xyData)
            .transition()
            .duration(500)
            .attr("class", "line")
            .attr("d", lineGenerator);

    }

    d3.select("#selectButton").on("change", function (d) {
        let selectedComp = d3.select(this).property("value");
        update(selectedComp);
    });
};




// read json
async function fetchJson() {
    const src = `json/${getRecordName()}.json`
    const response = await fetch(src);
    return await response.json();
};

// set label
let recordName = getRecordName(),
    eventName = recordName.substring(0, 14)
stationName = recordName.substring(14)

d3.select("#selectButtonLabel2").text(`component at station ${stationName} from earthquake event ${eventName}`)

fetchJson().then(waveformData => { plotWaveform(waveformData) });


// load tf model
const model = tf.loadLayersModel('L5U2B512Onadam/model.json');
d3.select("#tfStatus").text(`Tensorflow.js loaded --version: ${tf.version.tfjs}`)