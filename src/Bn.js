/* Bn - a JavaScript arbitrary precision number class
 *      primarily meant for code golfing
*/

function Bn(value) {

	// If 'this' is not a Bn, create one.
	if (!(this instanceof Bn)) {
		return new Bn(value);
	}

	// We don't support undefined or NaN, so just return
	// 'this'.
	if (value === undefined || value !== value) {
		return this;
	}

	// Parse the value
	return Bn.parse(value);
}

Bn.parse = function (value) {
	// If it's already a Bn, return a clone.
	if (value instanceof Bn)
		return value.clone();

	var orig = value;
	var result = new Bn();
	result.data = [];
	result.decs = 0;
	result.sign = 0;

	// Force input to be a string if it isn't already
	if (typeof value !== "string") {
		value += ""; 
	}

	// Remove commas and whitespace and underscores.
	value = value.replace(/[,_\s]/g, "");

	// At this point, we check if the input is invalid, and throw a SyntaxError if it is.
	if (!/^[+-]?(\d+\.\d*|\.\d+)?(e[+-]?\d+)?$/.test(value)) {
		throw new SyntaxError("Invalid Bn: " + orig);
	}

	// If value contains a non-zero digit:
	//   If the first char in x is "-", the sign is -1.
	//   Otherwise, the sign is +1.
	if (/^[^e]*[1-9]/i.test(value)) {
		if (value[0] === "-") {
			result.sign = -1;
			value = value.slice(1);
		} else {
			result.sign = +1;
		}
	}

	// Testing for scientific notation
	if (/e([+-]?\d+)$/i.test(value)) {
		// The +x or -x part
		var power = value.match(/e([+-]?\d+)$/i)[1]
		var decs = Number(power);

		// Remove the scientific part
		value = value.replace(/e([+-]?\d+)$/i, "");
		
		// Interpret "eX" as "1eX"
		if (value === "") {
			value = "1";
		}
		
		// The minimum number of decimals that will end up in the data
		result.decs = Math.floor(decs * -1/3); 
		decs = decs % 3;

		// Special cases where in the non-scientific part:
		// - the decimal point has to be manually shifted, and/or
		// - zeroes have to be added or removed.
		if (decs === +1) {
			if (/\.(.)/.test(value)) {
				value = value.replace(/\.(.)/, "$1.");
			} else {
				value = value.replace(/\.?$/, "0");
			}
		} else if (decs === +2) {
			if (/\.(..)/.test(value)) {
				value = value.replace(/\.(..)/, "$1.");
			} else if (/\.(.)/ .test(value)) {
				value = value.replace(/\.(.)/, "$10.");
			} else {
				value = value.replace(/\.?$/, "00");
			}
		} else if (decs === -1) {
			if (/(.)\./.test(value)) {
				value = value.replace(/(.)\./, ".$1");
			} else if (/\./.test(value)) {
				value = value.replace(/\./, ".0");
			} else if (/0$/.test(value)) {
				value = value.replace(/0$/, "");
			} else if (/(.)$/.test(value)) {
				value = value.replace(/(.)$/, ".$1");
			}
		} else if (decs === -2) {
			if (/(..)\./.test(value)) {
				value = value.replace(/(..)\./, ".$1");
			} else if (/(.)\./.test(value)) {
				value = value.replace(/(.)\./, ".0$1");
			} else if (/\./.test(value)) {
				value = value.replace(/\./, ".00");
			} else if (/00$/.test(value)) {
				value = value.replace(/00$/, "");
			} else if (/(.)0$/.test(value)) {
				value = value.replace(/(.)0$/, ".$1");
			} else if (/(..)$/.test(value)) {
				value = value.replace(/(..)$/, ".$1");
			} else if (/(.)$/.test(value)) {
				value = value.replace(/(.)$/, ".0$1");
			}
		}
	}
	
	// Add extra zeroes to the decimal part for proper parsing.
	if (/\./.test(value)) {
		value = value + "00";
	}

	// While there are at least three decimal digits, add the first three to the beginning of the data.
	for (;/\.(...)/.test(value);result.decs++) {
		var dec = Number(value.match(/\.(...)/)[1])
		result.data.unshift(dec);
		value = value.replace(/\.(...)/, ".");
	}

	// Remove decimal point and extraneous zeroes.
	value = value.replace(/\..*/, "");

	// While there are digits left in value, add the last three to the end of data.
	while (value) {
		result.data.push(Number(value.slice(-3)));
		value = value.slice(0, -3);
	}

	// Remove all extraneous zeroes from the data.
	while (result.data.length > 1 && result.data[0] === 0) {
		result.data.splice(0, 1);
		result.decs--;
	}

	while (result.data.length > 1 && result.data.slice(-1)[0] === 0) {
		result.data.splice(-1, 1);
	}

	return result;
};

// Aligns the data of two values by padding either side with zeroes.
Bn.align = function (a, b) {
	var target, difference = Math.abs(a.decs - b.decs);
	
	if (a.decs < b.decs) {
		target = a;
	} else {
		target = b;
	}

	for (/*...*/; Math.abs(a.decs - b.decs); target.decs++){
		target.data.unshift(0);
	}

	if (a.data.length < b.data.length) {
		target = a.data;
	} else {
		target = b.data;
	}

	for (/*...*/; Math.abs(a.data.length - b.data.length); target.push(0))
		/*...*/;
	
	while (1 in a.data && 1 in b.data && a.data[0] === 0 && b.data[0] === 0) {
		a.data.shift();
		b.data.shift();
		a.decs--;
		b.decs--;
	}
	
	while (1 in a.data && 1 in b.data && a.data.slice(-1)[0] === 0 && b.data.slice(-1)[0] === 0) {
		a.data.pop();
		b.data.pop();
	}
};

