var graphmap, svg;

var mapdata = {
    allnodes: [],
    paths: [],
    distances: [],
    getui: {
        htmlSelectStartingNode: "#from-starting",
        htmlSelectEndNode: "#to-end"
    },
    getstate: {
        selectedNode: null,
        fromNode: null,
        toNode: null
    }
};

$('#exampleModal').on('show.bs.modal', function (event) {
    var button = $(event.relatedTarget);
    var recipient = button.data('whatever');
    var modal = $(this);
    modal.find('.modal-title').text('New message to ' + recipient);
    modal.find('.modal-body input').val("");

});







$(function () {

    graphmap = d3.select('#svg-map');

    svg = graphmap.append("svg:svg")
        .attr("id", "svg")
        .attr("class", "svgmap")
        .attr("width", 1110)
        .attr("height", 800)
        .on("click", addNode)
        .on("contextmenu", function () { d3.event.preventDefault(); });




});

var dragManager = d3.behavior.drag()
    .on('dragstart', dragNodeStart())
    .on('drag', dragNode())
    .on('dragend', dragNodeEnd());



$("#data-export").click(function (e) {

    e.stopPropagation();

    var exportData = JSON.stringify({
        nodes: mapdata.allnodes,
        paths: mapdata.paths
    });

    var target = $(this);

    var link = $("<a></a>")
        .addClass("exportLink")
        .click(function (e) { e.stopPropagation(); })
        .attr('target', '_self')
        .attr("download", "nodesandpaths.json")
        .attr("href", "data:application/json," + exportData);

    link.appendTo(target).get(0).click();

    $(".exportLink").remove();

});







$("#data-import").change(function (e) {
    e.stopPropagation();
    var files = e.target.files;
    var file = files[0];
    if (file === undefined) return;
    var reader = new FileReader();
    reader.onload = function () {
        try {
            var importedData = JSON.parse(this.result);
        }
        catch (exception) {
            console.log("** Error importing JSON: %s", exception);
            return;
        }
        if (importedData.nodes === undefined
            || importedData.paths === undefined
            || Object.keys(importedData).length !== 2) {
            console.log("** JSON format error:");
            console.log(importedData);
            return;
        }


        mapdata.allnodes = importedData.nodes;
        mapdata.paths = importedData.paths;
        mapdata.distances = [];
        mapdata.getstate.selectedNode = null;
        mapdata.getstate.fromNode = null;
        mapdata.getstate.toNode = null;

        mapdata.allnodes.forEach(function (node) {
            addNodeToSelect(node.name);
        });

        calculateDistancesbetweennodes();
        redrawLines();
        redrawNodes();
    };
    reader.readAsText(file);
});

$('#getshortestroute').on('click', function () {
    redrawLines();
    console.log("clicking D");
    const dtimeElement = document.querySelector("#timeone.time");
    d3.selectAll("line").classed({ "shortest": false });
    calculateDistancesbetweennodes();
    if (!$(mapdata.getui.htmlSelectStartingNode).val() || !$(mapdata.getui.htmlSelectEndNode).val()) return;
    var sourceNode = $(mapdata.getui.htmlSelectStartingNode).val();
    var targetNode = $(mapdata.getui.htmlSelectEndNode).val();
    console.log(sourceNode, targetNode, "sourcetarget");

    let starttime = performance.now();
    var results = dijkstra(sourceNode, targetNode);
    let timetaken = performance.now() - starttime;
    console.log("Djikstra time:", timetaken);
    timetaken = timetaken.toFixed(3);
    dtimeElement.textContent = timetaken + "ms";

    if (results.path) {
        results.path.forEach(function (step) {

            var dist = mapdata.distances[step.source][step.target];
            stepLine = d3.select(
                "line.from" + step.source + "to" + step.target + ","
                + "line.from" + step.target + "to" + step.source
            );
            stepLine.classed({ "shortest": true });

        });
    }

});


$('#getAstar').on('click', function () {
    redrawLines();
    const atimeElement = document.querySelector("#timetwo.time");
    d3.selectAll("line").classed({ "shortesttwo": false });
    calculateDistancesbetweennodes();
    if (!$(mapdata.getui.htmlSelectStartingNode).val() || !$(mapdata.getui.htmlSelectEndNode).val()) return;
    var sourceNode = $(mapdata.getui.htmlSelectStartingNode).val();
    var targetNode = $(mapdata.getui.htmlSelectEndNode).val();
    let starttime = performance.now();
    var results = aStar(sourceNode, targetNode);
    let timetaken = performance.now() - starttime;
    console.log("A* time:", timetaken);
    timetaken = timetaken.toFixed(3);
    atimeElement.textContent = timetaken + "ms";
    if (results.path) {

        console.log(results.path);
        results.path.forEach(function (step) {

            var dist = mapdata.distances[step.source][step.target];
            stepLine = d3.select(
                "line.from" + step.source + "to" + step.target + ","
                + "line.from" + step.target + "to" + step.source
            );




            stepLine.classed({ "shortesttwo": true });

        });
    }
});






