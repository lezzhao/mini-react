export type VirtualDom = {
    type: string;
    props: {
        children: any[];
        [key: string]: any;
    }
}


export type Fiber = {
    dom: HTMLElement | Text | null;
    return?: Fiber | null,
    sibling?: Fiber | null,
    child?: Fiber | null,
    alternate?: Fiber
    type: any,
    effectTag?: 'UPDATE' | 'PLACEMENT' | 'DELETION',
    props: {
        children: VirtualDom[]
    }
}