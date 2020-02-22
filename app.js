'use strict';

let eabi, solc, cmd, fs, path;

try
{
    eabi = require('ethereumjs-abi');
    solc = require('solc');
    cmd = require('minimist')(process.argv.slice(2));
    fs = require('fs');
    path = require('path');
}
catch (e)
{
    abort('You have to run "npm i" before using this tool');
}

//var file = '..\\Q.sol';
//var cparams = ['uint256=1000000000000000000', 'address=0xf9b46A64D1A0CA972DCb249Ce22a40d07BB854Ae']; 
//var contract = undefined; 
//var output = '.';
//var runs = Number("200");

const file = cmd.f;
const cparams = cmd._;
let contract = cmd.c;
const output = cmd.o || '.';
const runs = Number(cmd.r);

if (cmd.help)
{
    let helpMsg = 'Позволяет компилировать смарт контракты Solidity, добавляя в выходной байткод\nпараметры конструктора.\n\nПараметры конструктора в формате ABI hex так же выводятся в отдельный файл.\n\nКопиляция происходит при помщи solc.\n\nПараметры конструктора преобразуются в байт код при помощи ethereumjs-abi.\n\nПуть для файла .sol, который требуется откомпилировать, нужно указать с ключём -f.\n\nЕсли имя контракта, который нужно скомпилировать, отличается от имени файла,\nто нужно явно указать имя контракта с ключём -c.\n\nЕсли в контракте есть конструктор, для которого нужно задать параметры, то\nсначала задаётся тип параметра, затем ставится символ "=", далее указывается\nзначение параметра. Через пробел аналогичным образом задаются\nостальные параметры. Для строковых параметров, содержащих пробел, вместо\nпробела следует использовать символ подчёркивания "_", который\nавтоматически заменится на пробел.\n\nКомпилятор solc позволяет проводить оптимизацию выходного байткода с\nпараметром runs. Для включения оптимизации нужно указать ключ -r и число,\nсоответствующее параметру runs компилятора solc.\n\nУказать путь для выходных файлов можно с ключём -o.\n\nПример:\nnode app.js uint256=1000000000000000000 address=0xf9b46A64D1A0CA972DCb249Ce22a40d07BB854Ae string=helloworld! -f MyContract.sol -r 200\n\nВ результате работы этого примера, будет сгенерирован файл MyContract.bin,\nсодержащий байт код скомпилированного контракта MyContract, с добавленными\nк нему значениями параметров конструктора, файл Constructor.bin, в котором\nбудут отдельно параметры конструктора в виде байт кода и файл MyContract.abi,\nсодержащий JSON ABI.';
    abort(helpMsg, 0);
}

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

let sources = {};
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

const compiled = JSON.parse(solc.compile(JSON.stringify(params)));
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

let compileData = compiled.contracts[contract][contract];
if (!compileData) abort('No such contract');

let bin = JSON.stringify(compileData.evm.bytecode);
let abi = JSON.stringify(compileData.abi);

if (cparams.length > 0)
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
//        byteCode += aux;
        writeFile("Constructor.bin", aux);
    }
    else
    {
        abort(err);
    }
}

writeFile(contract + '.bin', bin);
writeFile(contract + '.abi', abi);

function abort(msg, exitCode)
{
    console.error(msg || 'Error occured');
    process.exit(exitCode || 1);
}

function writeFile(file, content)
{
    if (!fs.existsSync(output)) fs.mkdirSync(output);
    file = path.join(output, file);
    fs.writeFile(file, content, function (err)
    {
        if (err)
        {
            console.error('Failed to write ' + file + ': ' + err);
        }
    });
}
