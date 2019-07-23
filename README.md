# Vue 源码学习

## 入口

src\platforms\web\entry-runtime-with-compiler.js 扩展\$mount

src\platforms\web\runtime\index.js 实现\$mount

src\core\index.js initGlobalAPI 实现全局 api

src\core\instance\index.js Vue 构造函数

```js
// Vue构造函数 new Vue()
function Vue (options) {
  this._init(options)
}

initMixin(Vue)
stateMixin(Vue)
eventsMixin(Vue)
lifecycleMixin(Vue)
renderMixin(Vue)

export default Vue
```

### initMixin(vue)

实现_init

```js

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

#### initLifecycle(vm)

把组件实例里面用到的常用属性初始化，比如$parent,$root,$children

```js
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

#### initEvents(Vue)

父组件传递的需要处理的事件 ps:事件的监听者实际是子组件

```js
// ---------------------- src\core\instance\events.js ----------------------
vm._events = Object.create(null)
vm._hasHookEvent = false
// init parent attached events
const listeners = vm.$options._parentListeners
if (listeners) {
  updateComponentListeners(vm, listeners)
}
```

#### initRender(Vue)

$slots $scopedSlots 初始化

$createElement函数声明

$attrs/$listeners 响应化

```js
// ---------------------- src\core\instance\render.js ----------------------
vm._vnode = null // the root of the child tree
vm._staticTrees = null // v-once cached trees
const options = vm.$options
const parentVnode = (vm.$vnode = options._parentVnode) // the placeholder node in parent tree
const renderContext = parentVnode && parentVnode.context
// 处理插槽
vm.$slots = resolveSlots(options._renderChildren, renderContext)
vm.$scopedSlots = emptyObject

// 把createElement函数挂载到当前组件上，编译器使用
vm._c = (a, b, c, d) => createElement(vm, a, b, c, d, false)

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

#### initInjections(Vue)

Inject 响应化

```js
// src\core\instance\inject.js
```

#### initState(Vue)

执行各种数据状态初始化，包括数据响应化等

```js
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

#### initProvide(Vue)

Provide 注入

```js
// src\core\instance\inject.js
```

### stateMixin(Vue)

定义只读属性\$data和\$props

定义\$set和\$delete

定义\$watch

```js
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

### eventsMixin(Vue)

实现事件相关实例api：\$on,\$emit,\$off,\$once

```js
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

### lifecycleMixin(Vue)

实现组件生命周期相关的三个核心实例api：_update,\$forceUpdate,\$destroy

```js
// ---------------------- src\core\instance\lifecycle.js ----------------------
Vue.prototype._update = function(vnode: VNode, hydrating?: boolean) {
  const vm: Component = this
  const prevEl = vm.$el
  const prevVnode = vm._vnode
  const restoreActiveInstance = setActiveInstance(vm)
  vm._vnode = vnode
  // Vue.prototype.__patch__ is injected in entry points
  // based on the rendering backend used.
  if (!prevVnode) {
    // initial render
    vm.$el = vm.__patch__(vm.$el, vnode, hydrating, false /* removeOnly */)
  } else {
    // updates
    vm.$el = vm.__patch__(prevVnode, vnode)
  }
}

Vue.prototype.$forceUpdate = function() {}

Vue.prototype.$destroy = function() {}
```

### renderMixin(Vue)

实现\$nextTick及_render函数

