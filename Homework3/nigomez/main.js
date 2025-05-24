/* Dimensions */
const width = window.innerWidth;
const height = window.innerHeight;

/* Scatter plot dimensions */
let scatterLeft = 0, scatterTop = 30;
let scatterMargin = {top: 40, right: 30, bottom: 50, left: 60},
    scatterWidth = 400 - scatterMargin.left - scatterMargin.right,
    scatterHeight = 350 - scatterMargin.top - scatterMargin.bottom;

/* Donut chart dimensions */
let donutLeft = 800, donutTop = 30;
let donutMargin = {top: 40, right: 30, bottom: 50, left: 60},
    donutWidth = 400 - donutMargin.left - donutMargin.right,
    donutHeight = 350 - donutMargin.top - donutMargin.bottom,
    donutRadius = Math.min(donutWidth, donutHeight) / 2;

/* Parallel coordinates plot dimensions */
let parallelLeft = 0, parallelTop = 450;
let parallelMargin = {top: 40, right: 30, bottom: 50, left: 60},
    parallelWidth = width - parallelMargin.left - parallelMargin.right,
    parallelHeight = height - 400 - parallelMargin.top - parallelMargin.bottom;

/* Process data */
d3.csv("mxmh_survey_results.csv").then(rawData => {
    console.log("rawData", rawData);

    /* Parse data and add default values */
    rawData.forEach(d => {
        d["Hours per day"] = d["Hours per day"] ? Number(d["Hours per day"]) : NaN;
        d.Anxiety = d.Anxiety ? Number(d.Anxiety) : NaN;
        d.Depression = d.Depression ? Number(d.Depression) : NaN;
        d.Insomnia = d.Insomnia ? Number(d.Insomnia) : NaN;
        d.OCD = d.OCD ? Number(d.OCD) : NaN;
        d.Age = d.Age ? Number(d.Age) : NaN;
        d["Primary streaming service"] = d["Primary streaming service"] || "Unknown";
        d["Music effects"] = d["Music effects"] || "Unknown";
        d["Fav genre"] = d["Fav genre"] || "Unknown";
    });

    /* Get scatter plot data */
    const scatterData = rawData.filter(d => !isNaN(d["Hours per day"]) && !isNaN(d.Anxiety));
    console.log("scatterData", scatterData);

    /* Get donut chart data */
    const streamServiceCounts = Array.from(
        d3.rollup(
            rawData,
            v => v.length,
            d => d["Primary streaming service"]
        ),
        ([service, count]) => ({ service, count })
    );
    console.log("streamServiceCounts", streamServiceCounts);

    /* Get parallel coordinates data */
    const parallelData = rawData.filter(d => 
        !isNaN(d.Anxiety) && 
        !isNaN(d.Depression) && 
        !isNaN(d.Insomnia) && 
        !isNaN(d.OCD) && 
        !isNaN(d["Hours per day"])
    ).map(d => ({
        Anxiety: d.Anxiety,
        Depression: d.Depression,
        Insomnia: d.Insomnia,
        OCD: d.OCD,
        "Hours per day": d["Hours per day"],
        "Music effects": d["Music effects"],
        "Fav genre": d["Fav genre"]
    }));
    console.log("parallelData", parallelData);

    const svg = d3.select("svg");

    /* Tooltip */
    const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

    /* Scatter Plot: Hours per day vs Anxiety */
    const g1 = svg.append("g")
        .attr("width", scatterWidth + scatterMargin.left + scatterMargin.right)
        .attr("height", scatterHeight + scatterMargin.top + scatterMargin.bottom)
        .attr("transform", `translate(${scatterMargin.left + scatterLeft}, ${scatterMargin.top + scatterTop})`);

    /* Title */
    g1.append("text")
        .attr("x", scatterWidth / 2)
        .attr("y", -20)
        .attr("font-size", "16px")
        .attr("text-anchor", "middle")
        .text("Music Listening vs. Anxiety");

    /* X label */
    g1.append("text")
        .attr("x", scatterWidth / 2)
        .attr("y", scatterHeight + 40)
        .attr("font-size", "14px")
        .attr("text-anchor", "middle")
        .text("Hours per Day (Music Listening)");

    /* Y label */
    g1.append("text")
        .attr("x", -(scatterHeight / 2))
        .attr("y", -40)
        .attr("font-size", "14px")
        .attr("text-anchor", "middle")
        .attr("transform", "rotate(-90)")
        .text("Anxiety Score");

    /* X scale */
    const x1 = d3.scaleLinear()
        .domain([0, d3.max(scatterData, d => d["Hours per day"])])
        .range([0, scatterWidth])
        .nice();

    /* Y scale */
    const y1 = d3.scaleLinear()
        .domain([0, 10])
        .range([scatterHeight, 0])
        .nice();

    /* Color scale */
    const scatterColorScale = d3.scaleOrdinal()
        .domain(["Improve", "No effect", "Worsen", "Unknown"])
        .range(["#4CAF50", "#FFC107", "#F44336", "#B0BEC5"]);

    /* Axes containers */
    const xAxisGroup = g1.append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0, ${scatterHeight})`)
        .call(d3.axisBottom(x1).ticks(5))
        .selectAll("text")
        .attr("y", "10")
        .attr("x", "-5")
        .attr("text-anchor", "end")
        .attr("transform", "rotate(-40)");

    const yAxisGroup = g1.append("g")
        .attr("class", "y-axis")
        .call(d3.axisLeft(y1).ticks(5));

    /* Circles */
    let isPulsing = true;
    const circleGroup = g1.append("g")
        .attr("class", "circles");

    const circles = circleGroup.selectAll("circle")
        .data(scatterData)
        .enter()
        .append("circle")
        .attr("cx", d => x1(d["Hours per day"]))
        .attr("cy", d => y1(d.Anxiety))
        .attr("r", 0)
        .attr("fill", d => scatterColorScale(d["Music effects"]))
        .attr("opacity", 0)
        .on("mouseover", (event, d) => {
            tooltip.transition().duration(200).style("opacity", 0.9);
            tooltip.html(`Genre: ${d["Fav genre"]}<br>Hours: ${d["Hours per day"]}<br>Anxiety: ${d.Anxiety}<br>Effect: ${d["Music effects"]}`)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", () => {
            tooltip.transition().duration(500).style("opacity", 0);
        })
        .transition()
        .duration(50)
        .delay((d, i) => i * 10)
        .attr("r", 5)
        .attr("opacity", 0.7);

    /* Pulsing animation based on Anxiety score */
    function pulseCircles() {
        if (!isPulsing) return;
        circles.each(function(d) {
            const circle = d3.select(this);
            const maxRadius = 6 + (d.Anxiety / 10) * 4;
            const duration = 2000 - (d.Anxiety / 10) * 1000; // more anxiety means faster pulse
            function pulse() {
                circle.transition()
                    .duration(duration)
                    .ease(d3.easeSinInOut)
                    .attr("r", maxRadius)
                    .transition()
                    .duration(duration)
                    .ease(d3.easeSinInOut)
                    .attr("r", 4)
                    .on("end", isPulsing ? pulse : null);
            }
            pulse();
        });
    }

    /* Start pulsing after page loads */
    setTimeout(() => pulseCircles(), scatterData.length * 10 + 50);

    /* Scatter plot zoom toggle and pulse toggle */
    let scatterZoomed = false;
    const scatterZoom = d3.zoom()
        .scaleExtent([0.5, 5])
        .translateExtent([[0, 0], [0, 0]])
        .on("zoom", (event) => {
            const transform = event.transform;
            circleGroup.attr("transform", `scale(${transform.k})`);
            xAxisGroup.call(d3.axisBottom(x1).scale(transform.rescaleX(x1)).ticks(5))
                .selectAll("text")
                .attr("y", "10")
                .attr("x", "-5")
                .attr("text-anchor", "end")
                .attr("transform", "rotate(-40)");
            yAxisGroup.call(d3.axisLeft(y1).scale(transform.rescaleY(y1)).ticks(5));
        });

    g1.call(scatterZoom);
    g1.on("click", (event) => {
        if (event.altKey) {
            isPulsing = !isPulsing;
            if (isPulsing) {
                pulseCircles();
            } else {
                circles.interrupt();
                circles.transition()
                    .duration(500)
                    .attr("r", 5)
                    .attr("opacity", 0.7);
            }
        } else {
            scatterZoomed = !scatterZoomed;
            const scale = scatterZoomed ? 2 : 1;
            g1.transition().duration(500).call(scatterZoom.scaleTo, scale);
        }
    });

    /* Legend for scatter plot */
    const legend = g1.append("g")
        .attr("class", "legend")
        .attr("transform", `translate(${scatterWidth + 10}, 10)`);
    const legendData = ["Improve", "No effect", "Worsen"];
    legend.selectAll("rect")
        .data(legendData)
        .enter()
        .append("rect")
        .attr("x", 0)
        .attr("y", (d, i) => i * 20)
        .attr("width", 10)
        .attr("height", 10)
        .attr("fill", d => scatterColorScale(d));
    legend.selectAll("text")
        .data(legendData)
        .enter()
        .append("text")
        .attr("x", 15)
        .attr("y", (d, i) => i * 20 + 9)
        .attr("font-size", "12px")
        .text(d => d);

    /* Donut Chart: Primary streaming service */
    const g2 = svg.append("g")
        .attr("width", donutWidth + donutMargin.left + donutMargin.right)
        .attr("height", donutHeight + donutMargin.top + donutMargin.bottom)
        .attr("transform", `translate(${donutLeft + donutMargin.left + donutRadius}, ${donutTop + donutMargin.top + donutRadius})`);

    /* Title */
    g2.append("text")
        .attr("y", -donutRadius - 20)
        .attr("text-anchor", "middle")
        .attr("font-size", "16px")
        .text("Streaming Service Distribution");

    /* Pie generator and Arc generator */
    const pie = d3.pie()
        .sort(null)
        .value(d => d.count);
    const arc = d3.arc()
        .innerRadius(donutRadius * 0.5)
        .outerRadius(donutRadius * 0.8);

    /* Color scale */
    const donutColor = d3.scaleOrdinal()
        .domain(streamServiceCounts.map(d => d.service))
        .range(d3.schemeCategory10);

    /* Arcs */
    const arcs = g2.append("g")
        .attr("class", "arcs");

    arcs.selectAll("path")
        .data(pie(streamServiceCounts))
        .enter()
        .append("path")
        .attr("d", arc)
        .attr("fill", d => donutColor(d.data.service))
        .attr("stroke", "white")
        .attr("stroke-width", 2)
        .attr("opacity", 0)
        .on("mouseover", (event, d) => {
            tooltip.transition().duration(200).style("opacity", 0.9);
            tooltip.html(`${d.data.service}: ${d.data.count}`)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", () => {
            tooltip.transition().duration(500).style("opacity", 0);
        })
        .transition()
        .duration(50)
        .delay((d, i) => i * 100)
        .attr("opacity", 1);

    /* Rotate the arc */    
    arcs.transition()
        .duration(2000)
        .ease(d3.easeLinear)
        .attrTween("transform", () => {
            return t => `rotate(${(t * 1080) % 360})`;
        })
        .on("end", function() {
            d3.select(this).attr("transform", "rotate(0)");
        });

    /* Legend */
    const donutLegend = g2.append("g")
        .attr("class", "legend")
        .attr("transform", `translate(${donutRadius + 20}, ${-donutRadius + 30})`);
    const donutLegendData = streamServiceCounts.map(d => d.service);
    donutLegend.selectAll("rect")
        .data(donutLegendData)
        .enter()
        .append("rect")
        .attr("x", 0)
        .attr("y", (d, i) => i * 20)
        .attr("width", 10)
        .attr("height", 10)
        .attr("fill", d => donutColor(d));
    donutLegend.selectAll("text")
        .data(donutLegendData)
        .enter()
        .append("text")
        .attr("x", 15)
        .attr("y", (d, i) => i * 20 + 9)
        .attr("font-size", "12px")
        .text(d => d);

    /* Donut chart zoom toggle */
    let donutZoomed = false;
    const donutZoom = d3.zoom()
        .scaleExtent([0.5, 5])
        .translateExtent([[0, 0], [0, 0]])
        .on("zoom", (event) => {
            const transform = event.transform;
            g2.select(".arcs").attr("transform", `scale(${transform.k})`);
            g2.select(".legend").attr("transform", `translate(${donutRadius + 20}, ${-donutRadius + 30})`);
        });

    g2.call(donutZoom);
    g2.on("click", () => {
        donutZoomed = !donutZoomed;
        const scale = donutZoomed ? 2 : 1;
        g2.transition()
            .duration(500)
            .call(donutZoom.scaleTo, scale)
            .on("end", () => {
                const currentScale = donutZoomed ? 2 : 1;
                arcs.transition() // rotate it again
                    .duration(2000)
                    .ease(d3.easeLinear)
                    .attrTween("transform", () => {
                        return t => `scale(${currentScale}) rotate(${(t * 1080) % 360})`;
                    })
                    .on("end", function() {
                        d3.select(this).attr("transform", `scale(${currentScale})`);
                    });
            });
    });

    /* Parallel Coordinates: Anxiety, Depression, Insomnia, OCD, Hours per day */
    const g3 = svg.append("g")
        .attr("width", parallelWidth + parallelMargin.left + parallelMargin.right)
        .attr("height", parallelHeight + parallelMargin.top + parallelMargin.bottom)
        .attr("transform", `translate(${parallelMargin.left}, ${parallelTop})`);

    /* Title */
    g3.append("text")
        .attr("x", parallelWidth / 2)
        .attr("y", -40)
        .attr("font-size", "16px")
        .attr("text-anchor", "middle")
        .text("Mental Health and Music Listening Patterns");

    /* Dimensions */
    const dimensions = ["Anxiety", "Depression", "Insomnia", "OCD", "Hours per day"];

    /* X scale */
    const x3 = d3.scalePoint()
        .domain(dimensions)
        .range([0, parallelWidth])
        .padding(0.1);

    /* Y scales */
    const y3 = {};
    dimensions.forEach(dim => {
        y3[dim] = d3.scaleLinear()
            .domain(dim === "Hours per day" ? 
                [0, d3.max(parallelData, d => d[dim])] : 
                [0, 10])
            .range([parallelHeight, 0])
            .nice();
    });

    /* Color scale */
    const parallelColorScale = d3.scaleSequential(d3.interpolateViridis)
        .domain([0, 10]);

    /* Limit data for parallel coordinates plot */
    const sampleSize = 200;
    const limitedParallelData = parallelData.slice(0, sampleSize);

    /* Line generator */
    const line = d3.line()
        .defined(d => !isNaN(d[1]))
        .x(d => x3(d[0]))
        .y(d => y3[d[0]](d[1]));

    /* Draw lines */
    const lines = g3.append("g")
        .attr("class", "lines")
        .selectAll("path")
        .data(limitedParallelData)
        .enter()
        .append("path")
        .attr("d", d => line(dimensions.map(dim => [dim, d[dim]])))
        .attr("stroke", d => parallelColorScale(d.Anxiety))
        .attr("stroke-width", 1)
        .attr("fill", "none")
        .attr("opacity", 0)
        .on("mouseover", (event, d) => {
            tooltip.transition().duration(200).style("opacity", 0.9);
            tooltip.html(
                `Genre: ${d["Fav genre"]}<br>` +
                `Anxiety: ${d.Anxiety}<br>` +
                `Depression: ${d.Depression}<br>` +
                `Insomnia: ${d.Insomnia}<br>` +
                `OCD: ${d.OCD}<br>` +
                `Hours: ${d["Hours per day"]}<br>` +
                `Effect: ${d["Music effects"]}`
            )
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 28) + "px");
            d3.select(event.currentTarget).attr("opacity", 1).attr("stroke-width", 2);
        })
        .on("mouseout", () => {
            tooltip.transition().duration(500).style("opacity", 0);
            d3.select(event.currentTarget).attr("opacity", 0.3).attr("stroke-width", 1);
        })
        .transition()
        .duration(50)
        .delay((d, i) => i * 10)
        .attr("opacity", 0.3);

    /* Draw axes */
    const axes = g3.append("g")
        .attr("class", "axes")
        .selectAll(".axis")
        .data(dimensions)
        .enter()
        .append("g")
        .attr("class", "axis")
        .attr("transform", d => `translate(${x3(d)}, 0)`);

    axes.append("g")
        .each(function(d) { d3.select(this).call(d3.axisLeft(y3[d]).ticks(5)); })
        .append("text")
        .attr("y", -10)
        .attr("font-size", "14px")
        .attr("text-anchor", "middle")
        .attr("fill", "#333")
        .text(d => d);

    /* Brushing */
    const brushes = {};
    dimensions.forEach(dim => {
        brushes[dim] = d3.brushY()
            .extent([[-10, 0], [10, parallelHeight]])
            .on("brush", brushed)
            .on("end", brushed);
        axes.filter(d => d === dim)
            .append("g")
            .attr("class", "brush")
            .call(brushes[dim]);
    });

    function brushed() {
        const actives = dimensions.filter(dim => d3.brushSelection(d3.select(`.brush[transform="translate(${x3(dim)}, 0)"]`).node()));
        const selections = {};
        actives.forEach(dim => {
            const sel = d3.brushSelection(d3.select(`.brush[transform="translate(${x3(dim)}, 0)"]`).node());
            selections[dim] = sel ? sel.map(y3[dim].invert) : null;
        });

        g3.selectAll("path")
            .style("display", d => {
                return actives.every(dim => {
                    if (!selections[dim]) return true;
                    const [min, max] = selections[dim].sort((a, b) => a - b);
                    return d[dim] >= min && d[dim] <= max;
                }) ? null : "none";
            });
    }

    /* Parallel coordinates zoom toggle */
    let parallelZoomed = false;
    const parallelZoom = d3.zoom()
        .scaleExtent([0.5, 5])
        .translateExtent([[0, 0], [parallelWidth + parallelMargin.left + parallelMargin.right, parallelHeight + parallelMargin.top + parallelMargin.bottom]])
        .on("zoom", (event) => {
            const transform = event.transform;
            const centerX = parallelWidth / 2;
            const centerY = parallelHeight / 2;
            g3.select(".lines").attr("transform", `translate(${centerX}, ${centerY}) scale(${transform.k}) translate(${-centerX}, ${-centerY})`);
            g3.select(".axes").selectAll(".axis").attr("transform", d => `translate(${x3(d)}, 0)`);
            g3.select(".axes").selectAll(".axis g").each(function(d) {
                d3.select(this).call(d3.axisLeft(y3[d]).scale(transform.rescaleY(y3[d])).tickValues(d === "Hours per day" ? null : [0, 2, 4, 6, 8, 10]));
            });
        });

    g3.call(parallelZoom);
    g3.on("click", () => {
        parallelZoomed = !parallelZoomed;
        const scale = parallelZoomed ? 2 : 1;
        g3.transition().duration(500).call(parallelZoom.scaleTo, scale);
    });

    /* Legend */
    const parallelLegend = g3.append("g")
        .attr("class", "legend")
        .attr("transform", `translate(${parallelWidth - 150}, -50)`);

    /* Gradient definition */
    const defs = g3.append("defs");
    const linearGradient = defs.append("linearGradient")
        .attr("id", "anxiety-gradient")
        .attr("x1", "0%")
        .attr("y1", "0%")
        .attr("x2", "100%")
        .attr("y2", "0%");

    [0, 2.5, 5, 7.5, 10].forEach((value, i) => {
        linearGradient.append("stop")
            .attr("offset", `${(i * 25)}%`)
            .attr("stop-color", parallelColorScale(value));
    });

    /* Gradient bar */
    parallelLegend.append("rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", 100)
        .attr("height", 10)
        .attr("fill", "url(#anxiety-gradient)");

    /* Legend title */
    parallelLegend.append("text")
        .attr("x", 50)
        .attr("y", -5)
        .attr("font-size", "12px")
        .attr("text-anchor", "middle")
        .text("Anxiety Score");

    /* Legend labels */
    parallelLegend.append("text")
        .attr("x", 0)
        .attr("y", 22)
        .attr("font-size", "12px")
        .attr("text-anchor", "start")
        .text("0");
    parallelLegend.append("text")
        .attr("x", 100)
        .attr("y", 22)
        .attr("font-size", "12px")
        .attr("text-anchor", "end")
        .text("10");

}).catch(error => {
    console.log("Error loading data:", error);
});



/* Used a LLM to help with the animations, I could not get them to work on my own */