$('#clearmap').on('click', function () {
    clearGraph();

});


$('#getmindis').on('click', function () {
    redrawLines();
    d3.selectAll("line").classed({ "shortestthree": false });
    calculateDistancesbetweennodes();
    const minelement = document.querySelector("#cardtime.card-body");
    var mindis = 999999;
    var temp = 0;
    var sourceNode, targetNode;

    for (var i = 0; i < mapdata.allnodes.length; i++) {
        for (var j = 0; j < mapdata.allnodes.length; j++) {
            if (mapdata.distances[i][j] === 'x' && mapdata.allnodes[i].x != mapdata.allnodes[j].x && mapdata.allnodes[i].y != mapdata.allnodes[j].y) {
                temp = mindistance(mapdata.allnodes[i].x, mapdata.allnodes[i].y, mapdata.allnodes[j].x, mapdata.allnodes[j].y);
                if (temp < mindis) {
                    mindis = temp;
                    sourceNode = i;
                    targetNode = j;
                    console.log(sourceNode, targetNode, "sourcetarget");
                }
            }
        }
    }
    calculateDistancesbetweennodes();
    var results = dijkstra(sourceNode, targetNode);
    if (results.path) {
        results.path.forEach(function (step) {

            var dist = mapdata.distances[step.source][step.target];
            stepLine = d3.select(
                "line.from" + step.source + "to" + step.target + ","
                + "line.from" + step.target + "to" + step.source
            );
            stepLine.classed({ "shortestthree": true });

        });
    }

    minelement.textContent = "Node " + sourceNode + " to Node " + targetNode;
});




function addNode() {
    if (d3.event.defaultPrevented) return;
    var position = d3.mouse(this);
    var nodeName = mapdata.allnodes.length;
    mapdata.allnodes.push({
        name: nodeName, x: parseInt(position[0]), y: parseInt(position[1])
    });
    redrawNodes();
    addNodeToSelect(nodeName);

};



function addNodeToSelect(nodeName) {
    $(mapdata.getui.htmlSelectStartingNode).append($("<option></option>").attr("value", nodeName).text(nodeName));
    $(mapdata.getui.htmlSelectEndNode).append($("<option></option>").attr("value", nodeName).text(nodeName));
};

function clearGraph() {
    dtimeElement = document.querySelector("#timeone.time");
    atimeElement = document.querySelector("#timetwo.time");
    minE = document.querySelector("#cardtime.card-body");
    dtimeElement.textContent = "00:00:00";
    atimeElement.textContent = "0:00:00";
    minE.textContent = null;
    mapdata.allnodes = [];
    mapdata.paths = [];
    $(mapdata.getui.htmlSelectStartingNode).empty();
    $(mapdata.getui.htmlSelectEndNode).empty();
    $("#results").empty();
    $('#svg-map').css({
        'background-image': 'url(' + null + ')'

    });
    redrawNodes();
    redrawLines();

};





function redrawNodes() {

    svg.selectAll("g.nodes").data([]).exit().remove();

    var elements = svg.selectAll("g.nodes").data(mapdata.allnodes, function (d, i) { return d.name; });

    var nodesEnter = elements.enter().append("g")
        .attr("class", "nodes");

    elements.attr("transform", function (d, i) {
        return "translate(" + d.x + "," + d.y + ")";
    });

    nodesEnter.append("circle")
        .attr("nodeId", function (d, i) { return i; })
        .attr("r", '15')
        .attr("class", "node")
        .style("cursor", "pointer")
        .on('click', nodeClick)
        .on('contextmenu', function (d, i) { startEndPath(i); })
        .call(dragManager);


    nodesEnter
        .append("text")
        .attr("nodeLabelId", function (d, i) { return i; })
        .attr("dx", "-5")
        .attr("dy", "5")
        .attr("class", "label")
        .on('contextmenu', function (d, i) { startEndPath(i); })
        .call(dragManager)
        .text(function (d, i) { return d.name; });

    elements.exit().remove();


};

