var graphEl, slider, searchEl, mode, order, searched, currentTree, ani, renderer, aid, options, optionsBut, treeType, traverseType, currentInst, labels, display

const colorScheme = ["#E63946", "#1D3557", "#A8DADC", "#F1FAEE"]
const keysExp = /(Backspace)|(Escape)|(Control)|\s/

const traversers = {
    "bin": function (node, val, inst) {
        const helper = (node, val, inst) => {
            if (!node) return false
            inst.push({ flag: "traversed", id: node.val })
            inst.push({ flag: "visited", id: node.val })
            let res = val === node.val
            if (val < node.val && !res) res = helper(node.children[0], val, inst)
            if (val > node.val && !res) res = helper(node.children[1], val, inst)
            inst.push({ flag: "returned", id: node.val, res: true })
            return res
        }
        return helper(node, val, inst)
    },
    "gen": {
        "In": function (node, val, inst) {
            const helper = (node, val, inst) => {
                if (!node) return false
                inst.push({ flag: "traversed", id: node.val })

                let res = false
                let i = 0
                let vs = false

                for (const x of node.children) {
                    let r = helper(x, val, inst)
                    i++
                    if (!vs && i >= node.children.length / 2) {
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
                if (node.children.length < 1) {
                    res = node.val === val
                    inst.push({ flag: "visited", id: node.val })
                }
                inst.push({ flag: "returned", id: node.val, res })
                return res
            }

            return helper(node, val, inst)
        },
        "Pre": function (node, val, inst) {
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
        "Post": function (node, val, inst) {
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
        "Level": function (node, val, inst) {
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
                for (const x of node.children) {
                    if (x) q.push(x)
                }
            }
            return res
        }
    }
}

const txtmap = {
    "bin": "Perfect Binary",
    "gen": "Random Binary",
    "In": "In order",
    "Pre": "Preorder",
    "Post": "Postorder",
    "Level": "Level order",
}

function genPerfectBinTree(mnodes = 15) {
    // [1, 2, 3, 4, ..mnodes]
    let ns = Array(mnodes).fill(1).map((x, y) => x + y)

    const gentree = (low, high) => {
        if (low > high) return

        let mid = Math.floor((low + high) / 2)

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

    for (let i = index; i < arr.length; i++) arr[i] = arr[i + 1]

    arr.pop()
}

// change to real random tree not just values
function genRandTree(mnodes = 15) {
    let ns = Array(mnodes).fill(1)
    // constantly increasing unique random values
    for (let i = 1; i < ns.length; i++) ns[i] = ns[i - 1] + genRand(1, 10)

    // assign a random "value" to each element, sort by that random element, then destructure objects back into array, and use slice to limit the number of items
    ns = ns.map((x) => ({ x, sval: Math.random() })).sort((v1, v2) => v1.sval - v2.sval).map((x) => x.x).slice(0, mnodes)
    const gentree = (low, high) => {
        if (low > high) return

        let mid = Math.floor((low + high) / 2)

        let root = new TreeNode(ns[mid])

        if (low === high) return root

        root.children[0] = gentree(low, mid - 1)
        root.children[1] = gentree(mid + 1, high)

        return root
    }

    return gentree(0, ns.length - 1)
}

function genRand(r1, r2) {
    let diff = r2 - r1
    return Math.floor(diff * Math.random() + r1)
}

function searchFor(id, tree) {
    let inst = []

    if (mode === "bin") traversers[mode](tree, id, inst)
    else traversers[mode][order](tree, id, inst)

    currentInst = inst

    return inst
}

async function playAni(inst) {
    if (ani) return
    ani = true

    async function delay(ms) {
        return new Promise((res) => { setTimeout(res, ms) })
    }

    aid += 1
    const thisi = aid

    renderer.clearExtra()
    let hnodes = renderer.getHighlight()
    graphEl.style.cursor = "initial"
    renderer.pauseEvents(true)

    const first = inst[0] ?? null

    for (const item of inst) {
        if (aid !== thisi) break
        let d = Math.max(1000 - inst.length * 6, 20)
        let { flag, id, res } = item

        let node = renderer.getNode(id)

        switch (flag) {
            case "visited":
                hnodes.clear()
                hnodes.add(id)
                node.visited = true
                break;
            case "returned":
                d = 0
                if (first.id !== id) renderer.addText(id, String(res))
                else {
                    let { x, y } = renderer.getNode(id)
                    console.log(x, y)
                    renderer.drawStaticText([x, y + renderer.getNodeSize() * 1.75], String(res))
                }
                break;
            case "traversed":
                d = 0
                node.traversed = true
                break;
            default:
                break;
        }

        if (d > 0) await delay(d)
    }
    if (aid !== thisi) return
    hnodes.clear()
    renderer.pauseEvents(false)
    ani = false
}

function optVisible(vis) {
    if (!options) return
    if (vis) options.classList.remove("hidden")
    else options.classList.add("hidden")
}

function dropdown(target, ...items) {
    let dp = document.createElement("div")
    dp.className = "dropdown"

    let trigger = document.createElement("button")
    trigger.className = "bt btn-outline-primary dropdown-toggle"
    trigger.type = "button"
    trigger.setAttribute("data-toggle", "dropdown")
    trigger.setAttribute("aria-haspopup", "true")
    trigger.setAttribute("aria-expanded", "false")
    dp.appendChild(trigger)

    let menu = document.createElement("button")
    menu.className = "dropdown-menu"
    menu.setAttribute("aria-labelledby", "dropdownMenuButton")
    dp.appendChild(menu)

    let selection = "Select item..."
    trigger.innerHTML = selection

    let onupdate

    function update() {
        if (onupdate) onupdate(selection)
        menu.innerHTML = ""

        items.forEach(x => {
            if (x === selection) return
            let item = document.createElement("a")
            item.className = "dropdown-item"
            item.innerHTML = x

            item.addEventListener("click", (event) => {
                select(x)
            })

            menu.appendChild(item)
        })
    }

    function select(opt) {
        selection = opt
        trigger.innerHTML = selection
        update()
    }

    function getSel() {
        return selection
    }

    function onUpdate(func) {
        onupdate = func
    }

    function visible(state) {
        target.className.add("hidden")
        if (state) target.className.remove("hidden")
    }

    function disabled(state) {
        trigger.disabled = state
    }

    trigger.addEventListener("click", (event) => {
        update()
    })

    update()

    target.appendChild(dp)

    return {
        select,
        getSel,
        onUpdate,
        visible,
        disabled
    }
}

function loadEls() {
    const treetypes = ["Perfect Binary", "Random Binary"]
    const traversetypes = ["In", "Post", "Pre", "Level"]

    graphEl = document.getElementById("graph")
    slider = document.getElementById("slider")
    searchEl = document.getElementById("searchnum")
    optionsBut = document.getElementById("options")
    options = document.getElementsByClassName("options")[0]
    labels = document.getElementById("returns")
    display = document.getElementById("display")

    mode = "bin"
    order = "In"

    traverseType = document.getElementById("traverseType")
    traverseType = dropdown(traverseType, ...traversetypes)
    traverseType.select(traversetypes[0])

    const typeupdater = (selected) => {
        order = selected
        display.innerHTML = `${txtmap[mode]} (${txtmap[order] ?? "Binary"})`
    }
    traverseType.onUpdate(typeupdater)

    treeType = document.getElementById("treeType")
    treeType = dropdown(treeType, ...treetypes)
    treeType.select(treetypes[0])

    const treeupdater = (selected) => {
        if (selected === "Perfect Binary") {
            traverseType.disabled(true)
            traverseType.select("Binary")
            if (mode === "bin") return
            currentTree = genPerfectBinTree(Number(slider.value))
            renderer.initData({ root: currentTree})
            mode = "bin"
        }
        else {
            traverseType.disabled(false)
            traverseType.select(traversetypes[0])
            if (mode === "gen") return
            currentTree = genRandTree(Number(slider.value))
            renderer.initData({ root: currentTree })
            mode = "gen"
        }
        display.innerHTML = `${txtmap[mode]} (${txtmap[order] ?? "Binary"})`
    }

    treeType.onUpdate(treeupdater)
    treeupdater("Perfect Binary")

    let searchBut = document.getElementById("searchBut")
    let nodelabel = document.getElementById("nodelabel")

    let perf = genPerfectBinTree()
    currentTree = perf
    // let rendered = renderTree(perf)
    renderer = nodeRender(graphEl)
    renderer.initData({ root: perf })
    let highlights = renderer.getHighlight()
    renderer.onHoverNode((node) => {
        highlights.clear()
        if (node) highlights.add(node.id)
        graphEl.style.cursor = node ? "pointer" : "default"
    })
    renderer.onClickNode((node) => {
        if (!node) return
        const inst = searchFor(node.id, currentTree)
        if (inst.length === 0) return
        playAni(inst)
    })

    labels.addEventListener("click", _ => {
        renderer.showLabels(labels.checked)
    })

    aid = 0

    searchEl.value = genRand(1, 16)

    optionsBut.addEventListener("click", (event) => {
        if (options.classList.contains("hidden")) optVisible(true)
        else optVisible(false)
    })
    slider.addEventListener("input", (event) => {
        renderer.clearExtra()
        nodelabel.innerHTML = "Number of nodes: " + slider.value

        if (mode === "bin") currentTree = genPerfectBinTree(Number(slider.value))
        else currentTree = genRandTree(Number(slider.value))

        renderer.initData({ root: currentTree})
    })
    searchBut.addEventListener("click", (event) => {
        renderer.clearExtra()
        let s = searchFor(Number(searchEl.value), currentTree)
        playAni(s)
    })
    searchEl.addEventListener("keypress", event => {
        if (event.key === "Enter") {
            renderer.clearExtra()
            let s = searchFor(Number(searchEl.value), currentTree)
            playAni(s)
        }
    })
    window.addEventListener("mousedown", (event) => {
        for (x of event.composedPath()) { if (x === options) return }
        if (event.target === optionsBut) return
        optVisible(false)
    })

    nodelabel.innerHTML = "Number of nodes: " + slider.value
}

function log(text, error, tm = 1000) {
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