```js
// ---------------------- src\core\instance\render.js ----------------------
Vue.prototype.$nextTick = function(fn: Function) {}

Vue.prototype._render = function(): VNode {
  const vm: Component = this
  const { render, _parentVnode } = vm.$options

  if (_parentVnode) {
    vm.$scopedSlots = normalizeScopedSlots(
      _parentVnode.data.scopedSlots,
      vm.$slots,
      vm.$scopedSlots
    )
  }

  // set parent vnode. this allows render functions to have access
  // to the data on the placeholder node.
  vm.$vnode = _parentVnode
  // render self
  let vnode
  try {
    // There's no need to maintain a stack because all render fns are called
    // separately from one another. Nested component's render fns are called
    // when parent component is patched.
    currentRenderingInstance = vm
    vnode = render.call(vm._renderProxy, vm.$createElement)
  } catch (e) {
    handleError(e, vm, `render`)
    // return error render result,
    // or previous vnode to prevent render error causing blank component
    /* istanbul ignore else */
    if (process.env.NODE_ENV !== 'production' && vm.$options.renderError) {
    } else {
      vnode = vm._vnode
    }
  } finally {
    currentRenderingInstance = null
  }
  // if the returned array contains only a single node, allow it
  if (Array.isArray(vnode) && vnode.length === 1) {
    vnode = vnode[0]
  }
  // return empty vnode in case the render function errored out
  if (!(vnode instanceof VNode)) {
    if (process.env.NODE_ENV !== 'production' && Array.isArray(vnode)) {
    }
    vnode = createEmptyVNode()
  }
  // set parent
  vnode.parent = _parentVnode
  return vnode
}
```

## 数据响应式

Vue 一大特点是数据响应式，数据的变化会作用于 UI 而不用进行 DOM 操作。原理上讲，是利用了 JS 语言特性`Object.defineProperty()`，通过定义对象属性 setter 方法拦截对象属性变更，从而将数值的变化转换为 UI 的变化。

具体实现是在 Vue 初始化时，会调用 initState，它会初始化 data，props 等，这里着重关注 data 初始化。

```js
// ---------------------- src\core\instance\state.js ----------------------
export function initState(vm: Component) {
  const opts = vm.$options

  if (opts.data) {
    initData(vm) // 初始化数据
  } else {
    observe((vm._data = {}), true /* asRootData */)
  }
}
```