function redrawLines() {

    svg.selectAll("g.line").data([]).exit().remove();

    var elements = svg
        .selectAll("g.line")
        .data(mapdata.paths, function (d) { return d.id; });

    var newElements = elements.enter();


    var group = newElements
        .append("g")
        .attr("class", "line");

    var line = group.append("line")
        .attr("class", function (d) { return "from" + mapdata.allnodes[d.from].name + "to" + mapdata.allnodes[d.to].name; })
        .attr("x1", function (d) { return mapdata.allnodes[d.from].x; })
        .attr("y1", function (d) { return mapdata.allnodes[d.from].y; })
        .attr("x2", function (d) { return mapdata.allnodes[d.to].x; })
        .attr("y2", function (d) { return mapdata.allnodes[d.to].y; });


    var text = group.append("text")
        .attr("x", function (d) { return parseInt((mapdata.allnodes[d.from].x + mapdata.allnodes[d.to].x) / 2) + 5; })
        .attr("y", function (d) { return parseInt((mapdata.allnodes[d.from].y + mapdata.allnodes[d.to].y) / 2) - 5; })
        .attr("class", "line-label");


    elements.selectAll("text")
        .text(function (d) { return mapdata.distances[d.from][d.to]; });


    elements.exit().remove();


};

function nodeClick(d, i) {
    console.log("node:click %s", i);
    console.log(d);

    d3.event.preventDefault();
    d3.event.stopPropagation();
};

function dragNodeStart() {
    return function (d, i) {
        console.log("dragging node " + i);

    };
};

function dragNode() {
    return function (d, i) {
        var node = d3.select(this);
        var position = d3.mouse(document.getElementById('svg'));
        var nodeDatum = {
            name: d.name,
            x: parseInt(position[0]),
            y: parseInt(position[1])
        };

        mapdata.allnodes[i] = nodeDatum;
        calculateDistancesbetweennodes();
        redrawLines();
        redrawNodes();
    };
};

function dragNodeEnd() {
    return function (d, i) {

        console.log("node " + i + " repositioned");
    };
};

function killEvent() {
    if (d3.event.preventDefault) {
        d3.event.preventDefault();
        d3.event.stopPropagation();
    }
};

function startEndPath(index) {
    d3.event.stopPropagation();
    d3.event.preventDefault();
    if (mapdata.getstate.fromNode === null) {

        mapdata.getstate.fromNode = index;
    }
    else {
        if (mapdata.getstate.fromNode === index) {

            return;
        }

        mapdata.getstate.toNode = index;
        var pathDatum = {
            id: mapdata.paths.length,
            from: mapdata.getstate.fromNode,
            to: index
        };
        mapdata.paths.push(pathDatum);
        calculateDistancesbetweennodes();
        redrawLines();
        redrawNodes();
        mapdata.getstate.fromNode = null;
        mapdata.getstate.toNode = null;
    }
};

function calculateDistancesbetweennodes() {


    mapdata.distances = [];
    for (var i = 0; i < mapdata.allnodes.length; i++) {
        mapdata.distances[i] = [];
        for (var j = 0; j < mapdata.allnodes.length; j++)
            mapdata.distances[i][j] = 'x';
    }


    for (var i = 0; i < mapdata.paths.length; i++) {

        var sourceNodeId = parseInt(mapdata.paths[i].from);
        var targetNodeId = parseInt(mapdata.paths[i].to);
        var sourceNode = mapdata.allnodes[sourceNodeId];
        var targetNode = mapdata.allnodes[targetNodeId];

        var xDistance = Math.abs(sourceNode.x - targetNode.x);
        var yDistance = Math.abs(sourceNode.y - targetNode.y);
        var distance = parseInt(Math.sqrt(Math.pow(xDistance, 2) + Math.pow(yDistance, 2)));

        mapdata.distances[sourceNodeId][targetNodeId] = distance;
        mapdata.distances[targetNodeId][sourceNodeId] = distance;



        console.log(mapdata);

    };

};

