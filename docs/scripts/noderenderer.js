class TreeNode {
    constructor(val = 0, children = []) {
        this.val = val
        this.children = children
    }
}

function nodeRender(target, { nodes, links, root }={}) {
    let { width, height, top, left } = target.getBoundingClientRect()
    let offset = {
        x: width/2,
        y: height/2,
        scale: 1.5,
        mouse: [left, top]
    }

    let targetCanv = document.createElement("canvas")
    targetCanv.width = width
    targetCanv.height = height
    target.appendChild(targetCanv)

    nodes = nodes || []
    links = links || []

    let nodeMap = {}, 
    context = targetCanv.getContext("2d"), 
    nodeSize = 20,
    hNodes = new Set(),
    linkText = {},
    staticLabels = [],
    linkLabels = true,
    dragging = false,
    onNodeHover = () => {},
    onNodeClick = () => {},
    ncolor = "red",
    hcolor = "blue",
    traversed = "grey",
    visited = "green",
    eventsPaused = false

    const rowSpace = nodeSize * 3

    window.requestAnimationFrame(() => {
        draw(Date.now())
    })

    function getFixedCenter() {
        return [width/2, height/2]
    }

    function updateSize() {
        const rect = target.getBoundingClientRect()

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
        targetCanv.height = rect.height
    }

    function convertDrawCoord(coord) {
        return [coord[0] * offset.scale + offset.x, offset.y - coord[1] * offset.scale]
    }

    function convertScreenCoord(coord) {
        return [(coord[0] - offset.x) / offset.scale, (coord[1] - offset.y) / offset.scale] 
    }

    function initData(data) {
        nodeMap = {}
        linkText = {}
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
        clearExtra()

        if (data.root) {
            renderTree(data.root)
        }
    }

    function spaceNeeded(treeNode) {
        function helper(node) {
            if (!node?.children?.length) return nodeSize * 1.5

            let space = 0

            for (const child of node.children) {
                let s = helper(child)
                space += s
            }

            node.space = space
            return space
        }

        return helper(treeNode, null)
    }

    function renderTree(root) {
        nodes = []
        links = []
        if (root.children === undefined || root.val === undefined) {
            console.log("Bad tree structure")
            nodes = []
            links = []
            return
        }

        let maxLevel = 0

        function helper(node, parent, level=0, position=0) {
            let _n = {
                id: node.val,
                label: node.val,
                y: -(level * rowSpace),
                x: position
            }
            nodes.push(_n)
            let l
            if (parent) l = {
                source: parent.val,
                target: node.val
            }
            if (l) links.push(l)
            maxLevel = Math.max(maxLevel, level)

            position -= node.space / 2
            
            for (const child of node.children) {
                if (!child) continue
                helper(child, node, level + 1, position + child.space / 2)
                position += child.space
            }
        }
        const totalSpace = spaceNeeded(root)
        helper(root)

        nodes = nodes.map(node => {
            node.y = (node.y ?? 0) + (maxLevel * rowSpace) / 2
            node.label = node.label ?? node.id
            nodeMap[node.id] = node

            return node
        })

        links = links.map(link => {
            link.p1 = [nodeMap[link.source].x, nodeMap[link.source].y]
            link.p2 = [nodeMap[link.target].x, nodeMap[link.target].y]

            return link
        })
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
        r = r * offset.scale
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
        thickness = thickness * offset.scale

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

    function offScreen(coord) {
        let [x, y] = convertDrawCoord(coord)
        let bar = nodeSize * offset.scale
        if (x <= -bar || y <= -bar) return true
        if (x >= width + bar || y >= height + bar) return true
        return false
    }

    function onHoverNode(func) {
        onNodeHover = func
    }

    function draw(t) {
        let now = Date.now()

        context.clearRect(0, 0, targetCanv.width, targetCanv.height)

        for (const x of links) {
            drawLine(x.p1, x.p2, 3)
            let { target, source } = x
            let txt = linkText[target.id ?? target]

            if (txt && linkLabels) {
                target = nodeMap[target.id ?? target]
                source = nodeMap[source.id ?? source]

                let dr = -1
                let a = "end"
                if (source.x < target.x) {
                    dr = 1
                    a = "start"
                }
                let c = [lerp(target.x + 5 * dr, source.x, .5), lerp(target.y + 10, source.y + 10, .5)]

                drawText(c, txt, false, a, "black")
            }
        }
        for (const x of nodes) {
            let center = [x.x, x.y]
            if (offScreen(center)) continue
            if (hNodes.has(x.id)) {
                drawCircle(center, nodeSize + nodeSize * .2, hcolor)
            }
            let color = ncolor
            if (x.traversed) color = traversed
            if (x.visited) color = visited
            drawCircle(center, nodeSize, color)
            if (x.label) drawText(center, x.label)
        }
        for (const x of staticLabels) {
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

    function drawStaticText(pos, txt) {
        staticLabels.push([pos, String(txt)])
    }

    function getNodeSize() {
        return nodeSize
    }

    function addText(target, txt) {
        linkText[target.id ?? target] = txt
    }

    function getNcount() {
        return nodes.length
    }

    function showLabels(state) {
        linkLabels = state
    }

    function getNodeAt(x, y) {
        return nodes.reduce((acc, node) => {
            let [x1, y1] = convertDrawCoord([node.x, node.y])
            let r = nodeSize * offset.scale
            if (x >= x1 - r && x <= x1 + r && y >= y1 - r && y <= y1 + r) {
                return node
            }
            return acc
        }, null)
    }

    function onClickNode(func) {
        onNodeClick = func
    }

    function pauseEvents(paused) {
        eventsPaused = paused
    }

    initData({ nodes, links, root })
    window.addEventListener("resize", updateSize)
    targetCanv.addEventListener("wheel", (event) => {
        offset.scale += event.deltaY * -.001

        let clamped = Math.min(5, Math.max(offset.scale, .5))
        if (clamped !== offset.scale) {
            offset.scale = clamped
            return
        }
        offset.scale = clamped
        let [x, y] = convertScreenCoord(getMouseActual([event.clientX, event.clientY]))
        // let converted = convertDrawCoord([x, y])
        // console.log(converted)
        // // let 
    }, { passive: true })
    targetCanv.addEventListener("mousedown", (event) => {
        let last
        let original = [offset.x, offset.y]
        dragging = false
        
        const dragger = (event) => {
            event.preventDefault()
            dragging = true
            target.style.cursor = "grabbing"
            // console.log(convertScreenCoord([0, 0]))
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
            if (!dragging && !eventsPaused) {
                let [x, y] = getMouseActual([event.clientX, event.clientY])
                let node = getNodeAt(x, y)
                onNodeClick(node)
            }
            else {
                target.style.cursor = "inherit"
            }

            targetCanv.removeEventListener("mousemove", dragger)
            targetCanv.removeEventListener("mouseup", enddrag)
            targetCanv.removeEventListener("mouseleave", enddrag)
            dragging = false
        }

        targetCanv.addEventListener("mousemove", dragger)
        targetCanv.addEventListener("mouseup", enddrag)
        targetCanv.addEventListener("mouseleave", enddrag)
    })
    targetCanv.addEventListener("mousemove", (event) => {
        if (dragging || eventsPaused) return
        let [x, y] = getMouseActual([event.clientX, event.clientY])

        if (onNodeHover) {
            let node = getNodeAt(x, y)
            onNodeHover(node)
        }
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
        showLabels,
        onHoverNode,
        onClickNode,
        pauseEvents,
        getNodeSize
    }
}