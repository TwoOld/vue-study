# Vue 源码学习

入口

- src\platforms\web\entry-runtime-with-compiler.js 扩展\$mount
- src\platforms\web\runtime\index.js 实现\$mount
- src\core\index.js initGlobalAPI 实现全局 api
- src\core\instance\index.js Vue 构造函数

```js
// 实现_init
initMixin(vue)

// ---------------------- src\core\instance\init.js ----------------------

// 初始化
vm._self = vm
initLifecycle(vm)
initEvents(vm)
initRender(vm)
callHook(vm, 'beforeCreate')
initInjections(vm) // resolve injections before data/props
initState(vm)
initProvide(vm) // resolve provide after data/props
callHook(vm, 'created')
```

```js
// 把组件实例里面用到的常用属性初始化，比如$parent/$root/\$children
initLifecycle(vm)

// ---------------------- src\core\instance\lifecycle.js ----------------------

vm.$parent = parent
vm.$root = parent ? parent.$root : vm

vm.$children = []
vm.$refs = {}

vm._watcher = null
vm._inactive = null
vm._directInactive = false
vm._isMounted = false
vm._isDestroyed = false
vm._isBeingDestroyed = false
```

```js
// 父组件传递的需要处理的事件 ps:事件的监听者实际是子组件
initEvents(Vue)

// ---------------------- src\core\instance\events.js ----------------------

vm._events = Object.create(null)
vm._hasHookEvent = false
// init parent attached events
const listeners = vm.$options._parentListeners
if (listeners) {
  updateComponentListeners(vm, listeners)
}
```

```js
// $slots $scopedSlots 初始化
// $createElement函数声明
// $attrs/$listeners 响应化
initRender(Vue)

// ---------------------- src\core\instance\render.js ----------------------

vm._vnode = null // the root of the child tree
vm._staticTrees = null // v-once cached trees
const options = vm.$options
const parentVnode = (vm.$vnode = options._parentVnode) // the placeholder node in parent tree
const renderContext = parentVnode && parentVnode.context
// 处理插槽
vm.$slots = resolveSlots(options._renderChildren, renderContext)
vm.$scopedSlots = emptyObject
// bind the createElement fn to this instance
// so that we get proper render context inside it.
// args order: tag, data, children, normalizationType, alwaysNormalize
// internal version is used by render functions compiled from templates
// 把createElement函数挂载到当前组件上，编译器使用
vm._c = (a, b, c, d) => createElement(vm, a, b, c, d, false)
// normalization is always applied for the public version, used in
// user-written render functions.
// 用户编写的渲染函数使用这个
vm.$createElement = (a, b, c, d) => createElement(vm, a, b, c, d, true)

// $attrs & $listeners are exposed for easier HOC creation.
// they need to be reactive so that HOCs using them are always updated
const parentData = parentVnode && parentVnode.data

/* istanbul ignore else */
if (process.env.NODE_ENV !== 'production') {
} else {
  defineReactive(
    vm,
    '$attrs',
    (parentData && parentData.attrs) || emptyObject,
    null,
    true
  )
  defineReactive(
    vm,
    '$listeners',
    options._parentListeners || emptyObject,
    null,
    true
  )
}
```

```js
// src\core\instance\inject.js
// Inject 响应化
initInjections(Vue)
```

```js
// 执行各种数据状态初始化，包括数据响应化等
initState(Vue)

// ---------------------- src\core\instance\state.js ----------------------

vm._watchers = []
// 初始化所有属性
const opts = vm.$options
if (opts.props) initProps(vm, opts.props)
// 初始化回调函数
if (opts.methods) initMethods(vm, opts.methods)
// data数据响应化
if (opts.data) {
  initData(vm)
} else {
  observe((vm._data = {}), true /* asRootData */)
}
//   computed初始化
if (opts.computed) initComputed(vm, opts.computed)
//   watch初始化
if (opts.watch && opts.watch !== nativeWatch) {
  initWatch(vm, opts.watch)
}
```

```js
// src\core\instance\inject.js
// Provide 注入
initProvide(Vue)
```