![](https://upload-images.jianshu.io/upload_images/16753277-d87383e36299c6fd.jpg?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

### initData()

将data数据响应化

```js
function initData(vm: Component) {
  // 获取数据
  let data = vm.$options.data
  data = vm._data = typeof data === 'function' ? getData(data, vm) : data || {}

  if (!isPlainObject(data)) {
    data = {}
    process.env.NODE_ENV !== 'production' &&
      warn(
        'data functions should return an object:\n' +
          'https://vuejs.org/v2/guide/components.html#data-Must-Be-a-Function',
        vm
      )
  }
  // 代理数据
  const keys = Object.keys(data)
  const props = vm.$options.props
  const methods = vm.$options.methods
  let i = keys.length
  while (i--) {
    const key = keys[i]
    if (process.env.NODE_ENV !== 'production') {
    }
    if (props && hasOwn(props, key)) {
    } else if (!isReserved(key)) {
      proxy(vm, `_data`, key)
    }
  }
  // 数据响应化
  observe(data, true /* asRootData */)
}
```

#### observe()

返回一个Observer实例

```js
// ---------------------- src\core\observer\index.js ----------------------
export function observe(value: any, asRootData: ?boolean): Observer | void {
  // 只对Object进行处理
  if (!isObject(value) || value instanceof VNode) {
    return
  }
  // 有则返回，没有新建
  let ob: Observer | void
  if (hasOwn(value, '__ob__') && value.__ob__ instanceof Observer) {
    ob = value.__ob__
  } else if (
    shouldObserve &&
    !isServerRendering() &&
    (Array.isArray(value) || isPlainObject(value)) &&
    Object.isExtensible(value) &&
    !value._isVue
  ) {
    ob = new Observer(value)
  }
  if (asRootData && ob) {
    ob.vmCount++
  }
  return ob
}
```

#### class Observer

根据数据类型执行对应的响应化操作

```js
export class Observer {
  value: any
  dep: Dep // 保存数组类型数据的依赖
  vmCount: number // number of vms that have this object as root $data

  constructor(value: any) {
    this.value = value
    this.dep = new Dep()
    this.vmCount = 0
    def(value, '__ob__', this) // 在getter中可以通过__ob__获取ob实例
    if (Array.isArray(value)) {
      // 数组响应化
      if (hasProto) {
        protoAugment(value, arrayMethods)
      } else {
        copyAugment(value, arrayMethods, arrayKeys)
      }
      this.observeArray(value)
    } else {
      // 对象响应化
      this.walk(value)
    }
  }

  /**
   * 遍历对象所有属性并转换为getter/setter
   */
  walk(obj: Object) {
    const keys = Object.keys(obj)
    for (let i = 0; i < keys.length; i++) {
      defineReactive(obj, keys[i])
    }
  }

  /**
   * 对数组每一项执行响应化
   */
  observeArray(items: Array<any>) {
    for (let i = 0, l = items.length; i < l; i++) {
      observe(items[i])
    }
  }
}
```

#### defineReactive()

定义对象属性的getter/setter，getter负责收集添加依赖，setter负责通知更新

```js
export function defineReactive(
  obj: Object,
  key: string,
  val: any,
  customSetter?: ?Function,
  shallow?: boolean
) {
  const dep = new Dep() // 一个key对应一个Dep实例

  const property = Object.getOwnPropertyDescriptor(obj, key)
  if (property && property.configurable === false) {
    return
  }

  const getter = property && property.get
  const setter = property && property.set
  if ((!getter || setter) && arguments.length === 2) {
    val = obj[key]
  }

  // 递归执行子对象响应化
  let childOb = !shallow && observe(val)
  // 定义当前对象getter/setter
  Object.defineProperty(obj, key, {
    enumerable: true,
    configurable: true,
    get: function reactiveGetter() {
      const value = getter ? getter.call(obj) : val
      // getter被调用时若存在依赖则追加
      if (Dep.target) {
        dep.depend()
        // 若存在子observer，则依赖也追加到子ob
        if (childOb) {
          childOb.dep.depend()
          if (Array.isArray(value)) {
            dependArray(value) // 数组需要特殊处理
          }
        }
      }
      return value
    },
    set: function reactiveSetter(newVal) {
      const value = getter ? getter.call(obj) : val
      /* eslint-disable no-self-compare */
      /* eslint-enable no-self-compare */
      // #7981: for accessor properties without setter

      // 更新值
      if (setter) {
        setter.call(obj, newVal)
      } else {
        val = newVal
      }
      // 递归更新子对象
      childOb = !shallow && observe(newVal)
      // 通知更新
      dep.notify()
    }
  })
}
```

#### class Dep

负责管理一组Watcher，包括watcher实例的增删及通知更新

```js
// ---------------------- src\core\observer\dep.js ----------------------
export default class Dep {
  static target: ?Watcher // 依赖收集时的watcher引用
  id: number
  subs: Array<Watcher> // watcher数组

  constructor() {
    this.id = uid++
    this.subs = []
  }

  // 添加watcher实例
  addSub(sub: Watcher) {
    this.subs.push(sub)
  }

  // 删除watcher实例
  removeSub(sub: Watcher) {
    remove(this.subs, sub)
  }

  // watcher和dep相互保存引用
  depend() {
    if (Dep.target) {
      Dep.target.addDep(this)
    }
  }

  notify() {
    // stabilize the subscriber list first
    const subs = this.subs.slice()
    if (process.env.NODE_ENV !== 'production' && !config.async) {
      // subs aren't sorted in scheduler if not running async
      // we need to sort them now to make sure they fire in correct
      // order
      subs.sort((a, b) => a.id - b.id)
    }
    for (let i = 0, l = subs.length; i < l; i++) {
      subs[i].update()
    }
  }
}
```

#### class Watcher

负责管理一组Watcher，包括watcher实例的增删及通知更新

```js
// ---------------------- src\core\observer\watcher.js ----------------------
export default class Watcher {

  addDep(dep: Dep) {
    const id = dep.id
    if (!this.newDepIds.has(id)) {
      // watcher保存dep引用
      this.newDepIds.add(id)
      this.newDeps.push(dep)
      // dep添加watcher
      if (!this.depIds.has(id)) {
        dep.addSub(this)
      }
    }
  }

  update() {
    // 更新逻辑
    /* istanbul ignore else */
    if (this.lazy) {
      this.dirty = true
    } else if (this.sync) {
      this.run()
    } else {
      // 默认lazy和sync都是false，所以会走该逻辑
      queueWatcher(this)
    }
  }

}
```

> vue 中的数据响应化使用了观察者模式：
>
> - defineReactive 中的 getter 和 setter 对应着订阅和发布应为
> - Dep 的角色相当于主题 Subject，维护订阅者、通知观察者更新
> - Watcher 的角色相当于观察者 Observer，执行更新
> - 但是 vue 里面的 Observer 不是上面说的观察者，它和 data 中对象一一对应，有内嵌的对象就会有 child Observer 与之对应

### \$watch

\$watch 是和数据响应机制息息相关的一个 API，它指定一个监控表达式，当数值发生变化的时候执行回调函数，我们来看一下它的实现

```js
// src\core\instance\state.js
// stateMixin()
Vue.prototype.$watch = function(
  expOrFn: string | Function,
  cb: any,
  options?: Object
): Function {
  const vm: Component = this
  // 对象形式回调的解析
  if (isPlainObject(cb)) {
    return createWatcher(vm, expOrFn, cb, options)
  }
  options = options || {}
  options.user = true
  // 创建Watcher监视数值变化
  const watcher = new Watcher(vm, expOrFn, cb, options)
  // 若有immediate选项立即执行一次cb
  if (options.immediate) {
    try {
      cb.call(vm, watcher.value)
    } catch (error) {
      handleError(
        error,
        vm,
        `callback for immediate watcher "${watcher.expression}"`
      )
    }
  }
  return function unwatchFn() {
    watcher.teardown()
  }
}
```

### Watcher 构造函数

主要解析监听的表达式，并触发依赖收集

```js
// src\core\observer\watcher.js
export default class Watcher {
  constructor(
    vm: Component,
    expOrFn: string | Function,
    cb: Function,
    options?: ?Object,
    isRenderWatcher?: boolean
  ) {
    this.vm = vm
    // 组件保存render watcher
    if (isRenderWatcher) {
      vm._watcher = this
    }
    // 组件保存非render watcher
    vm._watchers.push(this)

    // options

    // parse expression for getter
    // 将表达式解析为getter函数
    // 如果是函数则直接指定为getter，那什么时候是函数？
    // 答案是那些和组件实例对应的Watcher创建时会传递组件更新函数updateComponent
    if (typeof expOrFn === 'function') {
      this.getter = expOrFn
    } else {
      // 这种是$watch传递进来的表达式，它们需要解析为函数
      this.getter = parsePath(expOrFn)
      if (!this.getter) {
        this.getter = noop
        process.env.NODE_ENV !== 'production' &&
          warn(
            `Failed watching path: "${expOrFn}" ` +
              'Watcher only accepts simple dot-delimited paths. ' +
              'For full control, use a function instead.',
            vm
          )
      }
    }
    // 若非延迟watcher，立即调用getter
    this.value = this.lazy ? undefined : this.get()
  }

  /**
   * Evaluate the getter, and re-collect dependencies.
   *
   * 模拟getter，重新收集依赖
   */
  get() {
    // Dep.target = this
    pushTarget(this)
    let value
    const vm = this.vm
    try {
      // 从组件中获取到value同时触发依赖收集
      value = this.getter.call(vm, vm)
    } catch (e) {
      if (this.user) {
        handleError(e, vm, `getter for watcher "${this.expression}"`)
      } else {
        throw e
      }
    } finally {
      // "touch" every property so they are all tracked as
      // dependencies for deep watching
      // deep watching，递归触发深层属性
      if (this.deep) {
        traverse(value)
      }
      popTarget()
      this.cleanupDeps()
    }
    return value
  }
}
```

### 数组响应化

数组数据变化的侦测跟对象不同，我们操作数组通常使用 push、pop、splice 等方法，此时没有办法得知数组变化。所以 vue 中采取的策略是拦截这些方法并通知 dep。

#### 拦截器

为数组原型中的 7 个可以改变内容的方法定义拦截器

```js
// src\core\observer\array.js
import { def } from '../util/index'

// 数组原型
const arrayProto = Array.prototype
// 修改后的数组
export const arrayMethods = Object.create(arrayProto)

// 7个待修改方法
const methodsToPatch = [
  'push',
  'pop',
  'shift',
  'unshift',
  'splice',
  'sort',
  'reverse'
]

/**
 * Intercept mutating methods and emit events
 *
 * 拦截这些方法，额外发送变更通知
 */
methodsToPatch.forEach(function(method) {
  // cache original method
  // 原始数组方法
  const original = arrayProto[method]
  // 修改这些方法的descriptor
  def(arrayMethods, method, function mutator(...args) {
    // 原始操作
    const result = original.apply(this, args)
    // 获取ob实例用于发送通知
    const ob = this.__ob__
    // 三个能新增元素的方法特殊处理
    let inserted
    switch (method) {
      case 'push':
      case 'unshift':
        inserted = args
        break
      case 'splice':
        inserted = args.slice(2)
        break
    }
    // 若有新增则做响应处理
    if (inserted) ob.observeArray(inserted)
    // notify change
    // 通知更新
    ob.dep.notify()
    return result
  })
})
```

#### 覆盖数组原型

Observer 中覆盖数组原型

```js
// src\core\observer\index.js
// class Observer constructor()
if (Array.isArray(value)) {
  // 覆盖数组原型
  protoAugment(value, arrayMethods) // value.__proto__ = arrayMethods

  this.observeArray(value)
}
```

#### 依赖收集

defineReactive 中数组的特殊处理

```js
// src\core\observer\index.js
// defineReactive()
// getter中处理
if (Array.isArray(value)) {
  dependArray(value)
}

// 数组中所有项添加依赖，将来数组里面就可以通过__ob__.dep发送通知
function dependArray(value: Array<any>) {
  for (let e, i = 0, l = value.length; i < l; i++) {
    e = value[i]
    e && e.__ob__ && e.__ob__.dep.depend()
    if (Array.isArray(e)) {
      dependArray(e)
    }
  }
}
```

> 数据响应式处理中的各种角色可以通过动画再捋一下
>
> 理解响应式原理的实现，我们可以知道一下注意事项：
>
> - 对象各属性初始化时进行一次响应化处理，以后再动态设置是无效的

```js
data: {
  obj: {
    foo: 'foo'
  }
}

// 无效
this.obj.bar = 'bar'
// 有效
this.$set(this.obj, 'bar', 'bar')
```

> - 数组是通过方法拦截实现响应化处理，不通过方法操作数组也是无效的

```js
data: {
  items: ['foo', 'bar']
}
// 无效
this.items[0] = 'hello'
this.items.length = 0
//有效
this.$set(this.items, 0, 'hello')
this.items.splice(0, 2)
```

### Vue 异步更新队列

Vue 在更新 DOM 时是异步执行的。只要侦听到数据变化，Vue 将开启一个队列，并缓冲在同一事件循环中发生的所有数据变更。如果同一个 watcher 被多次触发，指挥被推入到队列中一次。这种在缓冲时去除重复数据对于避免不必要的计算和 DOM 操作是非常重要的。  
然后，在下一个的事件循环“tick”中，Vue 刷新队列并执行实际（已去重的）工作。Vue 在内部对异步队列尝试使用原生的`Promise.then()`、`MutationObserver`和`setImmediate`，如果执行环境不支持，则会采用`setTimeout(fn, 0)`代替。

> 如果项获取更新后 DOM 状态，可以在数据变化之后使用`Vue.nextTick(cb)`，这样回调函数会在 DOM 更新完成后被调用。

#### queueWatcher

执行 watcher 入队操作，若存在重复 id 则跳过

```js
// src\core\observer\watcher.js
// update()
queueWatcher(this)

// src\core\observer\scheduler.js
// watcher入队
export function queueWatcher(watcher: Watcher) {
  const id = watcher.id
  if (has[id] == null) {
    // id不存在才会入队
    has[id] = true
    if (!flushing) {
      // 没有在执行刷新则进入队尾
      queue.push(watcher)
    } else {
      // if already flushing, splice the watcher based on its id
      // if already past its id, it will be run next immediately.
      // 若已刷新，按id顺序插入到队列
      // 若已经过了，则下次刷新立即执行
      let i = queue.length - 1
      while (i > index && queue[i].id > watcher.id) {
        i--
      }
      queue.splice(i + 1, 0, watcher)
    }
    // queue the flush
    // 刷新队列
    if (!waiting) {
      waiting = true

      if (process.env.NODE_ENV !== 'production' && !config.async) {
        flushSchedulerQueue()
        return
      }
      nextTick(flushSchedulerQueue)
    }
  }
}

// src\core\observer\scheduler.js
// nextTick(flushSchedulerQueue)
// 按照特定异步策略执行队列刷新操作
export function nextTick(cb?: Function, ctx?: Object) {
  let _resolve
  // 注意cb不是立即执行，而是加入到回调数组，等待调用
  callbacks.push(() => {
    if (cb) {
      try {
        cb.call(ctx) // 真正执行cb
      } catch (e) {
        handleError(e, ctx, 'nextTick')
      }
    } else if (_resolve) {
      _resolve(ctx)
    }
  })
  // 没有出在挂起状态则开始异步执行过程
  if (!pending) {
    pending = true
    timerFunc()
  }
  // $flow-disable-line
  if (!cb && typeof Promise !== 'undefined') {
    return new Promise(resolve => {
      _resolve = resolve
    })
  }
}

let timerFunc

// nextTick异步行为利用微任务队列，可通过Promise或MutationObserver交互
// 首选Promise，次选MutationObserver
if (typeof Promise !== 'undefined' && isNative(Promise)) {
  const p = Promise.resolve()
  timerFunc = () => {
    p.then(flushCallbacks)
    
    if (isIOS) setTimeout(noop)
  }
  isUsingMicroTask = true
} else if (
  !isIE &&
  typeof MutationObserver !== 'undefined' &&
  (isNative(MutationObserver) ||
    // PhantomJS and iOS 7.x
    MutationObserver.toString() === '[object MutationObserverConstructor]')
) {
  // 不能用Promise时：PhantomJS，iOS7，Android 4.4
  let counter = 1
  const observer = new MutationObserver(flushCallbacks)
  const textNode = document.createTextNode(String(counter))
  observer.observe(textNode, {
    characterData: true
  })
  timerFunc = () => {
    counter = (counter + 1) % 2
    textNode.data = String(counter)
  }
  isUsingMicroTask = true
} else if (typeof setImmediate !== 'undefined' && isNative(setImmediate)) {
  // 回退到 setImmediate 它利用的是宏任务
  timerFunc = () => {
    setImmediate(flushCallbacks)
  }
} else {
  // 最后选择 setTimeout
  timerFunc = () => {
    setTimeout(flushCallbacks, 0)
  }
}
```

> [宏任务和微任务](https://segmentfault.com/a/1190000014940904?utm_source=tag-newest)

## 虚拟 DOM

虚拟 DOM（Virtual DOM）是对 DOM 的 JS 抽象表示，它们是 JS 对象，能够描述 DOM 结构和关系。

![](https://upload-images.jianshu.io/upload_images/16753277-758501473d389e72.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

### 优点

虚拟 DOM 轻量、快速，当他们发生变化时通过新旧虚拟 DOM 比对可以得到最小 DOM 操作量，从而提升性能和用户体验。本质上时使用 JavaScript 运算成本替换 DOM 操作的执行成本，前者运算速度要比后者快得多，这样做很划算，因此才会有虚拟 DOM。

Vue 1.0 中有细粒度的数据变化侦测，每一个属性对应一个 Watcher 实例，因此它是不需要虚拟 DOM 的，但是细粒度造成了大量开销，这对于大型项目来说是不可接受的。因此，Vue 2.0 选择了中等粒度的解决方案，每一个组件对应一个 Watcher 实例，这样状态变化时只能通知到组件，再通过引入虚拟 DOM 去进行对比和渲染。

### 实现

### 虚拟 DOM 整体流程

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

### patch

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

### patchVnode

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

### updateChildren

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

### 属性相关 dom 操作

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