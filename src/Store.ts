import clone from 'clone';
import {Origami} from 'origami-core-lib';
import Model from './Model';

export default class Store {
    models: {[name: string]: Origami.Store.Model} = {};

    protected _model: new(...args: any[]) => Model;

    protected _options: Origami.ConfigStore;


    constructor(options: Origami.ConfigStore) {
        const o = this._options = clone(options);
        this._model = Model;
    }


    get connURI() {
        const o = this._options;
        /* @ts-ignore TODO: FIX THIS LATER */
        if (o.connURI) return o.connURI;
        return `${o.type}://${o.username}:${o.password}@${o.host}:${o.port}/${o.database}`;
    }


    /** Connect the store to the database */
    async connect(): Promise<any> {
        return this._error(`Store '${this._options.type}' has not implemented the 'connect()' function`);
    }

    /** Disconnect the store from the database */
    async disconnect(): Promise<any> {
        return this._error(`Store '${this._options.type}' has not implemented the 'disconnect()' function`);
    }


    /** Find or create a model */
    model(name: string, schema?: Origami.Store.Schema): Origami.Store.Model | void {
        // Lookup model
        if (!schema) {
            const m = this.models[name];
            if (!m) return this._error(`No model with name '${name}'`);
            else return m;

        // Define a new model
        } else {
            return this.models[name] = new this._model(name, schema, this);
        }
    }


    private _error(errOrString: Error | string) {
        throw new Error(`Origami.Store: ${errOrString}`);
    }
}
