var graphEl, slider, searchEl, mode, order, searched, currentTree, ani, renderer, aid

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
    "bin": function (node, val, inst) {
        const helper = (node, val, inst) => {
            if (!node) return false
            inst.push({ flag: "traversed", id: node.val })
            let res
            if (val < node.val) res = helper(node.children[0], val, inst)
            if (val > node.val) res = helper(node.children[1], val, inst)
            res = res || val === node.val
            inst.push({ flag: "visited", id: node.val })
            inst.push({ flag: "returned", id: node.val, res: true })
            return res
        }
        return helper(node, val, inst)
    },
    "rand": {
        "in": function (node, val, inst) {
            const helper = (node, val, inst) => {
                if (!node) return false
                inst.push({ flag: "traversed", id: node.val })

                let res = false
                let i = 0
                let vs = false

                for (const x of node.children) {
                    let r = helper(x, val, inst)
                    i++
                    if (!vs && i >= node.children.length/2) {
                        vs = true
                        inst.push({ flag: "visited", id: node.val })
                        if (node.val === val) {
                            res = true
                            break
                        }
                    }
                    if (r) {
                        res = true
                        break
                    }
                }
                if (node.children.length < 1) inst.push({ flag: "visited", id: node.val })
                inst.push({ flag: "returned", id: node.val, res })
                return res
            }

            return helper(node, val, inst)
        },
        "pre": function (node, val, inst) {
            const helper = (node, val, inst) => {
                if (!node) return false

                inst.push({ flag: "traversed", id: node.val })

                let res = false
                inst.push({ flag: "visited", id: node.val })
                if (node.val === val) {
                    inst.push({ flag: "returned", id: node.val, res: true })
                    return true
                }
                for (const x of node.children) {
                    let r = helper(x, val, inst)
                    if (r) {
                        res = true
                        break
                    }
                }
                //if (node.children.length === 0) inst.push({ flag: "visited", id: node.val })
                inst.push({ flag: "returned", id: node.val, res })
                return res
            }

            return helper(node, val, inst)
        },
        "post": function (node, val, inst) {
            const helper = (node, val, inst) => {
                if (!node) return false
                inst.push({ flag: "traversed", id: node.val })

                let res = false
                for (const x of node.children) {
                    let r = helper(x, val, inst)
                    if (r) {
                        res = true
                        break
                    }
                }
                res = res || (node.val === val)
                inst.push({ flag: "visited", id: node.val })
                inst.push({ flag: "returned", id: node.val, res })
                return res
            }

            return helper(node, val, inst)
        },
        "level": function (node, val, inst) {
            if (!node) return false

            let q = [node]
            let res = false

            while (q.length > 0) {
                let node = q.shift()
                inst.push({ flag: "traversed", id: node.val })
                inst.push({ flag: "visited", id: node.val })
                if (node.val === val) {
                    res = true
                    break
                }
                for (const x of node.children) q.push(x)
            }
            return res
        }
    }
}

function genPerfectBinTree(mnodes=15) {
    // [1, 2, 3, 4, ..mnodes]
    let ns = Array(mnodes).fill(1).map((x, y) => x + y)

    const gentree = (low, high) => {
        if (low > high) return
        
        let mid = Math.floor((low + high)/2)

        let root = new TreeNode(ns[mid])

        if (low === high) return root

        root.children[0] = gentree(low, mid - 1)
        root.children[1] = gentree(mid + 1, high)

        return root
    }

    return gentree(0, ns.length - 1)
}

function removeAndShift(arr, index) {
    if (!arr[index]) return

    for (let i = index; i < arr.length; i++) arr[i] = arr[i+1]

    arr.pop()
}

// change to real random tree not just values
function genRandTree(mnodes=15) {
    let ns = Array(mnodes).fill(1)
    // constantly increasing unique random values
    for (let i = 1; i < ns.length; i++) ns[i] = ns[i - 1] + genRand(1, 10)

    // assign a random "value" to each element, sort by that random element, then destructure objects back into array, and use slice to limit the number of items
    ns = ns.map((x) => ({ x, sval: Math.random() })).sort((v1, v2) => v1.sval - v2.sval).map((x) => x.x).slice(0, mnodes)
    const gentree = (low, high) => {
        if (low > high) return
        
        let mid = Math.floor((low + high)/2)

        let root = new TreeNode(ns[mid])

        if (low === high) return root

        root.children[0] = gentree(low, mid - 1)
        root.children[1] = gentree(mid + 1, high)

        return root
    }
    
    return gentree(0, ns.length - 1)
}

