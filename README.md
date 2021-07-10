# **konsol**
**very poggers `ts/js` console output**
```
npm i --save konsol
```
↑↑↑ do this

# very poggers features

- ## **node-style formatting in console output**
  
  - without inserting awkward spaces between arguments.
    ### [`typescript`](https://github.com/microsoft/TypeScript) example:

    ```ts
    import konsol from 'konsol';

    // ↓↓↓ cringe
    console.log('very cringe console', { output: true }); // very cringe console { output: true }

    // ↓↓↓ poggers
    konsol.log('very poggers konsol ', { output: true }); // very poggers konsol { output: true } <notice the trailing space in the first argument>
    ```
    this gives much more control over console output and allows fun things to happen.
- ## **the same vanilla javascript string substitution**
  - compatibility with `console.log` statements!
    ### [`typescript`](https://github.com/microsoft/TypeScript) example:

    ```ts
    import konsol from 'konsol';

    // ↓↓↓ vanilla
    console.log('i think the %s is not very good!', 'vanilla javascript console'); // i think the vanilla javascript console is not very good!

    // ↓↓↓ konsol
    konsol.log('i think %s is very good!', 'konsol'); // i think konsol is very good! 
    ```
- ## **very snazzy 🎉 function formatting**
  - looks nice and also at the same time not ugly!
    ### [`typescript`](https://github.com/microsoft/TypeScript) example:

    ```ts
    import konsol from 'konsol';

    const sum = (...nums: number[]) => nums.reduce((i, num) => i + num);

    // ↓↓↓ 🎉
    konsol.log(sum); // sum(...nums) => ...

    // ↓↓↓ anonymous functions
    konsol.log((a: number, b: number) => a - b); // [anonymous] (a, b) => ...
    ```
  - also has support for function call chains:
    ### [`typescript`](https://github.com/microsoft/TypeScript) example:

    ```ts
    import konsol from 'konsol';

    const sum = (...nums: number[]) => nums.reduce((i, num) => i + num);

    // ↓↓↓ 🎉
    konsol.log(konsol.formatFunctionCall(sum, [0, 1, 55, 208])); // sum(0, 1, 55, 208) => 264

    // ↓↓↓ anonymous functions
    konsol.log(konsol.formatFunctionCall((a: number, b: number) => a - b, [0, 1])); // [anonymous] (0, 1) => -1
    ```