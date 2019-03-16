'use strict';

const eabi = require('ethereumjs-abi');
const solc = require('solc');
const cmd = require('minimist')(process.argv.slice(2));
const fs = require('fs');
const path = require('path');

//var files = ['Saver.sol']; 
//var contract = undefined; 
//var types = 'uint256'; 
//var values = '1000000000000000000'; 
//var output = '.';
//var runs = Number("200");

var files = cmd._;
var contract = cmd.c;
var types = cmd.t;
var values = cmd.v;
var output = cmd.o || '.';
var runs = Number(cmd.r);

//console.log(values);
//console.log(cmd);

let err = 'You have to specify solidity file names and contract name';
if (runs && isNaN(runs)) abort("Error in runs number");
if (!files) abort(err);
for (let i = 0; i < files.length; i++)
{
    if (files[i].substr(files[0].length - 4, files[0].length - 1) !== '.sol')
    {
        abort(err);
        break;
    }
}
if (!contract)
{
    if (files.length === 1)
    {
        contract = files[0].substr(0, files[0].length - 4);
    }
    else
    {
        abort(err);
    }
}

var sources = {};

for (let i = 0; i < files.length; i++)
{
    try
    {
        sources[files[i]] = { content: fs.readFileSync(files[i]).toString() };
    }
    catch (e)
    {
        abort('Error reading ' + files[i] + ': ' + e);
    }
}
const params =
{
    language: "Solidity",
    sources: sources,
    settings:
    {
        optimizer:
        {
            enabled: (runs ? true : false),
            "runs": (runs ? runs : 200)
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
    for (var error in compiled['errors'])
    {
        var message = compiled['errors'][error];
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

var compileData = compiled.contracts[contract + '.sol'][contract];
if (!compileData) abort('Contract name is not as file name');

var byteCode = compileData.evm.bytecode.object.toString();
var abi = JSON.stringify(compileData.abi);

if (types && values)
{
    let t = (types + '').split("~");
    let v = (values + '').split("~");
    if (t.length === v.length)
    {
        let aux = eabi.rawEncode(t, v).toString('hex');
        if (aux) byteCode += aux;
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
