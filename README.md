# ritik
Позволяет компилировать смарт контракты Solidity, добавляя в выходной байткод параметры конструктора.
Параметры конструктора в формате ABI hex так же выводятся в отдельный файл.
Копиляция происходит при помщи solc.
Параметры конструктора преобразуются в байт код при помощи ethereumjs-abi.

**Программа тщательно не тестировалась, т.е. могут быть ошибки.**

## Установка
Для работы необходимы только файлы _app.js_ и _pakage.json_.
В системе должен быть установлен Node JS и npm. Для установки требующихся зависимостей нужно выполнить в папке с _app.js_:
```bash
npm i
```

## Параметры командной строки
Необходимо указать файл _.sol_ для компиляции с ключём _-f_.
Если имя контракта, который нужно скомпилировать, отличается от имени файла, то нужно явно указать имя контракта с ключём _-c_.

Если в контракте есть конструктор, для которого нужно задать параметры, то сначала задаётся тип параметра, затем ставится символ "=", далее указывается значение параметра. Через пробел аналогичным образом задаются остальные параметры. Для строковых параметров, содержащих пробел, вместо пробела следует использовать символ подчёркивания "_", который автоматически заменится на пробел.

Компилятор solc позволяет проводить оптимизацию выходного байткода с параметром runs. Для включения оптимизации нужно указать ключ _-r_ и число, соответствующее параметру runs компилятора solc.

Указать путь для выходных файлов можно с ключём -o.

### Пример:
```bash
node app.js uint256=1000000000000000000 address=0xf9b46A64D1A0CA972DCb249Ce22a40d07BB854Ae string=hello_world! -f MyContract.sol -r 200
```
В результате работы этого примера, будет сгенерирован файл _MyContract.bin_, содержащий байт код скомпилированного контракта _MyContract_, с добавленными к нему значениями параметров конструктора, файл _Constructor.bin_, в котором будут отдельно параметры конструктора в виде байт кода и файл _MyContract.abi_, содержащий JSON ABI.