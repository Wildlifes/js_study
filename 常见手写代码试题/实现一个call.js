// 模拟 call bar.mycall(null);
//实现一个call方法：
/**
 * call做了什么:
 *
 * 1.将函数设为对象的属性
 * 2.执行&删除这个函数
 * 3.指定this到函数并传入给定参数执行函数
 * 4.如果不传入参数，默认指向为 window
 * */
Function.prototype.myCall = function(context) {
  //此处没有考虑context非object情况
  context.fn = this;
  let args = [];
  for (let i = 1, len = arguments.length; i < len; i++) {
    args.push(arguments[i]);
  }
  //   context.fn(...args);
  let result = context.fn(...args);
  delete context.fn;
  return result;
};