// Compare two Bn's
Bn.compare = function (a, b, options = {}) {
	
	// If the numbers are not already aligned,
	// align them.
	if (!options.aligned) {
		Bn.align(a, b);
	}

	// If the comparison should take the signs into
	// account and the signs are different, the
	// sign of a should be returned.
	if (!opts.ignoreSign && a.sign !== b.sign) {
		return a.sign;
	}

	// Now we have to compare the values number by
	// number.
	for (let i = a.data.length - 1; i > 0; i--) {
		if (a.data[i] < b.data[i]) {
			if (!opts.ignoreSign) {
				return -a.sign;
			} else {
				return -1;
			}
		} else if (a.data[i] > b.data[i]) {
			if (!opts.ignoreSign) {
				return +a.sign;
			} else {
				return +1;
			}
		}
	}

	// They don't differ, so they are equal.
	return 0;
}

// Returns a clone of the Bn, optionally overwriting an existing one.
Bn.prototype.clone = function (target = new Bn()) {
	target.data = [...this.data];
	target.decs = this.decs;
	target.sign = this.sign;
	return target;
}

Bn.prototype.toString = function (base = 10) {
	// TODO: implement base
	let decs = this.decs;
	let result = "";
	
	// Align this with 1 to ensure we have enough decimal places to get to the units digit
	Bn.align(this, new Bn(1));
	
	for (let item of this.data) {
		// If we're at the decimal point, add one
		if (decs-- === 0)
			result = "." + result;
		
		// Make sure to pad to a length of three digits
		result = ("00" + item).slice(-3) + result;
	}
	
	// Remove trailing zeroes
	result = result.replace(/(\..*?)0+$/g, "$1");
	
	// Remove trailing decimal point
	result = result.replace(/\.$/g, "");
	
	// Remove leading zeroes
	result = result.replace(/^0+(?!\.)/g, "");
	
	// Optionally add a minus sign
	if (this.sign === -1)
		result = "-" + result;
	
	return result;
}

/*
 * Comparison functions
 *
 *				arguments			return
 * =========================================
 * - compare 	b: Bn convertable	-1: a < b
 *   cmp        options: Object		 0: a == b
 * 									 1: a > b
 *
 * - less 		b: Bn convertable	a < b
 *   lt 		options: Object
 * 
 * - lte 		b: Bn convertable	a <= b
 *      		options: Object
 * 
 * - equal 		b: Bn convertable	a == b
 *   eq 		options: Object
 *
 * - gte 		b: Bn convertable 	a >= b
 * 				options: Object
 *
 * - greater 	b: Bn convertable	a > b
 *   gt 		options: Object
 *
*/

Bn.prototype.compare = Bn.prototype.cmp = function (b, options) {
	return Bn.compare(this, Bn.parse(b), opts);
};

Bn.prototype.less = Bn.prototype.lt = function (b, opts) {
	return Bn.compare(this, Bn.parse(b), opts) === -1;
};

Bn.prototype.lte = function (b, opts) {
	return Bn.compare(this, Bn.parse(b), opts) < 1;
};

Bn.prototype.equal = Bn.prototype.eq = function (b, opts) {
	return Bn.compare(this, Bn.parse(b), opts) ===  0;
};

Bn.prototype.gte = function (b, opts) {
	return Bn.compare(this, Bn.parse(b), opts) > -1;
};

Bn.prototype.greater = Bn.prototype.gt = function (b, opts) {
	return Bn.compare(this, Bn.parse(b), opts) === +1;
};

/*
 * Maths!
 */
Bn.prototype.negate = Bn.prototype.n = function (/* optional args? */) {
	this.sign *= -1;
	return this;
}

Bn.prototype.add = Bn.prototype.a = function (...args) {

	// Default argument
	if (args.length === 0) {
		args = [1];
	}

	for (var argument of args) {
		let other = BigNumber(argument);

		if (other.sign === 0) {
			// If other doesn't have a sign (is zero),
			// skip this.
			continue;
		} else if (this.sign === 0){
			// If this doesn't have a sign (is zero),
			// just copy everything over.
			other.clone(this);
		} else if (this.sign === other.sign) {
			// Align the values
			Bn.align(this, other);

			// Do the addition
			for (var carry = j = 0; j < other.data.length; j++) {
				this.data[j] += other.data[j] + carry;
				carry = +(this.data[j] >= 1e3);
				this.data[j] %= 1e3;
			}

			// If we still need to carry one, append it.
			if (carry !== 0) {
				this.data.push(1);
			}
		} else {
			// Align the values
			Bn.align(this, other);
			
			// Modify the sign
			this.sign = this.sign * this.cmp(other, {aligned: true, ignoreSign: true});

			// Do the addition
			for (carry = j = 0; j < this.data.length; j++) {
				this.data[j] -= other.data[j] + carry;
				carry = +(this.data[j] < 0);
				this.data[j] += 1e3;
				this.data[j] %= 1e3;
			}

			// If there still is something left to carry, carry it.
			if (carry !== 0) {
				var c = 0;
				this.data = this.data.map((x, y)=>(x-=c)>0?(y?999:1e3)-x:(c=1,0));
			}
		}
	}
	return this;
};

// Default argument is handled by Bn.add()
Bn.prototype.subtract = Bn.prototype.s = function(...a) {
	return this.add(...a.map(b => Bn(b).negate()));
}

if (typeof module === "object") module.exports = Bn;
