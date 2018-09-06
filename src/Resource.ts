import {Origami} from 'origami-core-lib';
import {nonenumerable} from './decorators';
import clone from 'clone';
import Model from './Model';

export type Any = {
    [key: string]: any;
};
export type LinkedResources<T> = Any & {
    [property in keyof T]: string;
};

export type OrigamiResourceOptions = {
    include?: string | string[];
};

export default class Resource {
    @nonenumerable
    protected _type: any;

    @nonenumerable
    protected _originalResource: any;

    @nonenumerable
    protected _store: Origami.Store.Store;

    @nonenumerable
    protected _converted?: Origami.Store.Resource;

    @nonenumerable
    protected _properties: {[prop: string]: any} = {};

    @nonenumerable
    protected _includeFields: string[] = [];


    constructor(
        type: string,
        resource: any,
        store: Origami.Store.Store,
        opts: OrigamiResourceOptions = {}
    ) {
        if (!resource) throw new Error(`Store.Resource: No resource supplied for type ${type}`);
        if (typeof resource !== 'object') {
            throw new Error(`Store.Resource: Resource is not an object for type ${type}`);
        }

        this._type = type;
        this._originalResource = resource;
        this._store = store;

        const inc = opts.include;
        if (inc) {
            if (typeof inc === 'string') this._includeFields = [inc];
            else if (inc instanceof Array) this._includeFields = inc;
        }

        this._converted = this._convertTo(resource, opts);

        this._assignProperties(this._converted);

        if (this._includeFields.length) this._convertNested(opts);
    }


    protected get _schema(): Origami.Store.Schema {
        return (this._store.models[this._type] as Model).schema;
    }


    protected get _linkedResources(): LinkedResources<Resource> {
        // Loop over properties...
        return Object.entries(this._schema.properties)
            // Filter out for only the props that have `includes`
            .filter(([prop]) => this._includeFields.includes(prop))
            .reduce((obj, [prop, value]) => {
                if (value.isA) obj[prop as keyof Resource] = value.isA;
                if (value.isMany) obj[prop as keyof Resource] = value.isMany;
                return obj;
            }, {} as LinkedResources<Resource>);
    }

    protected get _hiddenFields() {
        return Object.entries(this._schema.properties)
            .filter(([prop, value]) => value.hidden === true)
            .map(([prop, value]) => prop);
    }


    async save(): Promise<any> {}
    async delete(): Promise<any> {}

    @nonenumerable
    toObject() {
        const props = clone(this._properties);

        const convert = (r: any) => {
            if (typeof r.toObject === 'function') return r.toObject();
            else return r;
        };

        Object.keys(this._linkedResources).forEach(k => {
            const kr = k as keyof Resource;
            if (this[kr] instanceof Array) {
                // @ts-ignore
                props[kr] = this[kr].map(convert);
            } else props[kr] = convert(this[kr]);
        });
        return props;
    }


    protected _convertTo(resource: any, opts?: object): Origami.Store.Resource {
        return resource;
    }

    protected _convertNested(opts?: OrigamiResourceOptions) {
        Object.entries(this._linkedResources).forEach(([prop, res]) => {
            // @ts-ignore
            this[prop] = new Resource(res, this[prop], this._store, opts);
        });
    }


    protected _assignProperties(obj: object) {
        Object.entries(obj)
            .forEach(([prop, value]) => {
                this._properties[prop] = value;

                Object.defineProperty(this, prop, {
                    enumerable: true,
                    get() {
                        return this._properties[prop];
                    },
                    set(v) {
                        this._propertyChanged(prop, v, this._properties[prop]);
                        this._properties[prop] = v;
                    },

                });
            });
    }

    protected _propertyChanged(prop: string, newV: any, oldV: any) {
        this._originalResource[prop] = newV;
    }
}