```js
// 定义只读属性$data和$props
// 定义$set和$delete
// 定义$watch
stateMixin(Vue)

// ---------------------- src\core\instance\state.js ----------------------

const dataDef = {}
dataDef.get = function() {
  return this._data
}
const propsDef = {}
propsDef.get = function() {
  return this._props
}

Object.defineProperty(Vue.prototype, '$data', dataDef)
Object.defineProperty(Vue.prototype, '$props', propsDef)

Vue.prototype.$set = set
Vue.prototype.$delete = del

Vue.prototype.$watch = function(
  expOrFn: string | Function,
  cb: any,
  options?: Object
): Function {}
```

```js
// 实现事件相关实例api：$on,$emit,$off,$once
eventsMixin(Vue)

// ---------------------- src\core\instance\events.js ----------------------

const hookRE = /^hook:/
Vue.prototype.$on = function(
  event: string | Array<string>,
  fn: Function
): Component {}

Vue.prototype.$once = function(event: string, fn: Function): Component {}

Vue.prototype.$off = function(
  event?: string | Array<string>,
  fn?: Function
): Component {}

Vue.prototype.$emit = function(event: string): Component {}
```

```js
// 实现组件生命周期相关的三个核心实例api：_update,$forceUpdate,$destroy
lifecycleMixin(Vue)

// ---------------------- src\core\instance\lifecycle.js ----------------------

Vue.prototype._update = function(vnode: VNode, hydrating?: boolean) {
}

Vue.prototype.$forceUpdate = function() {
}

Vue.prototype.$destroy = function() {
}
```

# 虚拟 DOM

虚拟 DOM（Virtual DOM）是对 DOM 的 JS 抽象表示，它们是 JS 对象，能够描述 DOM 结构和关系。

