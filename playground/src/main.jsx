
import { createElement, render, useState } from 'mini-react'

/** @jsx createElement */
const App =  (props) => (
  // eslint-disable-next-line react/prop-types
  <h2>App title 
    <span>{ props.name }</span>
  </h2>
)

function Counter() {
  const [count, setCount] = useState(0)
  return (
    <div>
      <p>You clicked {count} times</p>
      <button onClick={() => setCount(c => c + 1)}>click</button>
    </div>  
  )
}

const element = <App name="foo" />

const ele = createElement('div', {}, 
  'HI hello',
  createElement('h1', {}, 'Hello, world!'),
  createElement('h2', {}, '你好，世界！'),
  element,
  <Counter />
)


render(ele, document.getElementById('root'))

