let Bn = require('../src/Bn');

// Basic creation tests
console.log(Bn(123));
console.log(new Bn(123));
console.log(Bn.parse(123));

// Tests with various values
console.log(new Bn(123000));
console.log(new Bn(0.000456));
console.log(new Bn(123.456));
console.log(new Bn(1000.0006));
console.log(new Bn(-1));
console.log(new Bn("1"));
console.log(new Bn("-1"));
console.log(new Bn("1e10"));
console.log(new Bn("1e-10"));

// .toString() tests
console.log(new Bn(1) + "");
console.log(new Bn(1234000) + "");
console.log(new Bn(0.0005678) + "");
console.log(new Bn(1234000.0005678) + "");
console.log(new Bn(12).negate() + "");