![](https://upload-images.jianshu.io/upload_images/16753277-758501473d389e72.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

# 优点

虚拟 DOM 轻量、快速，当他们发生变化时通过新旧虚拟 DOM 比对可以得到最小 DOM 操作量，从而提升性能和用户体验。本质上时使用 JavaScript 运算成本替换 DOM 操作的执行成本，前者运算速度要比后者快得多，这样做很划算，因此才会有虚拟 DOM。

Vue 1.0 中有细粒度的数据变化侦测，每一个属性对应一个 Watcher 实例，因此它是不需要虚拟 DOM 的，但是细粒度造成了大量开销，这对于大型项目来说是不可接受的。因此，Vue 2.0 选择了中等粒度的解决方案，每一个组件对应一个 Watcher 实例，这样状态变化时只能通知到组件，再通过引入虚拟 DOM 去进行对比和渲染。

# 实现

# 虚拟 DOM 整体流程

- mountComponent
  > vdom 树首页生成、渲染发生在 mountComponent 中，core/instance/lifecycle.js
- \_render
  > \_render 生成虚拟 dom，core/instance/render.js
- createElement
  > 真正用来创建 vnode 的函数是 createElement，src\core\vdom\create-element.js
- createComponent
  > 用于创建组件并返回 VNode，src\core\vdom\create-component.js
- VNode
  > render 返回的一个 VNode 实例，它的 children 还是 VNode，最终构成一个树，就是虚拟 DOM 树， src\core\vdom\vnode.js
  > VNode 对象：共有 6 种类型：元素、组件、函数式组件、文本、注释和克隆节点
- \_update
  > update 负责更新 dom，核心是调用 patch ，src\core\instance\lifecycle.js
- \_\_patch\_\_
  > patch 是在平台特有代码中指定的， src/platforms/web/runtime/index.js
  > Vue.prototype. patch = inBrowser ? patch : noop
- patch
  > 实际就是 createPatchFunction 的返回值，传递 nodeOps 和 modules，这里主要是为了跨平台
  > export const patch: Function = createPatchFunction({ nodeOps, modules })
- nodeOps
  > src\platforms\web\runtime\node-ops.js 定义各种原生 dom 基础操作方法
- modules
  > modules 定义了虚拟 dom 更新 => dom 操作转换方法

```js
// VNode对象共有6种类型：元素、组件、函数式组件、文本、注释和克隆节点
// 静态节点可作为克隆节点，因为不会有变化 <h1>Hello</h1>
export default class VNode {
  tag: string | void; // 节点标签，文本及注释没有
  data: VNodeData | void; // 节点数据，文本及注释没有
  children: ?Array<VNode>; // 子元素
  text: string | void; // 文本及注释的内容，元素文本
  elm: Node | void;
  ns: string | void;
  context: Component | void; // rendered in this component's scope
  key: string | number | void;
  componentOptions: VNodeComponentOptions | void;
  componentInstance: Component | void; // component instance 组件实例
  parent: VNode | void; // component placeholder node
```

# patch

Vue 使用的 patching 算法基于 Snabbdom

patch 将新老 VNode 节点进行比对（diff 算法），然后根据比较结果进行最小量 DOM 操作，而不是将整个视图根据新的 VNode 重绘。

那么 patch 如何工作的呢？

首先说一下 patch 的核心 diff 算法：通过同层的树节点进行比较而非对树进行逐层搜索遍历的方式，所以时间复杂度只有 O(n)，是一种相当高效的算法。

同层级只做三件事：增删改。具体规则是：new VNode 不存在就删；old VNode 不存在就增；都存在就比较类型，类型不同直接替换、类型相同执行更新

```js
return function patch(oldVnode, vnode, hydrating, removeOnly) {
  // vnode新节点不存在就删
  if (isUndef(vnode)) {
    if (isDef(oldVnode)) invokeDestroyHook(oldVnode)
    return
  }

  let isInitialPatch = false
  const insertedVnodeQueue = []

  if (isUndef(oldVnode)) {
    // oldVnode不存在则创建新节点
    // empty mount (likely as component), create new root element
    isInitialPatch = true
    createElm(vnode, insertedVnodeQueue)
  } else {
    // 标记oldVnode是否有nodeType，true为一个DOM元素
    const isRealElement = isDef(oldVnode.nodeType)
    if (!isRealElement && sameVnode(oldVnode, vnode)) {
      // patch existing root node
      // 是同一个节点的时候做更新
      patchVnode(oldVnode, vnode, insertedVnodeQueue, null, null, removeOnly)
    } else {
      // 带编译器版本才会出现的情况：传了DOM元素进来
      if (isRealElement) {
        // mounting to a real element
        // create an empty node and replace it
        // 挂载一个真实元素，创建一个空的VNode节点替换它
        oldVnode = emptyNodeAt(oldVnode)
      }

      // replacing existing element
      // 取代现有元素
      const oldElm = oldVnode.elm
      const parentElm = nodeOps.parentNode(oldElm)

      // create new node

      // update parent placeholder node element, recursively

      // destroy old node
      // 移除老节点
      if (isDef(parentElm)) {
        removeVnodes([oldVnode], 0, 0)
      } else if (isDef(oldVnode.tag)) {
        // 调用destroy钩子
        invokeDestroyHook(oldVnode)
      }
    }
  }

  // 调用insert钩子
  invokeInsertHook(vnode, insertedVnodeQueue, isInitialPatch)
  return vnode.elm
}
```

# patchVnode

两个 VNode 类型相同，就执行更新操作，包括三种类型操作：属性更新 PROPS、文本更新 TEXT、子节点更新 REORDER

patchVnode 具体规则如下：

- 如果新旧 VNode 都是静态的，同时它们的 key 相同（代表同一节点），并且新的 VNode 是 clone 或者是标记了 v-once，那么只需要替换 elm 以及 componentInstance 即可
- 新老节点均有 children 子节点，则对子节点进行 diff 操作，调用 updateChildren，这个 updateChildren 也是 diff 的核心
- 如果老节点没有子节点而新节点存在子节点，先清空老节点 DOM 的文本内容，然后为当前 DOM 节点加入子节点
- 当新节点没有子节点而老节点有子节点的时候，则移除该 DOM 节点的所有子节点
- 当新老节点都无子节点的时候，只是文本的替换

```js
function patchVnode(
  oldVnode,
  vnode,
  insertedVnodeQueue,
  ownerArray,
  index,
  removeOnly
) {
  // 两个VNode节点相同则直接返回
  if (oldVnode === vnode) {
    return
  }

  if (isDef(vnode.elm) && isDef(ownerArray)) {
    // clone reused vnode
    vnode = ownerArray[index] = cloneVNode(vnode)
  }

  const elm = (vnode.elm = oldVnode.elm)

  if (isTrue(oldVnode.isAsyncPlaceholder)) {
    if (isDef(vnode.asyncFactory.resolved)) {
      hydrate(oldVnode.elm, vnode, insertedVnodeQueue)
    } else {
      vnode.isAsyncPlaceholder = true
    }
    return
  }

  // reuse element for static trees.
  // note we only do this if the vnode is cloned -
  // if the new node is not cloned it means the render functions have been
  // reset by the hot-reload-api and we need to do a proper re-render.
  // 如果新旧VNode都是静态的，同时它们的key相同（代表同一节点）
  // 并且新的VNode是clone或者是标记了once（标记v-once属性，只渲染一次）
  // 那么只需要替换elm以及componentInstance即可
  if (
    isTrue(vnode.isStatic) &&
    isTrue(oldVnode.isStatic) &&
    vnode.key === oldVnode.key &&
    (isTrue(vnode.isCloned) || isTrue(vnode.isOnce))
  ) {
    vnode.componentInstance = oldVnode.componentInstance
    return
  }

  // 如果存在data.hook.prepatch则要先执行
  let i
  const data = vnode.data
  if (isDef(data) && isDef((i = data.hook)) && isDef((i = i.prepatch))) {
    i(oldVnode, vnode)
  }

  const oldCh = oldVnode.children
  const ch = vnode.children
  // 执行属性、事件、样式等等更新操作
  if (isDef(data) && isPatchable(vnode)) {
    for (i = 0; i < cbs.update.length; ++i) cbs.update[i](oldVnode, vnode)
    if (isDef((i = data.hook)) && isDef((i = i.update))) i(oldVnode, vnode)
  }

  // 开始判断children的各种情况
  // VNode节点没有text文本时
  if (isUndef(vnode.text)) {
    // 新老节点均有children子节点，则对子节点进行diff操作，调用updateChildren
    if (isDef(oldCh) && isDef(ch)) {
      if (oldCh !== ch)
        updateChildren(elm, oldCh, ch, insertedVnodeQueue, removeOnly)
    } else if (isDef(ch)) {
      if (process.env.NODE_ENV !== 'production') {
        checkDuplicateKeys(ch)
      }
      // 如果老节点没有子节点而新节点存在子节点，清空elm的文本内容，然后为当前节点加入子节点
      if (isDef(oldVnode.text)) nodeOps.setTextContent(elm, '')
      addVnodes(elm, null, ch, 0, ch.length - 1, insertedVnodeQueue)
    } else if (isDef(oldCh)) {
      // 如果新节点没有子节点而老节点存在子节点，则移除所有elm的子节点
      removeVnodes(oldCh, 0, oldCh.length - 1)
    } else if (isDef(oldVnode.text)) {
      // 当新老节点都不存在子节点，则在此分支中清空elm文本
      nodeOps.setTextContent(elm, '')
    }
    // VNode节点有text文本时
  } else if (oldVnode.text !== vnode.text) {
    // 新老节点text不一样时，直接替换这段文本
    nodeOps.setTextContent(elm, vnode.text)
  }
  if (isDef(data)) {
    if (isDef((i = data.hook)) && isDef((i = i.postpatch))) i(oldVnode, vnode)
  }
}
```

# updateChildren

updateChildren 主要作用是比对新旧两个 VNode 的 children 得出具体 DOM 操作。执行一个双循环是传统方式，vue 中针对 web 场景特点做了特别的算法优化：
![](https://upload-images.jianshu.io/upload_images/16753277-6c34183005864680.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)
在新老两组 VNode 节点的左右头尾两侧都有一个变量标记，在遍历过程中这几个变量都会向中间靠拢。当
oldStartIdx > oldEndIdx 或者 newStartIdx > newEndIdx 时结束循环。

下面是遍历规则：

首先，oldStartVnode、oldEndVnode 与 newStartVnode、newEndVnode 两两交叉比较，共有 4 种比较方法。
当 oldStartVnode 和 newStartVnode 或者 oldEndVnode 和 newEndVnode 满足 sameVnode，直接将该 VNode 节 点进行 patchVnode 即可，不需再遍历就完成了一次循环。如下图，

![](https://upload-images.jianshu.io/upload_images/16753277-d218ca43c15357aa.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

如果 oldStartVnode 与 newEndVnode 满足 sameVnode。说明 oldStartVnode 已经跑到了 oldEndVnode 后面去了， 进行 patchVnode 的同时还需要将真实 DOM 节点移动到 oldEndVnode 的后面

![](https://upload-images.jianshu.io/upload_images/16753277-c20339daca2f3a47.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

如果 oldEndVnode 与 newStartVnode 满足 sameVnode，说明 oldEndVnode 跑到了 oldStartVnode 的前面，进行
patchVnode 的同时要将 oldEndVnode 对应 DOM 移动到 oldStartVnode 对应 DOM 的前面。

![](https://upload-images.jianshu.io/upload_images/16753277-79086624d5c4b6d4.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

如果以上情况均不符合，则在 old VNode 中找与 newStartVnode 满足 sameVnode 的 vnodeToMove，若存在执行
patchVnode，同时将 vnodeToMove 对应 DOM 移动到 oldStartVnode 对应的 DOM 的前面。

![](https://upload-images.jianshu.io/upload_images/16753277-30e41d7d6b33ca0d.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

当然也有可能 newStartVnode 在 old VNode 节点中找不到一致的 key，或者是即便 key 相同却不是 sameVnode，这 个时候会调用 createElm 创建一个新的 DOM 节点。

![](https://upload-images.jianshu.io/upload_images/16753277-f469bf4d48ec878e.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

至此循环结束，但是我们还需要处理剩下的节点。

当结束时 oldStartIdx > oldEndIdx，这个时候旧的 VNode 节点已经遍历完了，但是新的节点还没有。说明了新的
VNode 节点实际上比老的 VNode 节点多，需要将剩下的 VNode 对应的 DOM 插入到真实 DOM 中，此时调用
addVnodes。

![](https://upload-images.jianshu.io/upload_images/16753277-41ad43d5e61abce7.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

但是，当结束时 newStartIdx > newEndIdx 时，说明新的 VNode 节点已经遍历完了，但是老的节点还有剩余，需要 从文档中删 的节点删除。

![](https://upload-images.jianshu.io/upload_images/16753277-5f4690c86b2d4338.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

```js
function updateChildren(
  parentElm,
  oldCh,
  newCh,
  insertedVnodeQueue,
  removeOnly
) {
  let oldStartIdx = 0
  let newStartIdx = 0
  let oldEndIdx = oldCh.length - 1
  let oldStartVnode = oldCh[0]
  let oldEndVnode = oldCh[oldEndIdx]
  let newEndIdx = newCh.length - 1
  let newStartVnode = newCh[0]
  let newEndVnode = newCh[newEndIdx]
  let oldKeyToIdx, idxInOld, vnodeToMove, refElm

  // removeOnly is a special flag used only by <transition-group>
  // to ensure removed elements stay in correct relative positions
  // during leaving transitions
  // 确保移除元素在过度动画过程中待在正确的相对位置，仅用于<transition-group>
  const canMove = !removeOnly

  if (process.env.NODE_ENV !== 'production') {
    checkDuplicateKeys(newCh)
  }

  // 循环条件：任意起始索引超过结束索引就结束
  while (oldStartIdx <= oldEndIdx && newStartIdx <= newEndIdx) {
    if (isUndef(oldStartVnode)) {
      oldStartVnode = oldCh[++oldStartIdx] // Vnode has been moved left
    } else if (isUndef(oldEndVnode)) {
      oldEndVnode = oldCh[--oldEndIdx]
    } else if (sameVnode(oldStartVnode, newStartVnode)) {
      // 分别比较oldCh以及newCh的两头节点4种情况，判定为同一个VNode，则直接patchVnode即可
      patchVnode(
        oldStartVnode,
        newStartVnode,
        insertedVnodeQueue,
        newCh,
        newStartIdx
      )
      oldStartVnode = oldCh[++oldStartIdx]
      newStartVnode = newCh[++newStartIdx]
    } else if (sameVnode(oldEndVnode, newEndVnode)) {
      patchVnode(oldEndVnode, newEndVnode, insertedVnodeQueue, newCh, newEndIdx)
      oldEndVnode = oldCh[--oldEndIdx]
      newEndVnode = newCh[--newEndIdx]
    } else if (sameVnode(oldStartVnode, newEndVnode)) {
      // Vnode moved right
      patchVnode(
        oldStartVnode,
        newEndVnode,
        insertedVnodeQueue,
        newCh,
        newEndIdx
      )
      canMove &&
        nodeOps.insertBefore(
          parentElm,
          oldStartVnode.elm,
          nodeOps.nextSibling(oldEndVnode.elm)
        )
      oldStartVnode = oldCh[++oldStartIdx]
      newEndVnode = newCh[--newEndIdx]
    } else if (sameVnode(oldEndVnode, newStartVnode)) {
      // Vnode moved left
      patchVnode(
        oldEndVnode,
        newStartVnode,
        insertedVnodeQueue,
        newCh,
        newStartIdx
      )
      canMove &&
        nodeOps.insertBefore(parentElm, oldEndVnode.elm, oldStartVnode.elm)
      oldEndVnode = oldCh[--oldEndIdx]
      newStartVnode = newCh[++newStartIdx]
    } else {
      // 生成一个哈希表，key是旧VNode的key，值是该VNode在旧VNode中索引
      if (isUndef(oldKeyToIdx))
        oldKeyToIdx = createKeyToOldIdx(oldCh, oldStartIdx, oldEndIdx)
      // 如果newStartVnode存在key并且这个key在oldVnode中能找到则返回这个节点的索引
      idxInOld = isDef(newStartVnode.key)
        ? oldKeyToIdx[newStartVnode.key]
        : findIdxInOld(newStartVnode, oldCh, oldStartIdx, oldEndIdx)
      if (isUndef(idxInOld)) {
        // New element
        // 没有key或者是该key没有在老节点中找到则创建一个新的节点
        createElm(
          newStartVnode,
          insertedVnodeQueue,
          parentElm,
          oldStartVnode.elm,
          false,
          newCh,
          newStartIdx
        )
      } else {
        // 获取同key的老节点
        vnodeToMove = oldCh[idxInOld]
        if (sameVnode(vnodeToMove, newStartVnode)) {
          // 如果新VNode与得到的有相同key的节点是同一个VNode则进行patchVnode
          patchVnode(
            vnodeToMove,
            newStartVnode,
            insertedVnodeQueue,
            newCh,
            newStartIdx
          )
          // 因为已经patchVnode进去了，所以将这个老节点赋值undefined，
          // 之后如果还有新节点与该节点 key相同可以检测出来提示已有重复的key
          oldCh[idxInOld] = undefined
          // 当有标识位canMove实可以直接插入oldStartVnode对应的真实DOM节点前面
          canMove &&
            nodeOps.insertBefore(parentElm, vnodeToMove.elm, oldStartVnode.elm)
        } else {
          // same key but different element. treat as new element
          // 当新的VNode与找到的同样key的VNode不是sameVNode的时候
          //（比如说tag不一样或者是有不一样 type的input标签），创建一个新的节点
          createElm(
            newStartVnode,
            insertedVnodeQueue,
            parentElm,
            oldStartVnode.elm,
            false,
            newCh,
            newStartIdx
          )
        }
      }
      newStartVnode = newCh[++newStartIdx]
    }
  }
  if (oldStartIdx > oldEndIdx) {
    // 全部比较完成以后，发现oldStartIdx > oldEndIdx的话，说明老节点已经遍历完了，
    // 新节点比老节点 多，所以这时候多出来的新节点需要一个一个创建出来加入到真实DOM中
    refElm = isUndef(newCh[newEndIdx + 1]) ? null : newCh[newEndIdx + 1].elm
    addVnodes(
      parentElm,
      refElm,
      newCh,
      newStartIdx,
      newEndIdx,
      insertedVnodeQueue
    )
  } else if (newStartIdx > newEndIdx) {
    // 如果全部比较完成以后发现newStartIdx > newEndIdx，
    // 则说明新节点已经遍历完了，老节点多余新节 点
    // 这个时候需要将多余的老节点从真实DOM中移除
    removeVnodes(oldCh, oldStartIdx, oldEndIdx)
  }
}
```

# 属性相关 dom 操作

原理是将属性相关 dom 操作按 vdom hooks 归类，在 patchVnode 时一起执行

```js
const hooks = ['create', 'activate', 'update', 'remove', 'destroy']
export function createPatchFunction(backend) {
  let i, j
  const cbs = {}

  const { modules, nodeOps } = backend

  for (i = 0; i < hooks.length; ++i) {
    cbs[hooks[i]] = []
    for (j = 0; j < modules.length; ++j) {
      if (isDef(modules[j][hooks[i]])) {
        cbs[hooks[i]].push(modules[j][hooks[i]])
      }
    }
  }

  function patchVnode(...) {
    if (isDef(data) && isPatchable(vnode)) {
      for (i = 0; i < cbs.update.length; ++i) cbs.update[i](oldVnode, vnode)
      if (isDef(i = data.hook) && isDef(i = i.update)) i(oldVnode, vnode)
    }
  }
```
