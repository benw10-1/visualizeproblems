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

function renderTree(root) {
    if (!root) return
    
    let nodes = []
    let links = []
    
    return {
        nodes: [
            {
                id: 1,
                label: 1,
                x: 0,
                y: 0
            },
            {
                id: 2,
                label: 2,
                x: 50,
                y: 50
            }
        ],
        links: [
            {
                source: 1,
                target: 2
            }
        ]
    }
}

function loadEls() {
    graphEl = document.getElementById("graph")

    let perf = genPerfectBinTree()
    let rendered = renderTree(perf)
    let renderer = nodeRender(graphEl)
    renderer.initData(rendered)
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