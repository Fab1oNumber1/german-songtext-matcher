import 'bootstrap/scss/bootstrap.scss'
import './style.scss'
import * as d3 from "d3"
import words from "./data/words.json"
import {artists} from "./data/shared.mjs";

const app = document.getElementById('app')


const selectedArtists = [
    artists[0].id,
    artists[1].id,
    0,
]
const getTotalBySelectedArtists = (word) => {
    let total = 0;
    for (let a of selectedArtists) {
        total += (word.artistCount[a] ?? 0)
    }
    return total
}

let LIMIT = 60
let MIN_COUNT = 10
let MIN_WORD_LENGTH = 6

let MIN_MATCH = 5

//setup inputs
d3.selectAll('.artist-select')
    .on('change', d => {
        selectedArtists[d.target.dataset.selectedArtistsId] = parseInt(d.target.value)
        update()
    })
    .selectAll('option')
    .data([{id: 0, name: '-- Keine Auswahl --'}, ...artists])
    .enter()
    .append('option')
    .attr('value', d => d.id)
    .text(d => d.name)

d3.select('#selectR option:nth-child(2)').attr('selected', 'selected')
d3.select('#selectG option:nth-child(3)').attr('selected', 'selected')
//d3.select('#selectB option:nth-child(4)').attr('selected', 'selected')

d3.select('#wordMinLenInput').attr('value', MIN_WORD_LENGTH).on('change', (d) => {
    MIN_WORD_LENGTH = d.target.value
    update()
})
d3.select('#countLimitInput').attr('value', MIN_COUNT).on('change', (d) => {
    MIN_COUNT = d.target.value
    update()
})

d3.select('#limitInput').attr('value', LIMIT).on('change', (d) => {
    LIMIT = d.target.value
    update()
})

d3.select('#minMatch').attr('value', MIN_MATCH).on('change', (d) => {
    MIN_MATCH = d.target.value
    update()
})


let chart = null;


function update() {
    if (chart)
        chart.remove()

    chart = BubbleChart(
        words
            .sort((a,b) => getTotalBySelectedArtists(b) - getTotalBySelectedArtists(a))
            .filter(w =>  w.word.length >= MIN_WORD_LENGTH)
            .filter(w =>  getTotalBySelectedArtists(w) >= MIN_COUNT)
            .filter(w =>  {
                if(MIN_MATCH) {
                    let matched = true;
                    console.log(selectedArtists)

                    let matches = getMatching(w)
                    for(let i = 0; i < 3; i++) {
                        if(selectedArtists[i] && matches[i] < MIN_MATCH / 100) {
                            matched = false
                        }
                    }
                    return matched
                }
                return true
            })
            .slice(0, LIMIT)
        , {
            label: d => [d.word, getTotalBySelectedArtists(d)].join("\n"),
            value: d => getTotalBySelectedArtists(d),
            group: d => 1,
            title: d => d.word,
            width: 920,
        })

    app.append(chart)
}
update()


function BubbleChart(data, {
    name = ([x]) => x, // alias for label
    label = name, // given d in data, returns text to display on the bubble
    value = ([, y]) => y, // given d in data, returns a quantitative size
    group, // given d in data, returns a categorical value for color
    title, // given d in data, returns text to show on hover
    link, // given a node d, its link (if any)
    linkTarget = "_blank", // the target attribute for links, if any
    width = 640, // outer width, in pixels
    height = width, // outer height, in pixels
    padding = 3, // padding between circles
    margin = 1, // default margins
    marginTop = margin, // top margin, in pixels
    marginRight = margin, // right margin, in pixels
    marginBottom = margin, // bottom margin, in pixels
    marginLeft = margin, // left margin, in pixels
    groups, // array of group names (the domain of the color scale)
    colors = d3.schemeTableau10, // an array of colors (for groups)
    fill = "#ccc", // a static fill color, if no group channel is specified
    fillOpacity = 0.7, // the fill opacity of the bubbles
    stroke, // a static stroke around the bubbles
    strokeWidth, // the stroke width around the bubbles, if any
    strokeOpacity, // the stroke opacity around the bubbles, if any
} = {}) {
    // Compute the values.
    const D = d3.map(data, d => d);
    const V = d3.map(data, value);
    const G = group == null ? null : d3.map(data, group);
    const I = d3.range(V.length).filter(i => V[i] > 0);

    // Unique the groups.
    if (G && groups === undefined) groups = I.map(i => G[i]);
    groups = G && new d3.InternSet(groups);

    // Construct scales.
    const color = G && d3.scaleOrdinal(groups, colors);


    // Compute labels and titles.
    const L = label == null ? null : d3.map(data, label);
    const T = title === undefined ? L : title == null ? null : d3.map(data, title);

    // Compute layout: create a 1-deep hierarchy, and pack it.
    const root = d3.pack()
        .size([width - marginLeft - marginRight, height - marginTop - marginBottom])
        .padding(padding)
        (d3.hierarchy({children: I})
            .sum(i => V[i]));

    const svg = d3.create("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("viewBox", [-marginLeft, -marginTop, width, height])
        .attr("style", "max-width: 100%; height: auto; height: intrinsic;")
        .attr("fill", "currentColor")
        .attr("font-size", 10)
        .attr("font-family", "sans-serif")
        .attr("text-anchor", "middle");

    const leaf = svg.selectAll("a")
        .data(root.leaves())
        .join("a")
        .attr("xlink:href", link == null ? null : (d, i) => link(D[d.data], i, data))
        .attr("target", link == null ? null : linkTarget)
        .attr("transform", d => `translate(${d.x},${d.y})`);

    leaf.append("circle")
        .attr("stroke", stroke)
        .attr("stroke-width", strokeWidth)
        .attr("stroke-opacity", strokeOpacity)
        .attr("fill", d => {
            let word = D[d.data]
            return intArrayToRgb(getMatching(word))
        })
        .attr("fill-opacity", fillOpacity)
        .attr("r", d => d.r);

    if (T) leaf.append("title")
        .text(d => T[d.data]);

    if (L) {
        // A unique identifier for clip paths (to avoid conflicts).
        const uid = `O-${Math.random().toString(16).slice(2)}`;

        leaf.append("clipPath")
            .attr("id", d => `${uid}-clip-${d.data}`)
            .append("circle")
            .attr("r", d => d.r);

        leaf.append("text")
            .attr("clip-path", d => `url(${new URL(`#${uid}-clip-${d.data}`, location)})`)
            .selectAll("tspan")
            .data(d => `${L[d.data]}`.split(/\n/g))
            .join("tspan")
            .attr("x", 0)
            .attr("y", (d, i, D) => `${i - D.length / 2 + 0.85}em`)
            .attr("fill-opacity", (d, i, D) => i === D.length - 1 ? 0.7 : null)
            .text(d => d);
    }

    return Object.assign(svg.node(), {scales: {color}});
}

function getMatching(word) {
    return selectedArtists.map(artist_id => word.artistCount[artist_id] ? word.artistCount[artist_id] / getTotalBySelectedArtists(word) : 0)
}

function intArrayToRgb(arr) {
    arr = arr.map(v => v * 255)
    return `rgb(${arr.join(', ')})`;
}