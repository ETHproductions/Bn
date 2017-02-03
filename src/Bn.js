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
	
	// Handle inputs like "e-3".
	if (value[0] === "e") {
		value = "1" + value;
	}

	// At this point, we check if the input is invalid, and throw a SyntaxError if it is.
	if (!/^[+-]?(\d+\.?\d*|\.\d+)(e[+-]?\d+)?$/.test(value)) {
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
	if (!options.ignoreSign && a.sign !== b.sign) {
		return a.sign;
	}

	// Now we have to compare the values number by
	// number.
	for (let i = a.data.length - 1; i > 0; i--) {
		if (a.data[i] < b.data[i]) {
			if (!options.ignoreSign) {
				return -a.sign;
			} else {
				return -1;
			}
		} else if (a.data[i] > b.data[i]) {
			if (!options.ignoreSign) {
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

// Removes all leading and trailing zeroes.
Bn.prototype.clean = function () {
	// Remove leading zeroes
	while (this.data[0] === 0) {
		this.data.shift();
		this.decs--;
	}
	
	// Remove trailing zeroes
	while (this.data.slice(-1)[0] === 0) {
		this.data.pop();
	}
	
	// Handle the case of zero
	if (this.data.length === 0) {
		this.data = [0];
		this.decs = 0;
	}
	
	return this;
}

Bn.prototype.toString = function (base = 10) {
	// TODO: implement base
	let decs = this.decs;
	let result = "";
	
	// Align this with 1 to ensure we have enough decimal places to get to the units digit
	Bn.align(this, new Bn(1));
	
	if (base === 10) {
		for (let item of this.data) {
			// If we're at the decimal point, add one
			if (decs-- === 0)
				result = "." + result;

			// Make sure to pad to a length of three digits
			result = ("00" + item).slice(-3) + result;
		}
	} else {
		// I don't think this is possible without adding a few more functions
		throw new RangeError("Cannot yet convert Bn to bases other than 10");
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
	return Bn.compare(this, Bn.parse(b), options);
};

Bn.prototype.less = Bn.prototype.lt = function (b, options) {
	return Bn.compare(this, Bn.parse(b), options) === -1;
};

Bn.prototype.lte = function (b, options) {
	return Bn.compare(this, Bn.parse(b), options) < 1;
};

Bn.prototype.equal = Bn.prototype.eq = function (b, options) {
	return Bn.compare(this, Bn.parse(b), options) ===  0;
};

Bn.prototype.gte = function (b, options) {
	return Bn.compare(this, Bn.parse(b), options) > -1;
};

Bn.prototype.greater = Bn.prototype.gt = function (b, options) {
	return Bn.compare(this, Bn.parse(b), options) === +1;
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
	
	// Flatten array
	args = [].concat.apply([], args)
	
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
	return this.clean();
};

// Default argument is handled by Bn.add()
Bn.prototype.subtract = Bn.prototype.s = function(...a) {
	return this.add(...a.map(b => Bn(b).negate()));
}

Bn.prototype.multiply = Bn.prototype.m = function(...args) {

	if (!args.length) {
		args = [2];
	}
	
	// Flatten array
	args = [].concat.apply([], args)
	
	for (var value of args) {
		// Make sure value is a Bn
		value = Bn(value);

		// Sign
		this.sign *= value.sign;

		// If either value is zero, the result is zero
		if (this.data[0] == 0 || 0 == value.data[0]) {
			Bn(0).clone(this);
			continue;
		}

		// Change the exponent.
		this.decs += value.decs;

		let tlen = this.data.length,
			vlen = value.data.length;
		
		// Coefficient array of zeroes
		var result = Array(tlen + vlen).fill(0);

		// Make sure this.data is the longest
		if (tlen < vlen) {
			this.clone(value);
		}
		
		// Do the actual multiplication
		for (let i = 0; i < tlen; i++) {
			let carry = 0;
			for (let j = 0; j < vlen; j++) {
				// Add plus carry
				carry += result[i + j] + value.data[i] * this.data[j];
				result[i + j] = carry % 1000;

				// carry
				carry = carry / 1000 | 0;
			}
			
			// Insert the resulting carry value
			result[i + vlen] = carry;
		}

		this.data = result;
		this.clean();
	}

	return this;
}

Bn.prototype.divide = Bn.prototype.div = Bn.prototype.d = function (...args) {
	// I don't think this is possible without implementing a couple more functions
}

Bn.prototype.truncate = Bn.prototype.trunc = Bn.prototype.t = function () {
	
	// If this is a value with a decimal part, just slice off
	// the decimals
	if (this.decs > 0) {
		this.data = this.data.slice(this.decs);
		this.decs = 0;
	}

	return this.clean();
};

Bn.prototype.floor = Bn.prototype._ = Bn.prototype.f = function () {

	// If this is positive, floor is the same as trunc(this).
	// If this is negative, floor is the same as trunc(this-1).
	if (this.sign > 0) {
		return this.truncate();
	} else if (this.decs > 0) {
		return this.subtract(1).truncate();
	}

	return this;
}

Bn.prototype.ceiling = Bn.prototype.ceil = Bn.prototype.c = function () {

	// If this is positive, ceiling is the same as trunc(this+1).
	// If this is negative, ceiling is the same as trunc(this).
	if (this.sign > 0 && this.decs > 0) {
		return this.add(1).truncate();
	} else if (this.decs > 0) {
		return this.truncate();
	}

	return this;
}

Bn.prototype.round = Bn.prototype.r = function () {
	
	// Rounding always works the same...
	return this.add(0.5).floor();
}

Bn.prototype.bitwiseNOT = Bn.prototype.bn = function () {
	
	// Mimicing javascript's ~ operator.
	// ~n = (Math.trunc(n) + 1) * -1
	return this.truncate().add(1).negate();
};

if (typeof module === "object") module.exports = Bn;
