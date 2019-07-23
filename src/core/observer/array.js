/*
 * not type checking this file because flow doesn't play well with
 * dynamically accessing methods on Array prototype
 *
 * 数组数据变化的侦测跟对象不同，我们操作数组通常使用push、pop、splice等方法，
 * 此时没有办法得知数组变化。所以vue中采取的策略是拦截这些方法并通知dep。
 *
 * 为数组原型中的7个可以改变内容的方法定义拦截器
 */

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
