// 1. 定义 status 状态
// 2. fn1, fn2 的数组
// 3. 定义 resolve reject 方法
// 4. executor 执行
function Promise(executor) {
  let self = this;

  self.status = "pending";
  self.fn1Callback = [];
  self.fn2Callback = [];

  // resolve 做到事情
  // 1. 修改this 实例的状态
  // 2. 修改this 这里的data
  // 3. 遍历执行 this fn1Callback 上挂载的方法
  function resolve(value) {
    if (value instanceof Promise) {
      return value.then(resolve, reject);
    }
    setTimeout(() => {
      // 异步执行所有的回调函数
      if (self.status === "pending") {
        self.status = "resolved";
        self.data = value;
        for (let i = 0; i < self.fn1Callback.length; i++) {
          self.fn1Callback[i](value);
        }
      }
    });
  }
  function reject(reason) {
    setTimeout(() => {
      // 异步执行所有的回调函数
      if (self.status === "pending") {
        self.status = "rejected";
        self.data = reason;
        for (let i = 0; i < self.fn2Callback.length; i++) {
          self.fn2Callback[i](reason);
        }
      }
    });
  }

  try {
    executor(resolve, reject);
  } catch (reason) {
    reject(reason);
  }
}

// 1. 参数校验
// 2. 根据 statue, 执行 fn1, fn2 或者把 执行fn1, fn2的行为保存在数组
// 3. 把 fn1，fn2 的返回值, 使用 resolvePromise 包裹成 promise
Promise.prototype.then = function(fn1, fn2) {
  let self = this;
  let promise2;
  fn1 =
    typeof fn1 === "function"
      ? fn1
      : function(v) {
          return v;
        };
  fn2 =
    typeof fn2 === "function"
      ? fn2
      : function(r) {
          throw r;
        };

  // 执行到 then, 并不确定 promise 状态已经是 resolved
  if (self.status === "resolved") {
    // then() 执行后，返回一个promise, promise 的值
    return (promise2 = new Promise((resolve, reject) => {
      setTimeout(() => {
        // 异步执行onResolved
        try {
          // 执行 fn1()，拿到结果 x
          // fn1是用户传入的，那fn1返回值, 可能性可就多了
          let x = fn1(self.data);
          // 如果 x 是简单值，直接 resolve(x);
          // resolve(x);
          // 需要使用 resolvePromise 方法封装
          resolvePromise(promise2, x, resolve, reject);
        } catch (reason) {
          reject(reason);
        }
      });
    }));
  }

  if (self.status === "rejected") {
    return (promise2 = new Promise((resolve, reject) => {
      setTimeout(() => {
        // 异步执行onRejected
        try {
          let x = fn2(self.data);
          resolvePromise(promise2, x, resolve, reject);
        } catch (reason) {
          reject(reason);
        }
      });
    }));
  }

  if (self.status === "pending") {
    // 这里之所以没有异步执行，是因为这些函数必然会被resolve或reject调用，而resolve或reject函数里的内容已是异步执行，构造函数里的定义
    return (promise2 = new Promise((resolve, reject) => {
      // 先定义一个方法，把方法 挂载到 onResolvedCallback 数组上
      // 方法里面 就是 调用传入的 fn1
      self.onResolvedCallback.push(value => {
        try {
          let x = fn1(value);
          resolvePromise(promise2, x, resolve, reject);
        } catch (r) {
          reject(r);
        }
      });

      self.onRejectedCallback.push(reason => {
        try {
          let x = fn2(reason);
          resolvePromise(promise2, x, resolve, reject);
        } catch (r) {
          reject(r);
        }
      });
    }));
  }
};

// 1. 普通值
// 2. promise 值
// 3. thenable 的值，执行 then
function resolvePromise(promise2, x, resolve, reject) {
  // 为了防止循环引用
  if (promise2 === x) {
    return reject(new TypeError("Chaining cycle detected for promise!"));
  }
  // 如果 x 是 promise
  if (x instanceof Promise) {
    x.then(
      function(data) {
        resolve(data);
      },
      function(e) {
        reject(e);
      }
    );
    return;
  }

  // 如果 x 是 object 类型或者是 function
  if (x !== null && (typeof x === "object" || typeof x === "function")) {
    // 拿x.then可能会报错
    try {
      // 先拿到 x.then
      var then = x.then;
      var called;
      if (typeof then === "function") {
        // 这里的写法，是 then.call(this, fn1, fn2)
        then.call(
          x,
          y => {
            // called 是干什么用的呢？
            // 有一些 promise 实现的不是很规范，瞎搞的，比如说，fn1, fn2 本应执行一个，
            // 但是有些then实现里面，fn1, fn2都会执行
            // 为了 fn1 和 fn2 只能调用一个, 设置一个 called 标志位
            if (called) {
              return;
            }
            called = true;
            return resolvePromise(promise2, y, resolve, reject);
          },
          r => {
            if (called) {
              return;
            }
            called = true;
            return reject(r);
          }
        );
      } else {
        resolve(x);
      }
    } catch (e) {
      if (called) {
        return;
      }
      return reject(e);
    }
  } else {
    resolve(x);
  }
}

Promise.all = function(arr) {
  return new Promise((resolve, reject) => {
    if (!Array.isArray(arr)) {
      throw new Error(`argument must be a array`);
    }
    let dataArr = [];
    let num = 0;
    for (let i = 0; i < arr.length; i++) {
      let p = arr[i];
      p.then(data => {
        dataArr.push(data);
        num++;
        if (num === arr.length) {
          return resolve(data);
        }
      }).catch(e => {
        return reject(e);
      });
    }
  });
};

Promise.all = function(arr) {
  return new Promise((resolve, reject) => {
    if (!Array.isArray(arr)) {
      throw new Error(`argument must be a array`);
    }
    let dataArr = [];
    let num = 0;
    for (let i = 0; i < arr.length; i++) {
      let p = arr[i];
      p.then(data => {
        dataArr.push(data);
        num++;
        if (num === arr.length) {
          return resolve(data);
        }
      }).catch(e => {
        return reject(e);
      });
    }
  });
};
