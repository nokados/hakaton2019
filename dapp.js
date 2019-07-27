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

/**
 * Detalist contract address
 * @type {string}
 */
const DETALIST_CONTRACT_ADDRESS = '30';

const logger = new (require(global.PATH.mainDir + '/modules/logger'))("Detalist");
const storj = require(global.PATH.mainDir + '/modules/instanceStorage');
const DApp = require(global.PATH.mainDir + '/app/DApp');
const TokenContractConnector = require(global.PATH.mainDir + '/modules/smartContracts/connectors/TokenContractConnector');
const fs = require('fs');


let that;

const express = require('express');
const app = express();

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

        app.listen(that.config.application.httpPort, function () {
            console.log('Detalist started at ' + that.config.application.httpPort);
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
         * Booked now list
         */
        this.network.rpc.registerGetHandler('/freelancers/bookedNow', async function (req, res) {
            that.ecmaContract.events.rawQuery('SELECT v1 as hash, v2 as projectId, v3 as untilDate FROM `events` WHERE `event` = "ChangeBookStatus" GROUP BY v1 HAVING v2 is not null AND v2 != ""', false, function (err, val) {
                res.send(that.jsonOkResponse({list: val}));
            });
        });

        /**
         * Get freelancer
         */
        this.network.rpc.registerGetHandler('/freelancers/:hash', async function (req, res) {
            let hash = req.params.hash;
            try {
                let result = await that.contracts.ecmaPromise.callMethodRollback(DETALIST_CONTRACT_ADDRESS, 'getFreelancer', [hash], {});
                res.send(that.jsonOkResponse(JSON.parse(result)))
            } catch (e) {
                res.send(that.jsonErrorResponse(e));
            }
        });

        /**
         * Create freelancer
         */
        that.network.rpc.registerPostHandler('/freelancers/create', async function (req, res) {
            let hash = req.body.hash;
            let status = '1';
            if(!hash) {
                return res.send(that.jsonErrorResponse('hash not found'))
            }

            try {
                let result = await that.contracts.ecmaPromise.deployMethod(DETALIST_CONTRACT_ADDRESS, 'createFreelancer', [hash, status], {});
                res.send(that.jsonOkResponse({newBlock: result}))
            } catch (e) {
                res.send(that.jsonErrorResponse(e));
            }
        });

        /**
         * Delete freelancer
         */
        that.network.rpc.registerPostHandler('/freelancers/delete', async function (req, res) {
            let hash = req.body.hash;
            if(!hash) {
                return res.send(that.jsonErrorResponse('hash not found'))
            }

            try {
                let result = await that.contracts.ecmaPromise.deployMethod(DETALIST_CONTRACT_ADDRESS, 'deleteFreelancer', [hash], {});
                res.send(that.jsonOkResponse({newBlock: result}))
            } catch (e) {
                res.send(that.jsonErrorResponse(e));
            }
        });

        /**
         * Update freelancer
         */
        that.network.rpc.registerPostHandler('/freelancers/update', async function (req, res) {
            let hash = req.body.hash;
            if(!hash) {
                return res.send(that.jsonErrorResponse('hash not found'))
            }

            try {
                let result = await that.contracts.ecmaPromise.deployMethod(DETALIST_CONTRACT_ADDRESS, 'updateFreelancer', [hash], {});
                res.send(that.jsonOkResponse({newBlock: result}))
            } catch (e) {
                res.send(that.jsonErrorResponse(e));
            }
        });

        /**
         * New freelancer status
         */
        that.network.rpc.registerPostHandler('/freelancers/newStatus', async function (req, res) {
            let hash = req.body.hash;
            let status = req.body.status;
            let sender = req.body.sender;
            let senderOnBehalf = req.body.senderOnBehalf;
            if(!hash || !status || !sender || !senderOnBehalf) {
                return res.send(that.jsonErrorResponse('hash, status, senderOnBehalf or sender not found'))
            }

            try {
                let result = await that.contracts.ecmaPromise.deployMethod(DETALIST_CONTRACT_ADDRESS, 'newStatus', [hash, status, sender, senderOnBehalf], {});
                res.send(that.jsonOkResponse({newBlock: result}))
            } catch (e) {
                res.send(that.jsonErrorResponse(e));
            }
        });

        /**
         * Skill proofing
         */
        that.network.rpc.registerPostHandler('/freelancers/proofSkill', async function (req, res) {
            let hash = req.body.hash;
            let skill = req.body.skill;
            let skillType = req.body.skillType;
            let approved = req.body.approved;
            let sender = req.body.sender;
            let senderOnBehalf = req.body.senderOnBehalf;
            if(!hash || !skill || !sender || !senderOnBehalf || !skillType || typeof approved === 'undefined') {
                return res.send(that.jsonErrorResponse('hash, skill, sender, senderOnBehalf, skillType or approved not found'))
            }

            try {
                let result = await that.contracts.ecmaPromise.deployMethod(DETALIST_CONTRACT_ADDRESS, 'proofSkill', [hash, skill, skillType, approved, sender, senderOnBehalf], {});
                res.send(that.jsonOkResponse({newBlock: result}))
            } catch (e) {
                res.send(that.jsonErrorResponse(e));
            }
        });


        /**
         * New freelancer project mark
         */
        that.network.rpc.registerPostHandler('/freelancers/newMark', async function (req, res) {
            let hash = req.body.hash;
            let projectHash = req.body.projectHash;
            let type = req.body.type;
            let mark = req.body.mark;
            let sender = req.body.sender;
            let senderOnBehalf = req.body.senderOnBehalf;
            if(!hash || !projectHash || !type || !sender || !senderOnBehalf || typeof mark === 'undefined') {
                return res.send(that.jsonErrorResponse('hash, projectHash, senderOnBehalf, type, mark, sender not found'))
            }

            try {
                let result = await that.contracts.ecmaPromise.deployMethod(DETALIST_CONTRACT_ADDRESS, 'newMark', [hash, projectHash, type, mark, sender, senderOnBehalf], {});
                res.send(that.jsonOkResponse({newBlock: result}))
            } catch (e) {
                res.send(that.jsonErrorResponse(e));
            }
        });

        /**
         * Book freelancer
         */
        that.network.rpc.registerPostHandler('/freelancers/bookFreelancer', async function (req, res) {
            let hash = req.body.hash;
            let projectHash = req.body.projectHash;
            let busyTo = req.body.busyTo;
            let sender = req.body.sender;
            let senderOnBehalf = req.body.senderOnBehalf;
            if(!hash || !projectHash || !busyTo || !sender || !senderOnBehalf) {
                return res.send(that.jsonErrorResponse('hash, projectHash, senderOnBehalf, busyTo, sender not found'))
            }

            try {
                let result = await that.contracts.ecmaPromise.deployMethod(DETALIST_CONTRACT_ADDRESS, 'bookFreelancer', [hash, projectHash, busyTo, sender, senderOnBehalf], {});
                res.send(that.jsonOkResponse({newBlock: result}))
            } catch (e) {
                res.send(that.jsonErrorResponse(e));
            }
        });

        /**
         * UnBook freelancer
         */
        that.network.rpc.registerPostHandler('/freelancers/unbookFreelancer', async function (req, res) {
            let hash = req.body.hash;
            let sender = req.body.sender;
            let senderOnBehalf = req.body.senderOnBehalf;
            if(!hash || !sender || !senderOnBehalf) {
                return res.send(that.jsonErrorResponse('hash, sender, senderOnBehalf not found'))
            }

            try {
                let result = await that.contracts.ecmaPromise.deployMethod(DETALIST_CONTRACT_ADDRESS, 'unbookFreelancer', [hash, sender, senderOnBehalf], {});
                res.send(that.jsonOkResponse({newBlock: result}))
            } catch (e) {
                res.send(that.jsonErrorResponse(e));
            }
        });

        /**
         * Transfer from any wallet to any wallet
         */
        that.network.rpc.registerPostHandler('/freelancers/transfer', async function (req, res) {
            let from = req.body.from;
            let to = req.body.to;
            let amount = String(req.body.amount);
            if(!from || !to || !amount) {
                return res.send(that.jsonErrorResponse('from, to, amount not found'))
            }

            try {
                let result = await that.contracts.ecmaPromise.deployMethod(that.getMasterContractAddress(), 'transferFromTo', [from, to, amount], {});
                res.send(that.jsonOkResponse({newBlock: result}))
            } catch (e) {
                res.send(that.jsonErrorResponse(e));
            }
        });

        /**
         * Mint tokens
         */
        that.network.rpc.registerPostHandler('/freelancers/mint', async function (req, res) {
            let amount = String(req.body.amount);
            if(!amount) {
                return res.send(that.jsonErrorResponse('amount not found'))
            }

            try {
                let result = await that.contracts.ecmaPromise.deployMethod(that.getMasterContractAddress(), 'mint', [amount], {});
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