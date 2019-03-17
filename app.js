'use strict';

const eabi = require('ethereumjs-abi');
const solc = require('solc');
const cmd = require('minimist')(process.argv.slice(2));
const fs = require('fs');
const path = require('path');

//var file = '..\\Q.sol';
//var cparams = ['uint256=1000000000000000000', 'address=0xf9b46A64D1A0CA972DCb249Ce22a40d07BB854Ae']; 
//var contract = undefined; 
//var output = '.';
//var runs = Number("200");

var file = cmd.f;
var cparams = cmd._;
var contract = cmd.c;
var output = cmd.o || '.';
var runs = Number(cmd.r);

//console.log(cparams);
//console.log(cmd);

let err = 'You have to specify solidity file name and contract name';
if (runs && isNaN(runs)) abort("Error in runs number");
if (!file) abort(err);
if (!contract)
{
    contract = path.basename(file);
    let ext = path.extname(file);
    contract = contract.substr(0, contract.length - ext.length);
}

var sources = {};
try
{
    sources[contract] = { content: fs.readFileSync(file).toString() };
}
catch (e)
{
    abort('Error reading ' + file + ': ' + e.toString());
}

const params =
{
    language: "Solidity",
    sources: sources,
    settings:
    {
        optimizer:
        {
            enabled: runs ? true : false,
            "runs": runs ? runs : 200
        },
        outputSelection:
        {
            "*":
            {
                "*": ["abi", "evm.bytecode"]
            }
        }
    }
};

const compiled = JSON.parse(solc.compileStandardWrapper(JSON.stringify(params)));
if (!compiled)
{
    abort('No output from compiler');
}
else if (compiled['errors'])
{
    for (let error in compiled['errors'])
    {
        let message = compiled['errors'][error];
        if (message.severity === 'warning')
        {
            console.log(message.formattedMessage);
        }
        else
        {
            console.error(message.formattedMessage);
        }
    }
    process.exit(1);
}

var compileData = compiled.contracts[contract][contract];
if (!compileData) abort('No such contract');

var byteCode = compileData.evm.bytecode.object.toString();
var abi = JSON.stringify(compileData.abi);

if (cparams)
{
    let t = new Array(cparams.length);
    let v = new Array(cparams.length);
    let err = 'Error in constructor parameters';
    for (let i = 0; i < cparams.length; i++)
    {
        let aux = cparams[i].split('=');
        if (aux.length !== 2) abort(err);
        t[i] = aux[0];
        v[i] = aux[1];
        if (t[i] === 'string') v[i] = v[i].replace("_", " ");  
    }
    console.log('types = ' + t);
    console.log('values = ' + v);
    let aux;
    try
    {
        aux = eabi.rawEncode(t, v).toString('hex');
    }
    catch (e)
    {
        abort(e.toString());
    }     
    if (aux)
    {
        byteCode += aux;
    }
    else
    {
        abort(err);
    }
}

writeFile(contract + '.bin', byteCode);
writeFile(contract + '.abi', abi);

function abort(msg)
{
    console.error(msg || 'Error occured');
    process.exit(1);
}

function writeFile(file, content)
{
    file = path.join(output, file);
    fs.writeFile(file, content, function (err)
    {
        if (err)
        {
            console.error('Failed to write ' + file + ': ' + err);
        }
    });
}
