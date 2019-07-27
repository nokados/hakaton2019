/**
 iZ³ | Izzzio blockchain - https://izzz.io

 Copyright 2018 Izio Ltd (OOO "Изио")

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */

const APP_CONFIG = require('./appConfig.json');

/**
 * Detalist contract address
 * @type {string}
 */
const DETALIST_CONTRACT_ADDRESS = '1';

const logger = new (require(global.PATH.mainDir + '/modules/logger'))("Detalist");
const storj = require(global.PATH.mainDir + '/modules/instanceStorage');
const DApp = require(global.PATH.mainDir + '/app/DApp');
const TokenContractConnector = require(global.PATH.mainDir + '/modules/smartContracts/connectors/TokenContractConnector');
const fs = require('fs');


let that;

const express = require('express');
const app = express();
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(bodyParser.json());

app.use('/', express.static('front/build'));


/**
 * Detalist DApp
 * Provides API interface for DApp
 */
class App extends DApp {


    /**
     * Initialize
     */
    init() {
        that = this;
        app.listen(APP_CONFIG.httpPort, function () {
            logger.info('Detalist started at ' + APP_CONFIG.httpPort);
        });


        logger.info('Detalist DApp started');

        /*process.on('SIGINT', () => {
            console.log('Terminating tests...');
            process.exit();
        });

        process.on('unhandledRejection', error => {
            console.log(error);
            logger.fatal(error);
            process.exit();
        });*/


        /**
         * Get item
         */
        app.get('/item/:id', async function (req, res) {
            let id = req.params.id;
            try {
                let result = await that.contracts.ecmaPromise.callMethodRollback(DETALIST_CONTRACT_ADDRESS, 'getItem', [id], {});
                res.send(that.jsonOkResponse(JSON.parse(result)))
            } catch (e) {
                res.send(that.jsonErrorResponse(e));
            }
        });

        /**
         * Get item
         */
        app.get('/item/bycode/:id', async function (req, res) {
            let id = req.params.id;
            try {
                let result = await that.contracts.ecmaPromise.callMethodRollback(DETALIST_CONTRACT_ADDRESS, 'getItemByCode', [id], {});
                res.send(that.jsonOkResponse(JSON.parse(result)))
            } catch (e) {
                res.send(that.jsonErrorResponse(e));
            }
        });

        /**
         * New freelancer status
         */
        app.post('/item/create', async function (req, res) {
            let code = req.body.code;
            let type = req.body.type;
            let addedBy = req.body.addedBy;
            let bench = req.body.bench;
            let params = req.body.params; //TODO: Чблин делать?
            try {
                params = JSON.parse(params);
            } catch (e) {
            }
            let parts = [];

            if(Array.isArray(req.body['parts[]'])) {
                parts = req.body['parts[]'];
            } else if(req.body['parts[]']) {
                parts = [req.body['parts[]']];
            }

            let additionalInfo = req.body.additionalInfo;
            if(!code || !type || !addedBy || !bench || !params || !Array.isArray(parts)) {
                return res.send(that.jsonErrorResponse('One of requied param not found'))
            }

            try {
                let result = await that.contracts.ecmaPromise.deployMethod(DETALIST_CONTRACT_ADDRESS, 'addItem', [code, type, addedBy, bench, params, parts, additionalInfo], {});
                res.send(that.jsonOkResponse({newBlock: result}))
            } catch (e) {
                res.send(that.jsonErrorResponse(e));
            }
        });


        /**
         * Get freelancer status list
         */
        this.network.rpc.registerGetHandler('/freelancers/statusList/:hash', async function (req, res) {
            let hash = req.params.hash;
            that.ecmaContract.events.getContractEvents(DETALIST_CONTRACT_ADDRESS, 'NewStatus', {additionalStatement: 'AND `v1` = "' + hash + '" '}, function (err, values) {

                values = values.map(function (val) {
                    return {
                        block: val.block,
                        blockHash: val.hash,
                        hash: val.v1,
                        status: val.v2,
                        sender: val.v3,
                        date: Number(val.timestamp)
                    };
                });
                res.send(that.jsonOkResponse({list: values}));
            });
        });


        /**
         * Get main token balance
         */
        this.network.rpc.registerGetHandler('/token/balance/:address', async function (req, res) {
            let address = req.params.address;
            let mainToken = new TokenContractConnector(that.ecmaContract, that.getMasterContractAddress());
            res.send(that.jsonOkResponse(await mainToken.balanceOf(address)));
        });

    }


    /**
     * Error response
     * @param error
     * @return {{errorMessage: *, error: boolean}}
     */
    jsonErrorResponse(error) {
        if(typeof error === 'string') {
            return {error: true, errorMessage: error};
        }
        return {error: true, errorMessage: error.message};
    }

    /**
     * Reponse ok
     * @param data
     * @return {{data: *, error: boolean}}
     */
    jsonOkResponse(data) {
        return {error: false, data: data}
    }


}

module.exports = App;