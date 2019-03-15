'use strict';

const abi = require('ethereumjs-abi');
const solc = require('solc');
const cmd = require('minimist')(process.argv.slice(2));
const fs = require('fs');

const files = cmd._;
const contract = cmd.c;
const types = cmd.t;
const values = cmd.v;
const output = cmd.o;

console.log(files);
console.log(cmd);

if (files === undefined || contract === undefined)
{
    abort('Вы должны указать имя файла для компиляции и имя контракта.');
}

var sources = {};

for (var i = 0; i < files.length; i++)
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
else if (output['errors'])
{
    for (var error in output['errors'])
    {
        var message = output['errors'][error];
        if (message.severity === 'warning')
        {
            console.log(message.formattedMessage);
        }
        else
        {
            console.error(message.formattedMessage);
        }
    }
}

function abort(msg)
{
    console.error(msg || 'Error occured');
    process.exit(1);
}

//console.log('Hello world');
