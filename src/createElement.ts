import { VirtualDom } from "./type"

export function createElement(type: string, props: Record<string, any> = {}, ...children: any): VirtualDom {
    return {
        type, 
        props: {
            ...props,
            // 处理文本节点
            children: children?.map((child: any) => typeof child === 'object' ? child : createTextElement(child))
        }
    }
}

export function createTextElement(text: string): VirtualDom {
    return {
        type: 'TEXT_ELEMENT',
        props: {
            nodeValue: text,
            children: [] as any[]
        }
    }
}