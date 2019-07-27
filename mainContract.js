/**
 *
 * iZ³ | IZZZIO blockchain - https://izzz.io
 *
 * Detalist contract
 *
 */


/**
 * Address of main contract owner
 * @type {string}
 */
const CONTRACT_OWNER = 'izNqZ1mtGh4ZBYdgzbqkDm7bvKyueUEt8WP';


/**
 * Main Detalist contract
 */
class mainContract extends Contract {

    /**
     * Contract info
     */
    get contract() {
        return {
            owner: CONTRACT_OWNER,
            type: 'other',
        };
    }

    /**
     * Initialization and emission
     */
    init() {
        super.init();

        this._data = new BlockchainMap('data');

        this._items = new BlockchainMap('items');

        this._usedItems = new BlockchainMap('usedItems');

        if(contracts.isDeploy()) {
            this._data['autoIndex'] = 0;
        }
    }

    /**
     * Increments items storage index
     * @private
     */
    _incrementIndex() {
        this._data['autoIndex'] = this._data['autoIndex'] + 1;
    }

    /**
     * Adds new item
     * @param {string} code
     * @param {string} type
     * @param {string} addedBy
     * @param {string} bench
     * @param {object} params
     * @param {array}  parts
     * @param {object|array} additionalInfo
     * @returns {Number}
     */
    addItem(code, type, addedBy, bench, params, parts, additionalInfo = {}) {
        assert.defined(code, 'You must define item code');
        assert.defined(type, 'You must define item code');
        assert.defined(addedBy, 'You must define item code');
        assert.defined(params, 'You must define params');
        assert.true(Array.isArray(parts), 'Parts must be an array');

        const currIndex = this._data['autoIndex'];

        for (let partId of parts) {
            partId = Number(partId);
            if(partId >= currIndex){
                throw new Error('You cant include youself or unlisted items as a part')
            }
            if(this._usedItems[partId]) {
                throw new Error(`This part ${partId} used in ${currIndex}. You can't use this part in new item.`);
            }
            this._usedItems[partId] = currIndex;
        }

        this._items[currIndex] = {
            id: currIndex,
            code: code,
            type: type,
            addedBy: addedBy,
            bench: bench,
            params: params,
            parts: parts,
            additionalInfo: additionalInfo
        };

        this._incrementIndex();

        return currIndex;
    }

    /**
     * Recursively gets items with subparts
     * @param {number} id
     * @returns {object}
     * @private
     */
    _getItemWithSubitems(id) {
        let item = this._items[id];
        if(!item) {
            throw new Error(`Item ${id} not found`);
        }

        let parts = [];
        for (let part of item.parts) {
            parts.push(this._getItemWithSubitems(part));
        }

        item.parts = parts;

        return item;
    }

    /**
     * Get item public
     * @param {number} id
     * @returns {string}
     */
    getItem(id) {
        assert.defined(id, 'Item id must be defined');
        id = Number(id);
        return JSON.stringify(this._getItemWithSubitems(id));
    }


}

global.registerContract(mainContract);
