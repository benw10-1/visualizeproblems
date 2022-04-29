var graphEl, slider, searchEl, mode, order, searched, trees, ani

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

const traversers = {
    "bin": {
        "in": function (node, val, inst) {
            const helper = (node, val, inst) => {
                if (!node) return false
                if (node.val === val) {
                    inst.push({ flag: "found", id: node.val })
                    return true
                }
                inst.push({ flag: "traversed", id: node.val })
                let res
                if (val < node.val) res = helper(node.children[0], val, inst)
                if (val > node.val) res = helper(node.children[1], val, inst)
                if (res) inst.push({ flag: "found", id: node.val })
                else inst.push({ flag: "traversed", id: node.val })
                return res
            }
            return helper(node, val, inst)
        }
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

function genRand(r1, r2) {
    let diff = r2 - r1
    return Math.floor(diff * Math.random() + r1)
}

function setM(event) {
    event.target.parentElement.querySelector(".selected").className = "head-but"
    event.target.classList.add("selected")
    
    let [mode, order] = document.querySelectorAll(".head-but.selected")
    mode =  mode.id
    order = order.id
    console.log(mode, order, searchEl.value)
}

function searchFor(id, tree) {
    let inst = []
    traversers[mode][order](tree, id, inst)
    return inst
}

async function playAni(renderer, inst) {
    if (ani) return
    ani = true

    async function delay(ms) {
        return new Promise((res) => {setTimeout(res, ms)})
    }

    let hnodes = renderer.getHighlight()

    for (const item of inst) {
        let d = 1000
        let { flag, id } = item

        let node = renderer.getNode(id)

        hnodes.clear()

        switch(flag) {
            case "found":
                hnodes.add(id)
                node.visited = true
                break;
            case "traversed":
                d /= 4
                hnodes.add(id)
                node.traversed = true
                break;
            default:
                break;
        }

        await delay(d)
    }
    ani = false
}

function loadEls() {
    graphEl = document.getElementById("graph")
    slider = document.getElementById("slider")
    searchEl = document.getElementById("searchnum")

    let searchBut = document.getElementById("searchBut")
    let nodelabel = document.getElementById("nodelabel")

    trees = {}

    let perf = genPerfectBinTree()
    trees.bin = perf
    let rendered = renderTree(perf)
    let renderer = nodeRender(graphEl)
    renderer.initData(rendered)
    mode = "bin"
    order = "in"

    searchEl.value = genRand(1, 16)

    slider.addEventListener("input", (event) => {
        renderer.clearExtra()
        nodelabel.innerHTML = "Number of nodes: " + slider.value
        let newTree = genPerfectBinTree(Number(slider.value))
        trees.bin = newTree
        renderer.initData(renderTree(newTree))
    })
    searchBut.addEventListener("click", (event) => {
        renderer.clearExtra()
        let s = searchFor(Number(searchEl.value), trees[mode])
        playAni(renderer, s)
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