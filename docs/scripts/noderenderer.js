function nodeRender(target, data) {
    let { width, height, top, left } = target.getBoundingClientRect()
    let offset = {
        x: width/2,
        y: height/2,
        scale: 1,
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

    let nodes, links, nodeMap, 
    context = targetCanv.getContext("2d"), 
    nodeSize = data.nodesize ?? 20,
    hNodes = new Set()

    let ncolor = "red"
    let hcolor = "blue"
    let traversed = "grey"
    let visited = "green"

    window.requestAnimationFrame(() => {
        draw(Date.now())
    })

    function updateSize() {
        let rect = target.getBoundingClientRect()

        offset = {
            x: rect.width/2,
            y: rect.height/2,
            scale: offset.scale ?? 1,
            mouse: [rect.left, rect.top]
        }
        targetCanv.width = width
        targetCanv.height = height
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
    }

    function setCenter(x, y) {
        if (x[0] && x[1]) {
            offset.x = x[0]
            offset.y = x[1]
        }
        else {
            offset.x = x
            offset.y = y
        }
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

    function drawText(center, text) {
        center = convertDrawCoord(center)

        text = String(text)

        let texth = 22 * offset.scale
        let maxw = 20 * offset.scale
        context.font = texth + "px serif"

        center = [center[0], center[1] + texth/4]
        context.textAlign = 'center';
        context.fillText(text, center[0], center[1], maxw)
    }

    function draw(t) {
        let now = Date.now()

        context.clearRect(0, 0, targetCanv.width, targetCanv.height)

        for (const x of links) {
            drawLine(x.p1, x.p2, 3 * offset.scale)
        }

        for (const x of nodes) {
            let center = [x.x, x.y]
            if (hNodes.has(x.id)) {
                drawCircle(center, (nodeSize + nodeSize * .2) * offset.scale, hcolor)
            }
            if (x.visited) {
                drawCircle(center, nodeSize * offset.scale, visited)
            }
            else if (x.traversed) {
                drawCircle(center, nodeSize * offset.scale, traversed)
            }
            else {
                drawCircle(center, nodeSize * offset.scale, ncolor)
            }
            if (x.label) drawText(center, x.label)
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
                let l1 = v1[0] + p * (v1[0] - v1[1]) 
                let l2 = v2[0] + p * (v2[0] - v2[1]) 

                return [l1, l2] 
            }

            [v1, v2, p] = [v1[0], v1[0], v2]
            return v1 + p * (v1 - v2)
        }
        return v1 + p * (v1 - v2)
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
    }

    function getNode(id) {
        return nodeMap[id]
    }

    initData(data)

    window.addEventListener("resize", updateSize)
    targetCanv.addEventListener("wheel", (event) => {
        event.preventDefault()
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
    })
    targetCanv.addEventListener("mousedown", (event) => {
        let last
        let original = [offset.x, offset.y]
        dragging = false
        
        const dragger = (event) => {
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
        clearExtra
    }
}