function renderTree(root) {
    if (!root) return
    
    let nodes = []
    let links = []
    let size = 40
    let leveldiff = size * 2
    let maxlevel = -1
    let nodeMap = {}

    // get space needed per node and level info
    function helper(node, level, parent) {
        let n = {
            id: node.val,
            label: node.val,
            y: -level * leveldiff
        }
        nodeMap[n.id] = n
        let space = 0
        for (const x of node.children) {
            if (!x) {
                space += size
                continue
            }
            let s = helper(x, level + 1, node)
            space += (s === 0 ? size : s)
        }
        node.space = space
        node.level = level

        nodes.push(n)
        if (parent) links.push({
            source: parent.val,
            target: node.val
        })

        maxlevel = Math.max(level, maxlevel)
        return space
    }

    function second(node, offset) {
        nodeMap[node.val].x = offset
        nodeMap[node.val].y = nodeMap[node.val].y + (maxlevel * leveldiff)/2

        let space = node.space
        let place = offset - space / node.children.length

        for (let x of node.children) {
            if (!x) {
                place = place + space
                continue
            }
            second(x, place)
            place = place + space
            space -= x.space/2
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
    
    let [m, o] = document.querySelectorAll(".head-but.selected")
    if (mode !== m.id) {
        if (mode === "rand") currentTree = genPerfectBinTree(Number(slider).value)
        else currentTree = genRandTree(Number(slider).value)
    }
    mode =  m.id
    order = o.id

    aid += 1

    renderer.clearExtra()
    
    renderer.setCenter(renderer.getFixedCenter())
    renderer.initData(renderTree(currentTree))
}

function searchFor(id, tree) {
    let inst = []
    if (mode === "bin") traversers[mode](tree, id, inst)
    else traversers[mode][order](tree, id, inst)

    return inst
}

async function playAni(inst) {
    if (ani) return
    ani = true
    console.log(inst)
    async function delay(ms) {
        return new Promise((res) => {setTimeout(res, ms)})
    }

    aid += 1
    let thisi = aid

    let hnodes = renderer.getHighlight()

    for (const item of inst) {
        if (aid !== thisi) break
        let d = 10000/Math.max(0, renderer.getNcount() - 2)
        let { flag, id, res } = item

        let node = renderer.getNode(id)

        switch(flag) {
            case "visited":
                hnodes.clear()
                hnodes.add(id)
                node.visited = true
                break;
            case "returned":
                d = 0
                renderer.addText(id, String(res))
                break;
            case "traversed":
                d = 0
                node.traversed = true
                break;
            default:
                break;
        }

        await delay(d)
    }
    hnodes.clear()
    ani = false
}

function loadEls() {
    graphEl = document.getElementById("graph")
    slider = document.getElementById("slider")
    searchEl = document.getElementById("searchnum")

    let searchBut = document.getElementById("searchBut")
    let nodelabel = document.getElementById("nodelabel")

    let perf = genPerfectBinTree()
    currentTree = perf
    let rendered = renderTree(perf)
    renderer = nodeRender(graphEl)
    renderer.initData(rendered)

    mode = "bin"
    order = "in"

    aid = 0

    searchEl.value = genRand(1, 16)

    slider.addEventListener("input", (event) => {
        renderer.clearExtra()
        nodelabel.innerHTML = "Number of nodes: " + slider.value

        if (mode === "bin") currentTree = genPerfectBinTree(Number(slider.value))
        else currentTree = genRandTree(Number(slider.value))

        renderer.initData(renderTree(currentTree))
    })
    searchBut.addEventListener("click", (event) => {
        renderer.clearExtra()
        let s = searchFor(Number(searchEl.value), currentTree)
        playAni(s)
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