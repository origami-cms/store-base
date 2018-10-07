import { Origami } from 'origami-core-lib';
import { returnConvertedResource } from './decorators';
import Resource from './Resource';

export type ValidationMessages =
    'unknown' |
    'required' |
    'duplicate' |
    'min' |
    'max' |
    'minLength' |
    'maxLength' |
    'notFound' |
    'notFoundID';

export default class Model implements Origami.Store.Model {

    constructor(
        public name: string,
        public schema: Origami.Store.Schema,
        public store: Origami.Store.Store
    ) { }


    // ------------------------------------------------------------------------|
    // ------------------------------------------------ Public getters/setters |
    // ------------------------------------------------------------------------|

    get hiddenFields() {
        return Object.entries(this.schema.properties)
            .map(([name, prop]) => {
                if (prop.hidden === true) return name;
            })
            .filter(n => n) as string[];
    }


    // ------------------------------------------------------------------------|
    // ----------------------------------------------- Private getters/setters |
    // ------------------------------------------------------------------------|

    protected get _isTree() {
        return this.schema.tree;
    }


    // ------------------------------------------------------------------------|
    // -------------------------------------------------- Public query methods |
    // ------------------------------------------------------------------------|

    /** Create a new resource */
    async create(resource: Origami.Store.Resource) {
        return this._create(
            this._resourceFrom(resource)
        );
    }


    /** Query for resources */
    async find(query = {}, opts = {}) {
        // If there is an id specified, then find one, otherwise query all
        let q = query as Origami.Store.Resource;
        let func = this._find.bind(this);

        if (q) {
            if (q.id) func = this._findOne.bind(this);
            q.deletedAt = null;

            // Default query
        } else q = { deletedAt: null };

        return await func(
            this._resourceFrom(q),
            opts
        );
    }

    /** Query for one resource */
    async findOne(query = {}, opts = {}) {
        return await this._findOne(
            this._resourceFrom(query),
            opts
        );
    }


    /** Find a resource by id */
    async findById(id: string, opts = {}) {
        return this._findById(
            this._resourceFrom({ id }),
            opts
        );
    }


    /** Update a resource based on the id or query */
    async update(
        idOrObj: string | object,
        newResource: Origami.Store.Resource,
        opts = {}
    ) {
        let q = idOrObj;
        if (typeof q === 'string') q = { id: idOrObj };

        return await this._update(
            this._resourceFrom(q),
            this._resourceFrom(newResource),
            opts
        );
    }


    /** Delete a resource based on the id or query */
    async delete(idOrObj: string | object, opts = {}) {

        let q = idOrObj;
        if (typeof q === 'string') q = { id: idOrObj };

        // Set the deleted flag
        const set = { deletedAt: new Date() };

        const deleted = await this._update(
            this._resourceFrom(q),
            this._resourceFrom(set),
            opts
        );

        // No resources deleted/updated
        if (deleted === null || deleted.length === 0) {
            if (typeof idOrObj === 'string') {
                return this._validationError(
                    this._validateMessages.notFoundID(idOrObj),
                    'id',
                    'notFoundID'
                );
            } else this._validationError(this._validateMessages.notFound(), null, 'notFound');
        // If all resources returned null (EG: Each was deleted)
        } else if (deleted.every(v => v === null)) return true;
    }


    // /** Move a resource under a parent in the tree */
    // @ensureTreeResource
    // async move(id: string, parentId: string) {
    //     const res = await this.findById(id);
    //     if (!res) throw new Error('Resource does not exist');

    //     const parent = await this.findById(parentId);
    //     if (!parent) {
    //         throw new Error('Could not move resource. Parent does not exist');
    //     }


    //     if (parent.path) {
    //         if (parent.path.includes(id)) {
    //             throw new Error(
    //                 'Could not move resource. Parent is an existing child of the resource.'
    //             );
    //         }
    //     } else {
    //         parent.path = parent._id;
    //         await parent.save();
    //     }

    //     res.parent = parent;

    //     return res.save();
    // }


    // ------------------------------------------------------------------------|
    // -------------------------------------------------- Private util methods |
    // ------------------------------------------------------------------------|

    protected _error(errOrString: Error | string) {
        throw new Error(`Origami.Model: ${errOrString}`);
    }

    protected _validationError = (str: string, field: string | null, rule: ValidationMessages) => {
        const err = new Error(str) as Origami.Server.DataError;

        err.data = [
            {
                type: 'store',
                field,
                rule
            }
        ];
        throw err;
    }


    /** Convert from Origami.Store.Schema to local store schema */
    protected _schemaFrom(schema: Origami.Store.Schema): object {
        return schema;
    }


    /** Convert from Origami.Store.Resource to local store resource */
    protected _resourceFrom(resource: Origami.Store.Resource): object {
        return resource;
    }


    // ------------------------------------------------------------------------|
    // --------------------------------------------------- Validation messages |
    // ------------------------------------------------------------------------|
    get _validateMessages() {
        // tslint:disable max-line-length
        return {
            unknown: (field: string) =>
                `Unknown error with '${field}' on model '${this.name}'`,
            required: (field: string) =>
                `Required field '${field}' is missing on model '${this.name}'`,
            duplicate: (field: string) =>
                `Duplicate field '${field}' on model '${this.name}'`,
            min: (field: string, passed: string, expected: string) =>
                `Field '${field}' should be above '${expected}', not '${passed}' on model '${this.name}'`,
            max: (field: string, passed: string, expected: string) =>
                `Field '${field}' should be below '${expected}', not '${passed}' on model '${this.name}'`,
            minLength: (field: string, passed: string = '', expected: string) =>
                `Field '${field}' should be longer than '${expected}' characters, not '${passed.length}' on model '${this.name}'`,
            maxLength: (field: string, passed: string = '', expected: string) =>
                `Field '${field}' should be shorter than '${expected}' characters, not '${passed.length}' on model '${this.name}'`,
            notFound: () =>
                `No resource found`,
            notFoundID: (id: string) =>
                `No resource found with id '${id}'`

        } as {[rule in ValidationMessages]: (...args: any[]) => string};
    }

    // ------------------------------------------------------------------------|
    // ------------------------------------------------- Private query methods |
    // ------------------------------------------------------------------------|

    protected async _create(resource: object): Promise<Resource | null> {
        this._error('_create() is not implemented');
        return null;
    }


    protected async _find(query: object, options?: object): Promise<Resource[] | null> {
        this._error('_find() is not implemented');
        return null;
    }


    protected async _findOne(query: object, options?: object): Promise<Resource | null> {
        this._error('_findOne() is not implemented');
        return null;
    }

    protected async _findById(query: object, options?: object): Promise<Resource | null> {
        return this._findOne(query, options);
    }


    protected async _update(
        query: object,
        newResource: object,
        options?: object
    ): Promise<(Resource | null)[] | null> {

        this._error('_update() is not implemented');
        return null;
    }

    protected async _updateOne(
        query: object,
        newResource: object,
        options?: object
    ): Promise<Resource | null> {

        this._error('_updateOne() is not implemented');
        return null;
    }
}
