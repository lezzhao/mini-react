import { Fiber, VirtualDom } from "./type";

let nextUnitOfWork: any = null;
let wipRoot: any = null;
let currentRoot: any = null;
let deletions: any[] = []

const isEvent = (key: string) => key.startsWith('on');
const isProperty = (key: string) => key !== 'children' && !isEvent(key);
const isNew = (prev: any, next: any) => (key: string) => prev[key] !== next[key];
const isGone = (_prev: any, next: any) => (key: string) => !(key in next);

export function createDom(fiber: VirtualDom) {
    const dom: any = fiber.type === 'TEXT_ELEMENT' ?
        document.createTextNode('')
        :
        document.createElement(fiber.type);
    updateDom(dom, {}, fiber.props)
    return dom
}


function commitRoot() {
    deletions.forEach(commitWork);
    commitWork(wipRoot.child);
    currentRoot = wipRoot;
    wipRoot = null;
}

function commitDeletion(fiber: Fiber, domParent: any) {
    if (fiber.dom) {
        domParent.removeChild(fiber.dom);
    } else {
        commitDeletion(fiber.child!, domParent);
    }
}


function commitWork(fiber: Fiber) {
    if (!fiber) {
        return;
    }

    let parentFiber = fiber.return!;
    while (!parentFiber.dom) {
        parentFiber = parentFiber.return!
    }
    const domParent = parentFiber?.dom;

    if (fiber.effectTag === 'PLACEMENT' && fiber.dom !== null) {
        domParent?.appendChild(fiber.dom!);
    } else if (fiber.effectTag === 'UPDATE' && fiber.dom !== null) {
        updateDom(fiber.dom!, fiber.alternate?.props, fiber.props);
    } else if (fiber.effectTag === 'DELETION') {
        commitDeletion(fiber, domParent);
    }
    commitWork(fiber.child!);
    commitWork(fiber.sibling!);
}



function updateDom(ele: any, prevProps: any, nextProps: any) {
    // remove old event listeners
    Object.keys(prevProps)
        .filter(isEvent)
        .filter(key => !(key in nextProps) || isNew(prevProps, nextProps)(key))
        .forEach(name => {
            const eventType = name.toLowerCase().substring(2)
            ele.removeEventListener(eventType, prevProps[name])
        })
    // remove old props
    Object.keys(prevProps).filter(isProperty).filter(isGone(prevProps, nextProps)).forEach(name => {
        ele[name] = ''
    })

    // set or change props
    Object.keys(nextProps).filter(isProperty).filter(isNew(prevProps, nextProps)).forEach(name => {
        ele[name] = nextProps[name]
    })

    // add event listeners
    Object.keys(nextProps)
        .filter(isEvent)
        .filter(isNew(prevProps, nextProps))
        .forEach(name => {
            const eventType = name.toLowerCase().substring(2)
            ele.addEventListener(eventType, nextProps[name])
        })
}

function workLoop(deadline: IdleDeadline) {
    let shouldYield = false;
    while (nextUnitOfWork && !shouldYield) {
        nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
        shouldYield = deadline.timeRemaining() < 1;
    }
    if (!nextUnitOfWork && wipRoot) {
        commitRoot();
    }
    requestIdleCallback(workLoop);
}

requestIdleCallback(workLoop)


function reconcileChildren(fiber: Fiber, elements: any) {
    let index = 0
    let oldFiber = fiber.alternate && fiber.alternate.child
    let prevSibling: Fiber | null = null
    while (index < elements.length || (oldFiber !== null && oldFiber !== undefined)) {
        const element = elements[index]
        let newFiber: any = null

        const sameType = oldFiber && element && element.type === oldFiber.type
        if (sameType) {
            newFiber = {
                dom: oldFiber?.dom,
                return: fiber,
                alternate: oldFiber,
                type: oldFiber?.type,
                props: element.props,
                effectTag: 'UPDATE'
            }
        }
        if (element && !sameType) {
            newFiber = {
                dom: null,
                return: fiber,
                alternate: null,
                type: element?.type,
                props: element.props,
                effectTag: 'PLACEMENT'
            }
        }
        if (oldFiber && !sameType) {
            oldFiber.effectTag = 'DELETION'
            deletions.push(oldFiber)
        }
        if (oldFiber) {
            oldFiber = oldFiber.sibling
        }
        if (index === 0) {
            fiber.child = newFiber
        } else if (prevSibling) {
            prevSibling.sibling = newFiber
        }

        prevSibling = newFiber
        index++
    }
}

function updateHostComponent(fiber: Fiber) {
    if (!fiber.dom) {
        fiber.dom = createDom(fiber)
    }
    reconcileChildren(fiber, fiber.props?.children)
}


let wipFiber: any = null
let hookIndex: any = null
function updateFunctionComponent(fiber: Fiber) {
    wipFiber = fiber
    hookIndex = 0
    wipFiber.hooks = []

    const children = [fiber.type(fiber.props)]
    reconcileChildren(fiber, children)
}
export function useState(initial: any) {
    const oldHook = wipFiber.alternate && wipFiber.alternate.hooks && wipFiber.alternate.hooks[hookIndex]
    const hook: any = {
        state: oldHook ? oldHook.state : initial,
        queue: []
    }

    const actions = oldHook ? oldHook.queue : []
    actions.forEach((action: any) => {
        hook.state = action(hook.state)
    })

    const setState = (action: any) => {
        hook.queue.push(action)
        wipRoot = {
            dom: currentRoot.dom,
            alternate: currentRoot,
            props: currentRoot.props
        }
        nextUnitOfWork = wipRoot
        deletions = []
    }

    wipFiber.hooks.push(hook)
    hookIndex++
    return [hook.state, setState]
}

function performUnitOfWork(fiber: Fiber) {
    const isFunctionType = fiber.type instanceof Function
    if (isFunctionType) {
        updateFunctionComponent(fiber)
    } else {
        updateHostComponent(fiber)
    }

    if (fiber.child) {
        return fiber.child
    }
    let nextFiber = fiber
    while (nextFiber) {
        if (nextFiber.sibling) {
            return nextFiber.sibling
        }
        nextFiber = nextFiber.return!
    }
}

export function render(element: VirtualDom, container: HTMLElement | Text) {
    wipRoot = {
        dom: container,
        alternate: currentRoot,
        props: {
            children: [element]
        }
    }
    nextUnitOfWork = wipRoot
}