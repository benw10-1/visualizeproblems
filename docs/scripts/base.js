var graphEl

const colorScheme = ["#E63946", "#1D3557", "#A8DADC", "#F1FAEE"]
const keysExp = /(Backspace)|(Escape)|(Control)|\s/

class TreeNode {
    constructor(val = 0, children = []) {
        this.val = val
        this.children = children
    }
}

class BinaryTreeNode {
    constructor(val=0, left, right) {
        this.val = val
        this.left = left
        this.right = right
    }
}

function genPerfectBinTree(mnodes=26) {
    // [1, 2, 3, 4, ..mnodes]
    let ns = Array(mnodes).fill(1).map((x, y) => x + y)

    const gentree = (low, high, nodes) => {
        if (low > high) return
        
        let mid = Math.floor((low + high)/2)

        let root = new TreeNode(nodes[mid])

        if (low === high) return root

        root.children[0] = gentree(low, mid - 1, nodes)
        root.children[1] = gentree(mid + 1, high, nodes)

        return root
    }

    return gentree(0, ns.length - 1, ns)
}

function renderTree(target, root) {
    if (!root) return
    
    function helper(node, level) {

    }
}

function loadEls() {
    graphEl = document.getElementById("graph")
    treeRender(graphEl)

    let perf = genPerfectBinTree()
    renderTree(graphEl, perf)
}

function log(text, error, tm=1000) {
    return
    logger.classList.remove("red")
    if (error) logger.classList.add("red")
    logger.innerHTML = text
    logger.classList.remove("fading")
    clearTimeout(logtm)
    logtm = setTimeout(() => {
        logger.classList.add("fading")
    }, tm)
}

function treeRender(target, data) {
    let { width, height } = target.getBoundingClientRect()
    let offset = {
        x: width/2,
        y: height/2,
        scale: 1,
    }
    
    let nodes = [], links = [], nodeMap = {}

    window.requestAnimationFrame(() => {
        draw(Date.now())
    })

    function convertDrawCoord(coord) {
        return [(coord[0] + offset.x) * scale, (coord[1] + offset.y) * scale]
    }

    function initData(data) {
        nodes = data.nodes
        links = data.links
        nodes.forEach(node => {
            nodeMap[node.id] = node
        })
        links.forEach(link => {
            link.x1 = nodeMap[link.source.id ?? link.source].x
            link.y1 = nodeMap[link.source.id ?? link.source].y

            link.x2 = nodeMap[link.target.id ?? link.target].x
            link.y2 = nodeMap[link.target.id ?? link.target].y
        })
    }

    function draw(t) {
        let now = Date.now()

        window.requestAnimationFrame(() => {
            draw(now)
        })
    }

    initData(data)
}