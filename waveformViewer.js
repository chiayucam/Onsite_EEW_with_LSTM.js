function getRecordName() {
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const recordName = urlParams.get("record");
    return recordName;
};

async function fetchJson(recordName) {
    const src = `json/${recordName}.json`
    const response = await fetch(src);
    return await response.json();
};

// test load tf model
async function testLoadModel() {
    const model = await tf.loadLayersModel("L5U2B512Onadam/model.json");
    d3.select("#tfStatus").text(`Tensorflow.js loaded --version: ${tf.version.tfjs}`)
    d3.select("#tfBackend").text(`Using ${tf.getBackend()} backend`)
    return model;
};

function addLegend(lineClass, labelText) {
    const span = d3.select("#legends")
    const color = d3.select(lineClass).style("stroke")
    span.append("div")
            .style("text-align", "center")
            .style("height", "15px")
            .style("width", "15px")
            .style("border-radius", "50%")
            .style("background-color", color)
    span.append("p")
            .text(labelText)
            .attr("class", "commanText")
            .style("margin-left", "10px")
            .style("margin-right", "20px")
}

function getFirstExceededTime(arr2D, conditionFunc) {
    const maxIndex = arr2D[0].length + 1;
    let tempExceededIndex;
    let minExceededIndex = maxIndex;
    for (let i = 0; i < arr2D.length; i++) {
        tempExceededIndex = arr2D[i].findIndex(conditionFunc)
        if (tempExceededIndex !== -1 && tempExceededIndex < minExceededIndex) {
            minExceededIndex = tempExceededIndex
        }
    };

    if (minExceededIndex === maxIndex) {
        return -1
    } else {
        return minExceededIndex / 100
    };
};

