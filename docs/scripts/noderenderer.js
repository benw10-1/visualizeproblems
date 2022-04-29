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

    let nodes, links, nodeMap, 
    context = targetCanv.getContext("2d"), 
    nodeSize = 20, 
    dragging = false

    window.requestAnimationFrame(() => {
        draw(Date.now())
    })

    function updateSize() {
        width = target.getBoundingClientRect().width
        height = target.getBoundingClientRect().height
        offset = {
            x: width/2,
            y: height/2,
            scale: offset.scale ?? 1,
        }
        targetCanv.width = width
        targetCanv.height = height
    }

    function convertDrawCoord(coord) {
        return [coord[0] * offset.scale + offset.x, -coord[1] * offset.scale + offset.y]
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

    function drawCircle(center, r) {
        center = convertDrawCoord(center)

        context.lineWidth = 1
        context.beginPath()
        context.arc(center[0], center[1], r, 0, 2 * Math.PI)
        context.fillStyle = "red"
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

        let texth = 12 * offset.scale
        let maxw = 20 * offset.scale
        context.font = texth + "px serif"

        center = [center[0] - text.length * 3 * offset.scale, center[1] + texth/4]

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
            drawCircle(center, nodeSize * offset.scale)
            if (x.label) drawText(center, x.label)
        }

        window.requestAnimationFrame(() => {
            draw(now)
        })
    }

    function getMouseActual(pos) {
        return [pos[0] + offset.mouse[0], pos[1] + offset.mouse[1]]
    } 

    function lerped(v1, v2, p) {
        if (v1[0] && v1[1]) {
            if (v2[0] && v2[1]) {
                let l1 = v1[0] + p * (v1[0] - v1[1]) 
                let l2 = v2[0] + p * (v2[0] - v2[1]) 

                return [l1, l2] 
            }

            let [v1, v2, p] = [v1[0], v1[0], v2]
            return v1 + p * (v1 - v2)
        }
        return v1 + p * (v1 - v2)
    }

    initData(data)

    window.addEventListener("resize", updateSize)
    targetCanv.addEventListener("wheel", (event) => {
        offset.scale += event.deltaY * -.005

        let clamped = Math.min(5, Math.max(offset.scale, .5))
        if (clamped !== offset.scale) {
            offset.scale = clamped
            return
        }
        offset.scale = clamped

        let [x, y] = getMouseActual([event.clientX, event.clientY])

        if (event.deltaY < 0) {
            offset.x = lerped(offset.x, x, .2)
            offset.y = lerped(offset.y, y, .2)
        }
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
            offset.x = original[0] + dx
            offset.y = original[1] + dy
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
        initData
    }
}