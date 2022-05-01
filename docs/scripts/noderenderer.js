function nodeRender(target, data) {
    let { width, height, top, left } = target.getBoundingClientRect()
    let offset = {
        x: width/2,
        y: height/2,
        scale: 1.5,
        mouse: [left, top]
    }

    data = {
        nodes: [],
        links: [],
        ...data
    }

    let targetCanv = document.createElement("canvas")
    targetCanv.width = width
    targetCanv.height = height
    target.appendChild(targetCanv)

    let nodes = [], links = [], nodeMap = {}, 
    context = targetCanv.getContext("2d"), 
    nodeSize = data.nodesize ?? 20,
    hNodes = new Set(),
    linkText = {},
    staticLabels = []

    let ncolor = "red"
    let hcolor = "blue"
    let traversed = "grey"
    let visited = "green"

    window.requestAnimationFrame(() => {
        draw(Date.now())
    })

    function getFixedCenter() {
        return [width/2, height/2]
    }

    function updateSize() {
        let rect = target.getBoundingClientRect()

        width = rect.width
        height = rect.height
        top = rect.top
        left = rect.left

        offset = {
            x: rect.width/2,
            y: rect.height/2,
            scale: offset.scale ?? 1,
            mouse: [rect.left, rect.top]
        }
        targetCanv.width = rect.width
        targetCanv.height = rect.width
    }

    function convertDrawCoord(coord) {
        return [(coord[0] * offset.scale + offset.x) , (offset.y - coord[1] * offset.scale) ]
    }

    function initData(data) {
        nodeMap = {}
        nodes = data.nodes ?? []
        links = data.links ?? []
        nodes.forEach(node => {
            nodeMap[node.id] = node
        })
        links.forEach(link => {
            link.p1 = [nodeMap[link.source.id ?? link.source].x, nodeMap[link.source.id ?? link.source].y]

            link.p2 = [nodeMap[link.target.id ?? link.target].x, nodeMap[link.target.id ?? link.target].y]
        })

        nodeSize = data.nodesize ?? 20
        // console.log(nodes, links)
    }

    function setCenter(x, y) {
        let coord
        if (x[0] && x[1]) coord = x
        else coord = [x, y]
        offset.x = coord[0]
        offset.y = coord[1]
    }

    function drawCircle(center, r, color) {
        center = convertDrawCoord(center)

        context.fillStyle = color
        context.lineWidth = 1
        context.beginPath()
        context.arc(center[0], center[1], r, 0, 2 * Math.PI)
        context.fill()
        context.fillStyle = "black"
    }

    function drawLine(p1, p2, thickness) {
        p1 = convertDrawCoord(p1)
        p2 = convertDrawCoord(p2)

        context.lineWidth = thickness
        context.beginPath()
        context.moveTo(p1[0], p1[1])
        context.lineTo(p2[0], p2[1])
        context.stroke()
    }

    function drawText(center, text, mw=20, align="center", color="#F1FAEE") {
        center = convertDrawCoord(center)

        text = String(text)

        let texth = 22 * offset.scale
        let maxw = mw * offset.scale
        context.font = texth + "px serif"

        context.fillStyle = color

        context.textBaseline = 'middle'
        context.textAlign = align
        context.fillText(text, center[0], center[1], mw ? maxw : undefined)

        context.fillStyle = "black"
    }

    function draw(t) {
        let now = Date.now()

        context.clearRect(0, 0, targetCanv.width, targetCanv.height)

        for (const x of links) {
            drawLine(x.p1, x.p2, 3 * offset.scale)
            let { target, source } = x
            let txt = linkText[target.id ?? target]

            if (txt) {
                target = nodeMap[target]
                source = nodeMap[source]

                let dr = -1
                let a = "end"
                if (source.x < target.x) {
                    dr = 1
                    a = "start"
                }

                let c = [lerp(target.x, source.x + 12.5 * dr, .5), lerp(target.y, source.y + 12.5, .5)]

                drawText(c, txt, false, a, "black")
            }
        }

        for (const x of nodes) {
            let center = [x.x, x.y]
            if (hNodes.has(x.id)) {
                drawCircle(center, (nodeSize + nodeSize * .2) * offset.scale, hcolor)
            }
            let color = ncolor
            if (x.traversed) color = traversed
            if (x.visited) color = visited

            drawCircle(center, nodeSize * offset.scale, color)
            if (x.label) drawText(center, x.label)
        }
        for (const x of staticLabels) {
            console.log(x)
            drawText(x[0], x[1], false, "center", "black")
        }

        window.requestAnimationFrame(() => {
            draw(now)
        })
    }

    function getMouseActual(pos) {
        return [pos[0] + offset.mouse[0], pos[1] + offset.mouse[1]]
    } 

    function lerp(v1, v2, p) {
        if (v1[0] && v1[1]) {
            if (v2[0] && v2[1]) {
                let l1 = v1[0] * (1 - p) + v1[1] * p 
                let l2 = v2[0] * (1 - p) + v2[1] * p  

                return [l1, l2] 
            }

            [v1, v2, p] = [v1[0], v1[0], v2]
            return v1 * (1 - p) + v2 * p
        }
        return v1 * (1 - p) + v2 * p
    }

    function getHighlight() {
        return hNodes
    }

    function clearExtra() {
        hNodes.clear()

        nodes.forEach(e => {
            delete e.traversed
            delete e.visited
        })
        linkText = {}
        staticLabels = []
    }

    function getNode(id) {
        return nodeMap[id]
    }

    function drawStaticText(txt, pos) {
        staticLabels.push([pos, String(txt)])
    }

    function addText(target, txt) {
        linkText[target.id ?? target] = txt
    }

    function getNcount() {
        return nodes.length
    }

    initData(data)

    window.addEventListener("resize", updateSize)
    targetCanv.addEventListener("wheel", (event) => {
        offset.scale += event.deltaY * -.001

        let clamped = Math.min(5, Math.max(offset.scale, .5))
        if (clamped !== offset.scale) {
            offset.scale = clamped
            return
        }
        offset.scale = clamped
        
        // if (event.deltaY < 0) {
        //     let [x, y] = getMouseActual([event.clientX, event.clientY])
        //     console.log(x, lerp(x, width/2, .5))
        //     offset.x += (x - lerp(x, width/2, .5))/offset.scale
        //     offset.y += (y - lerp(y, height/2, .5))/offset.scale
        // }
    }, { passive: true })
    targetCanv.addEventListener("mousedown", (event) => {
        let last
        let original = [offset.x, offset.y]
        dragging = false
        
        const dragger = (event) => {
            event.preventDefault()
            dragging = true
            target.style.cursor = "grabbing"

            let [x, y] = getMouseActual([event.clientX, event.clientY])
            if (!last) {
                last = [x, y]
                return
            }
            let [dx, dy] = [x - last[0], y - last[1]]
            offset.x = original[0] + dx//(offset.scale -.1)
            offset.y = original[1] + dy//(offset.scale -.1)
        }

        const enddrag = (event) => {
            target.style.cursor = "inherit"

            targetCanv.removeEventListener("mousemove", dragger)
            targetCanv.removeEventListener("mouseup", enddrag)
            dragging = false
        }

        targetCanv.addEventListener("mousemove", dragger)
        targetCanv.addEventListener("mouseup", enddrag)
    })

    return {
        setCenter,
        initData,
        getHighlight,
        getNode,
        clearExtra,
        addText,
        getFixedCenter,
        getNcount,
        drawStaticText,
    }
}