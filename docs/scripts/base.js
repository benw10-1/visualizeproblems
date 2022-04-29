var graphEl, slider

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

function genPerfectBinTree(mnodes=15) {
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

function renderTree(root) {
    if (!root) return
    
    let nodes = []
    let links = []
    let leveldiff = 60
    let size = 40
    let maxlevel = -1
    let nodeMap = {}

    // get space needed per node and level info
    function helper(node, level, parent) {
        if (!node) return size
        let n = {
            id: node.val,
            label: node.val,
            y: -level * leveldiff
        }
        nodeMap[n.id] = n
        let space = 0
        node.space = 0
        for (const x of node.children) {
            let s = helper(x, level + 1, node)
            space += s
        }
        node.space = space

        nodes.push(n)
        if (parent) links.push({
            source: parent.val,
            target: node.val
        })

        maxlevel = Math.max(level, maxlevel)
        return (space === 0) ? size : space
    }

    function second(node, offset) {
        if (!node) return
        nodeMap[node.val].x = offset

        let spaceleft = node.space
        let place = offset - spaceleft/2

        for (let x of node.children) {
            second(x, place)
            if (!x) {
                x = {
                    space: spaceleft
                }
            }
            place = offset + (spaceleft - x.space/2)/2
        }
    }

    root.space = helper(root, 0, false)

    second(root, 0)

    return {
        nodes: nodes,
        links: links
    }
}

function loadEls() {
    graphEl = document.getElementById("graph")
    slider = document.getElementById("slider")
    let nodelabel = document.getElementById("nodelabel")

    let perf = genPerfectBinTree()
    let rendered = renderTree(perf)
    let renderer = nodeRender(graphEl)
    renderer.initData(rendered)

    slider.addEventListener("input", (event) => {
        nodelabel.innerHTML = "Number of nodes: " + slider.value
        let newTree = genPerfectBinTree(Number(slider.value))
        renderer.initData(renderTree(newTree))
        
    })
    nodelabel.innerHTML = "Number of nodes: " + slider.value
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