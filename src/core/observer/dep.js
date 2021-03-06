/* @flow */

import type Watcher from './watcher'
import { remove } from '../util/index'
import config from '../config'

let uid = 0

/**
 * A dep is an observable that can have multiple
 * directives subscribing to it.
 *
 * 负责管理一组Watcher，包括watcher实例的增删及通知更新
 */
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

// The current target watcher being evaluated.
// This is globally unique because only one watcher
// can be evaluated at a time.
Dep.target = null
const targetStack = []

export function pushTarget(target: ?Watcher) {
  targetStack.push(target)
  Dep.target = target
}

export function popTarget() {
  targetStack.pop()
  Dep.target = targetStack[targetStack.length - 1]
}