function plotWaveform(waveformData) {
    // Select button
    const waveformNames = Object.keys(waveformData);
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
    const waveformLength = waveformData[waveformNames[0]].length
    let xScale = d3.scaleLinear()
        .domain([0, (waveformLength - 1) / 100])
        .range([0, width]);
    xAxis = svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(xScale));

    xTitle = svg.append("text")
        .attr("text-anchor", "end")
        .attr("x", (width + margin.right) / 2)
        .attr("y", height + margin.top + 5)
        .attr("font-size", "14px")
        .text("Time (sec)");

    // Add y axis
    function absMax(waveformValue) {
        return d3.max(waveformValue.map(Math.abs));
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
        .attr("x", -height / 2 - margin.top + margin.bottom)
        .attr("y", -margin.left + 25)
        .attr("font-size", "14px")
        .text("Acceleration (cm/s^2)");

    // Plot line
    function formatData(yData) {
        let xData = d3.ticks(0, (yData.length - 1) / 100, yData.length);
        let xyData = [];
        for (let i = 0; i < xData.length; i++) {
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
        .attr("class", "waveformLine")
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
            .attr("d", lineGenerator);

    }

    d3.select("#selectButton").on("change", function (d) {
        let selectedComp = d3.select(this).property("value");
        update(selectedComp);
    });
};

function plotPredictBackground(waveformData) {
    const waveformValuesAcc = Object.values(waveformData).slice(0, 3);

    // Set geometry
    let margin = { top: 30, right: 60, bottom: 40, left: 60 },
        width = 700 - margin.left - margin.right,
        height = 400 - margin.top - margin.bottom;

    let svg = d3.select("#predictGraph")
        .append("svg")
        .attr("preserveAspectRatio", "xMinYMin meet")
        .attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
        .append("g")
        .attr("transform",
            "translate(" + margin.left + "," + margin.top + ")");

    // Add x axis
    let waveformLength = waveformValuesAcc[0].length
    let xScale = d3.scaleLinear()
        .domain([0, (waveformLength - 1) / 100])
        .range([0, width]);
    xAxis = svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(xScale));

    xTitle = svg.append("text")
        .attr("text-anchor", "end")
        .attr("x", (width + margin.right) / 2)
        .attr("y", height + margin.top + 5)
        .attr("font-size", "14px")
        .text("Time (sec)");

    // Add y axis
    function absMax(waveformValue) {
        return d3.max(waveformValue.map(Math.abs));
    };

    let yLims = [];
    for (let i = 0; i < waveformValuesAcc.length; i++) {
        yLims.push(Math.ceil(absMax(waveformValuesAcc[i]) * 1.1));
    }

    const yLimsMax = d3.max(yLims)
    let yScale = d3.scaleLinear()
        .domain([-4 * 2 * yLimsMax, 0])
        .range([height, 0]);

    // Plot line
    function formatData(yData) {
        let xData = d3.ticks(0, (yData.length - 1) / 100, yData.length);
        let xyData = [];
        for (let i = 0; i < xData.length; i++) {
            xyData.push({ x: xData[i], y: yData[i] });
        }
        return xyData;
    };

    let lineGenerator = d3.line()
        .x(function (d) { return xScale(d.x); })
        .y(function (d) { return yScale(d.y); });

    for (let i = 0; i < waveformValuesAcc.length; i++) {
        const xyData = formatData(waveformValuesAcc[i].map(function (value) {
            // return value - offsetValue
            return value - yLimsMax * (2 * (i + 1) + 1)
        }));
        svg.append("path")
            .datum(xyData)
            .attr("class", "waveformBackgroundLine")
            .attr("d", lineGenerator);
    }

    // add waveform background legend
    addLegend(".waveformBackgroundLine", "Z, N, E Waveforms");

    // plot rect box for prediction line
    svg.append("rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("height", yScale(-2 * yLimsMax))
        .attr("width", xScale(60))
        .style("stroke", "black")
        .style("stroke-width", 0.5)
        .style("fill", "none")

    // plot first occurrence of Acc > 80 Gal line
    const firstExceededTime = getFirstExceededTime(waveformValuesAcc, (n => Math.abs(n) > 80))
    if (firstExceededTime !== -1) {
        svg.append("path")
            .datum([{ x: firstExceededTime, y: -4 * 2 * yLimsMax }, { x: firstExceededTime, y: 0 }])
            .attr("class", "waveformExceedLine")
            .attr("d", lineGenerator);

        addLegend(".waveformExceedLine", "Acc > 80 Gal Time");
    }
};



function plotPredict(predict) {
    let rect = d3.select("#predictGraph").select("rect");
    let width = rect.attr("width");
    let height = rect.attr("height");

    let xScale = d3.scaleLinear()
        .domain([0, (predict.length - 1) / 100])
        .range([0, width]);

    let yScale = d3.scaleLinear()
        .domain([0, 1])
        .range([height, 0]);

    let svg = d3.select("#predictGraph").select("svg").select("g")

    // plot first occurrence of Prob > 0.5 line
    let margin = { top: 30, right: 60, bottom: 40, left: 60 }
    width = 700 - margin.left - margin.right;
    height = 400 - margin.top - margin.bottom;

    const firstExceededTime = getFirstExceededTime([predict], (n => n > 0.5))
    if (firstExceededTime !== -1) {
        svg.append("path")
            .datum([{ x: firstExceededTime, y: height }, { x: firstExceededTime, y: 0 }])
            .attr("class", "predictExceedLine")
            .attr("d", d3.line()
                .x(function (d) { return xScale(d.x) })
                .y(function (d) { return d.y }));

        addLegend(".predictExceedLine", "Probability > 0.5 Time")
    };

    // Plot line
    width = rect.attr("width");
    height = rect.attr("height");

    function formatData(yData) {
        let xData = d3.ticks(0, (yData.length - 1) / 100, yData.length);
        let xyData = [];
        for (let i = 0; i < xData.length; i++) {
            xyData.push({ x: xData[i], y: yData[i] });
        }
        return xyData;
    };

    let lineGenerator = d3.line()
        .x(function (d) { return xScale(d.x); })
        .y(function (d) { return yScale(d.y); });

    const xyData = formatData(predict);
    svg.append("path")
        .datum(xyData)
        .attr("class", "predictLine")
        .attr("d", lineGenerator);

    addLegend(".predictLine", "Prediction Probability")

    let focus = svg.append("circle")
        .style("fill", "none")
        .attr("stroke", "black")
        .attr("r", 2)
        .style("opacity", 0)

    let focusTextBackground = svg.append("rect")
        .attr("rx", "5")
        .attr("ry", "5")
        .style("fill", "white")
        .style("opacity", 0)

    let focusText = svg.append("text")
        .style("opacity", 0)
        .attr("text-anchor", "left")
        .attr("alignment-baseline", "middle")

    let focusTextTime = focusText.append("tspan")
        .attr("dx", ".5em")

    let focusTextProb = focusText.append("tspan")
        .attr("dx", ".5em")
        .attr("dy", "1.2em")

    svg.append("rect")
        .style("fill", "none")
        .style("pointer-events", "all")
        .attr("id", "mouseRect")
        .attr("width", width)
        .attr("height", height)
        .on("mouseover", mouseover)
        .on("mousemove", event => { mousemove(event) })
        .on("mouseout", mouseout);

    let bisect = d3.bisector(function (d) { return d.x; }).left;

    function mouseover() {
        focus.style("opacity", 1)
        focusText.style("opacity", 1)
        focusTextBackground.style("opacity", 0.7)
    }

    function mousemove(event) {
        const x0 = xScale.invert(d3.pointer(event, svg.node())[0]);
        const i = bisect(xyData, x0);
        const selectedData = xyData[i]
        const x = xScale(selectedData.x)
        const y = yScale(selectedData.y)
        focus
            .attr("cx", x)
            .attr("cy", y)
        focusText
            .attr("x", x)
            .attr("y", y)
        focusTextTime
            .attr("x", x)
            .text(`Time: ${selectedData.x} `)
        focusTextProb
            .attr("x", x)
            .text(`Prob: ${Number(Math.round(selectedData.y + "e3") + "e-3")}`)
        
        const bbox = focusText.node().getBBox()
        focusTextBackground
            .attr("x", bbox.x)
            .attr("y", bbox.y)
            .attr("width", bbox.width)
            .attr("height", bbox.height)
    }

    function mouseout() {
        focus.style("opacity", 0)
        focusText.style("opacity", 0)
        focusTextBackground.style("opacity", 0)
    }

    
};

async function main() {
    // set label tag
    const recordName = getRecordName();
    eventName = recordName.substring(0, 14);
    stationName = recordName.substring(14);
    d3.select("#selectButtonLabel2").text(`component at station ${stationName} from earthquake event ${eventName}`);

    // get waveform data from json file and plot graph
    const waveformData = await fetchJson(recordName);
    plotWaveform(waveformData);
    plotPredictBackground(waveformData);

    // test load model then call webworker to format input data and predict
    d3.select("#runTfButton").on("click", async function () {
        await testLoadModel();
        const tfWorker = new Worker("tfWorker.js")
        tfWorker.postMessage(waveformData)
        console.log("Main: Message posted to worker");
        tfWorker.onmessage = function (e) {
            const predict = e.data
            console.log("Main: Message received from worker")
            plotPredict(predict)
            tfWorker.terminate()
        }
    })
}





main()