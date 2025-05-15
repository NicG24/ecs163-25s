const width = window.innerWidth;
const height = window.innerHeight;

// Scatter plot 
let scatterLeft = 0, scatterTop = 0;
let scatterMargin = {top: 40, right: 30, bottom: 50, left: 60},
    scatterWidth = 400 - scatterMargin.left - scatterMargin.right,
    scatterHeight = 350 - scatterMargin.top - scatterMargin.bottom;

// Donut chart 
let donutLeft = 800, donutTop = 0;
let donutMargin = {top: 40, right: 30, bottom: 50, left: 30},
    donutWidth = 400 - donutMargin.left - donutMargin.right,
    donutHeight = 350 - donutMargin.top - donutMargin.bottom,
    donutRadius = Math.min(donutWidth, donutHeight) / 2;

// Parallel coordinates plot
let parallelLeft = 0, parallelTop = 400;
let parallelMargin = {top: 40, right: 30, bottom: 50, left: 60},
    parallelWidth = width - parallelMargin.left - parallelMargin.right,
    parallelHeight = height - 450 - parallelMargin.top - parallelMargin.bottom;

// Process data
d3.csv("mxmh_survey_results.csv").then(rawData => {
    console.log("rawData", rawData);

    // Parse data and add default values
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

    // Get scatter plot data
    const scatterData = rawData.filter(d => !isNaN(d["Hours per day"]) && !isNaN(d.Anxiety));
    console.log("scatterData", scatterData);

    // Get donut chart data
    const streamServiceCounts = d3.nest()
        .key(d => d["Primary streaming service"])
        .rollup(v => v.length)
        .entries(rawData)
        .map(d => ({ service: d.key, count: d.value }));
    console.log("streamServiceCounts", streamServiceCounts);

    // Get parallel coordinates data
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

   
    console.log("Scatter: left=", scatterLeft, "width=", scatterWidth + scatterMargin.left + scatterMargin.right);
    console.log("Donut: left=", donutLeft, "width=", donutWidth + donutMargin.left + donutMargin.right);

    
    const svg = d3.select("svg");

    // Scatter Plot: Hours per day vs Anxiety
    const g1 = svg.append("g")
        .attr("width", scatterWidth + scatterMargin.left + scatterMargin.right)
        .attr("height", scatterHeight + scatterMargin.top + scatterMargin.bottom)
        .attr("transform", `translate(${scatterMargin.left}, ${scatterMargin.top})`);

    // Title
    g1.append("text")
        .attr("x", scatterWidth / 2)
        .attr("y", -20)
        .attr("font-size", "16px")
        .attr("text-anchor", "middle")
        .text("Music Listening vs. Anxiety by Music Effects");

    // X 
    g1.append("text")
        .attr("x", scatterWidth / 2)
        .attr("y", scatterHeight + 40)
        .attr("font-size", "14px")
        .attr("text-anchor", "middle")
        .text("Hours per Day (Music Listening)");

    // Y 
    g1.append("text")
        .attr("x", -(scatterHeight / 2))
        .attr("y", -40)
        .attr("font-size", "14px")
        .attr("text-anchor", "middle")
        .attr("transform", "rotate(-90)")
        .text("Anxiety Score");

    // X scale 
    const x1 = d3.scaleLinear()
        .domain([0, d3.max(scatterData, d => d["Hours per day"])])
        .range([0, scatterWidth])
        .nice();

    const xAxisCall = d3.axisBottom(x1).ticks(5);
    g1.append("g")
        .attr("transform", `translate(0, ${scatterHeight})`)
        .call(xAxisCall)
        .selectAll("text")
        .attr("y", "10")
        .attr("x", "-5")
        .attr("text-anchor", "end")
        .attr("transform", "rotate(-40)");

    // Y scale 
    const y1 = d3.scaleLinear()
        .domain([0, 10]) // Anxiety score range is 0-10
        .range([scatterHeight, 0])
        .nice();

    const yAxisCall = d3.axisLeft(y1).ticks(5);
    g1.append("g").call(yAxisCall);

    // Color scale 
    const scatterColorScale = d3.scaleOrdinal()
        .domain(["Improve", "No effect", "Worsen", "Unknown"])
        .range(["#4CAF50", "#FFC107", "#F44336", "#B0BEC5"]);

    // Tooltip
    const tooltip = d3.select("body").append("div")
        .style("position", "absolute")
        .style("background", "#f4f4f4")
        .style("padding", "5px")
        .attr("font-size", "12px")
        .style("border", "1px solid #ccc")
        .style("border-radius", "3px")
        .style("pointer-events", "none")
        .style("opacity", 0);

    // Circles
    g1.selectAll("circle")
        .data(scatterData)
        .enter()
        .append("circle")
        .attr("cx", d => x1(d["Hours per day"]))
        .attr("cy", d => y1(d.Anxiety))
        .attr("r", 5)
        .attr("fill", d => scatterColorScale(d["Music effects"]))
        .attr("opacity", 0.7)
        .on("mouseover", (event, d) => {
            tooltip.transition().duration(200).style("opacity", 0.9);
            tooltip.html(`Genre: ${d["Fav genre"]}<br>Hours: ${d["Hours per day"]}<br>Anxiety: ${d.Anxiety}<br>Effect: ${d["Music effects"]}`)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", () => {
            tooltip.transition().duration(500).style("opacity", 0);
        });

    // Legend for scatter plot
    const legend = g1.append("g")
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

    // Donut Chart: Primary streaming service
    const g2 = svg.append("g")
        .attr("width", donutWidth + donutMargin.left + donutMargin.right)
        .attr("height", donutHeight + donutMargin.top + donutMargin.bottom)
        .attr("transform", `translate(${donutLeft + donutMargin.left + donutRadius}, ${donutTop + donutMargin.top + donutRadius})`);

    // Title
    g2.append("text")
        .attr("y", -donutRadius - 20)
        .attr("text-anchor", "middle")
        .attr("font-size", "16px")
        .text("Streaming Service Distribution");

    // Pie generator
    const pie = d3.pie()
        .sort(null)
        .value(d => d.count);

    // Arc generator
    const arc = d3.arc()
        .innerRadius(donutRadius * 0.5) // Donut hole
        .outerRadius(donutRadius * 0.8);

    // Label generator
    const outerArc = d3.arc()
        .innerRadius(donutRadius * 0.9)
        .outerRadius(donutRadius * 0.9);

    // Color scale 
    const donutColor = d3.scaleOrdinal()
        .domain(streamServiceCounts.map(d => d.service))
        .range(d3.schemeCategory10);

    // Arcs
    g2.selectAll("path")
        .data(pie(streamServiceCounts))
        .enter()
        .append("path")
        .attr("d", arc)
        .attr("fill", d => donutColor(d.data.service))
        .attr("stroke", "white")
        .attr("stroke-width", 2)
        .on("mouseover", (event, d) => {
            tooltip.transition().duration(200).style("opacity", 0.9);
            tooltip.html(`${d.data.service}: ${d.data.count}`)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", () => {
            tooltip.transition().duration(500).style("opacity", 0);
        });


    // Legend 
    const donutLegend = g2.append("g")
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

    // Parallel Coordinates: Anxiety, Depression, Insomnia, OCD, Hours per day
    const g3 = svg.append("g")
        .attr("width", parallelWidth + parallelMargin.left + parallelMargin.right)
        .attr("height", parallelHeight + parallelMargin.top + parallelMargin.bottom)
        .attr("transform", `translate(${parallelMargin.left}, ${parallelTop})`);

    // Title
    g3.append("text")
        .attr("x", parallelWidth / 2)
        .attr("y", -40)
        .attr("font-size", "16px")
        .attr("text-anchor", "middle")
        .text("Mental Health and Music Listening Patterns");

    // Dimensions 
    const dimensions = ["Anxiety", "Depression", "Insomnia", "OCD", "Hours per day"];

    // X scale 
    const x3 = d3.scalePoint()
        .domain(dimensions)
        .range([0, parallelWidth])
        .padding(0.1);

    // Y scales
    const y3 = {};
    dimensions.forEach(dim => {
        y3[dim] = d3.scaleLinear()
            .domain(dim === "Hours per day" ? 
                [0, d3.max(parallelData, d => d[dim])] : 
                [0, 10]) // Mental health scores: 0-10
            .range([parallelHeight, 0])
            .nice();
    });

    // Color scale 
    const parallelColorScale = d3.scaleSequential(d3.interpolateViridis)
        .domain([0, 10]); // Anxiety range: 0-10

    // Limit data for parallel coordinates plot
    const sampleSize = 200;
    const limitedParallelData = d3.shuffle(parallelData).slice(0, sampleSize);

    // Line generator
    const line = d3.line()
        .defined(d => !isNaN(d[1]))
        .x(d => x3(d[0]))
        .y(d => y3[d[0]](d[1]));

    // Draw lines
    g3.selectAll("path")
        .data(limitedParallelData)
        .enter()
        .append("path")
        .attr("d", d => line(dimensions.map(dim => [dim, d[dim]])))
        .attr("stroke", d => parallelColorScale(d.Anxiety))
        .attr("stroke-width", 1)
        .attr("fill", "none")
        .attr("opacity", 0.3)
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
        .on("mouseout", (event) => {
            tooltip.transition().duration(500).style("opacity", 0);
            d3.select(event.currentTarget).attr("opacity", 0.3).attr("stroke-width", 1);
        });

    // Draw axes
    const axes = g3.selectAll(".axis")
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

    // Brushing
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

    // Legend 
    const parallelLegend = g3.append("g")
        .attr("transform", `translate(${parallelWidth - 150}, -50)`);

    // Gradient definition
    const defs = g3.append("defs");
    const linearGradient = defs.append("linearGradient")
        .attr("id", "anxiety-gradient")
        .attr("x1", "0%")
        .attr("y1", "0%")
        .attr("x2", "100%")
        .attr("y2", "0%");
    linearGradient.append("stop")
        .attr("offset", "0%")
        .attr("stop-color", parallelColorScale(0));
    linearGradient.append("stop")
        .attr("offset", "100%")
        .attr("stop-color", parallelColorScale(10));

    // Gradient bar
    parallelLegend.append("rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", 100)
        .attr("height", 10)
        .attr("fill", "url(#anxiety-gradient)");

    // Legend title
    parallelLegend.append("text")
        .attr("x", 50)
        .attr("y", -5)
        .attr("font-size", "12px")
        .attr("text-anchor", "middle")
        .text("Anxiety Score");

    // Legend labels
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