function dijkstra(start, end) {

    var nodeCount = mapdata.distances.length,
        infinity = 99999, // infinity
        shortestPath = new Array(nodeCount),
        nodeChecked = new Array(nodeCount),
        pred = new Array(nodeCount);


    for (var i = 0; i < nodeCount; i++) {
        shortestPath[i] = infinity;
        pred[i] = null;
        nodeChecked[i] = false;
    }

    shortestPath[start] = 0;

    for (var i = 0; i < nodeCount; i++) {

        var minDist = infinity;
        var closestNode = null;

        for (var j = 0; j < nodeCount; j++) {

            if (!nodeChecked[j]) {
                if (shortestPath[j] <= minDist) {
                    minDist = shortestPath[j];
                    closestNode = j;
                }
            }
        }

        nodeChecked[closestNode] = true;

        for (var k = 0; k < nodeCount; k++) {
            if (!nodeChecked[k]) {
                var nextDistance = distanceBetween(closestNode, k, mapdata.distances);
                if ((parseInt(shortestPath[closestNode]) + parseInt(nextDistance)) < parseInt(shortestPath[k])) {
                    soFar = parseInt(shortestPath[closestNode]);
                    extra = parseInt(nextDistance);
                    shortestPath[k] = soFar + extra;
                    pred[k] = closestNode;
                }
            }
        }

    }



    if (shortestPath[end] < infinity) {

        var newPath = [];
        var step = {
            target: parseInt(end)
        };

        var v = parseInt(end);

        while (v >= 0) {
            v = pred[v];
            if (v !== null && v >= 0) {
                step.source = v;
                newPath.unshift(step);
                step = {
                    target: v
                };
            }
        }

        totalDistance = shortestPath[end];

        console.log(newPath);

        return {
            mesg: 'Status: OK',
            path: newPath,
            source: start,
            target: end,
            distance: totalDistance
        };
    } else {
        return {
            mesg: 'Sorry No path found',
            path: null,
            source: start,
            target: end,
            distance: 0
        };
    }

    function distanceBetween(fromNode, toNode, distances) {
        dist = distances[fromNode][toNode];
        if (dist === 'x') dist = infinity;
        return dist;
    }


};

function aStar(start, end) {


    var nodeCount = mapdata.distances.length,
        infinity = 99999, // infinity
        priorities = new Array(nodeCount),
        visited = new Array(nodeCount),
        distances = new Array(nodeCount),
        pred = new Array(nodeCount);

    for (var i = 0; i < nodeCount; i++) {
        priorities[i] = infinity;
        visited[i] = false;
        distances[i] = infinity;
    }

    distances[start] = 0;
    priorities[start] = heuristic(start, end);

    for (var k = 0; k < nodeCount; k++) {
        var lowestPriority = infinity;
        var lowestPriorityindex = -1;
        for (var i = 0; i < priorities.length; i++) {
            if (priorities[i] < lowestPriority && !visited[i]) {
                lowestPriority = priorities[i];
                lowestPriorityindex = i;
            }
        }

        if (lowestPriorityindex == -1) {
            return -1;
        }
        else if (lowestPriorityindex == end) {
            console.log("WOOO");
            break;
        }


        for (var i = 0; i < nodeCount; i++) {

            if (!visited[i] && mapdata.distances[lowestPriorityindex][i] != 'x') {
                if (distances[lowestPriorityindex] + mapdata.distances[lowestPriorityindex][i] < distances[i]) {
                    distances[i] = distances[lowestPriorityindex] + mapdata.distances[lowestPriorityindex][i];

                    priorities[i] = distances[i] + heuristic(i, end);

                    pred[i] = lowestPriorityindex;
                }
            }
        }

        visited[lowestPriorityindex] = true;

    }
    if (distances[end] < infinity) {

        var newPath = [];
        var step = {
            target: parseInt(end)
        };

        var v = parseInt(end);

        while (v >= 0) {
            v = pred[v];
            if (v !== null && v >= 0) {
                step.source = v;
                newPath.unshift(step);
                step = {
                    target: v
                };
            }
        }

        totalDistance = distances[end];

        console.log(newPath);

        return {
            mesg: 'Status: OK',
            path: newPath,
            source: start,
            target: end,
            distance: totalDistance
        };
    } else {
        return {
            mesg: 'Sorry No path found',
            path: null,
            source: start,
            target: end,
            distance: 0
        };
    }



    function heuristic(fromNode, toNode) {
        var xDistance = Math.abs(mapdata.allnodes[fromNode].x - mapdata.allnodes[toNode].x);
        var yDistance = Math.abs(mapdata.allnodes[fromNode].y - mapdata.allnodes[toNode].y);
        var distance = parseInt(Math.sqrt(Math.pow(xDistance, 2) + Math.pow(yDistance, 2)));
        return distance;
    }

};


function sleep(time) {
    return new Promise((resolve) => setTimeout(resolve, time));
}


function mindistance(x1, y1, x2, y2) {
    var xDistance = Math.abs(x2 - x1);
    var yDistance = Math.abs(y2 - y1);
    var distance = parseInt(Math.sqrt(Math.pow(xDistance, 2) + Math.pow(yDistance, 2)));
    return distance;
}