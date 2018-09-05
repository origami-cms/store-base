import {Origami} from 'origami-core-lib';

export const returnConvertedResource: MethodDecorator = (target, key, descriptor) => {
    if (!target.hasOwnProperty('_resourceTo')) {
        throw new Error('Store does not implement _resourceTo');
    }

    let desc = descriptor;

    // @ts-ignore
    if (desc === undefined) desc = Object.getOwnPropertyDescriptor(target, key);
    // @ts-ignore
    const originalMethod = desc.value as Function;

    // @ts-ignore
    desc.value = (): Origami.Store.Resource | Origami.Store.Resource[] | null => {
        // @ts-ignore
        return target._resourceTo(originalMethod.apply(target, ...arguments));
    };

    return desc;
};


export const ensureTreeResource: MethodDecorator = (target, key, descriptor) => {
    let desc = descriptor;

    // @ts-ignore
    if (desc === undefined) desc = Object.getOwnPropertyDescriptor(target, key);
    // @ts-ignore
    const originalMethod = desc.value as Function;

    // @ts-ignore
    desc.value = () => {
        // @ts-ignore
        if (target._isTree) target._error('Model is not a tree structure');
        else return originalMethod.apply(target, ...arguments);
    };

    return desc;
};


export const nonenumerable = (target: any, key: string) => {
    // first property defined in prototype, that's why we use getters/setters
    // (otherwise assignment in object will override property in prototype)
    Object.defineProperty(target, key, {
        get() { return undefined; },
        set (this: any, val) {
            // here we have reference to instance and can set property directly to it
            Object.defineProperty(this, key, {
                value: val,
                writable: true,
                enumerable: false,
            });
        },
        enumerable: false,
    });
};
