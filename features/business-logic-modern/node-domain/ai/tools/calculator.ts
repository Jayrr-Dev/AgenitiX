/**
 * Calculator Tool
 * 
 * Performs safe mathematical calculations without eval().
 * Supports basic arithmetic operations: +, -, *, /, parentheses
 */

import type { ToolImplementation } from "./types";

/**
 * Safe calculator function that doesn't use eval
 * Supports basic arithmetic operations: +, -, *, /, (, )
 */
const safeCalculate = (expression: string): number => {
  // Remove whitespace and validate characters
  const cleanExpr = expression.replace(/\s/g, '');

  // Only allow numbers, operators, and parentheses
  if (!/^[0-9+\-*/().]+$/.test(cleanExpr)) {
    throw new Error("Invalid characters in expression");
  }

  // Simple recursive descent parser for basic arithmetic
  let pos = 0;

  const parseNumber = (): number => {
    let num = '';
    while (pos < cleanExpr.length && /[0-9.]/.test(cleanExpr[pos])) {
      num += cleanExpr[pos++];
    }
    if (num === '') throw new Error("Expected number");
    return parseFloat(num);
  };

  const parseFactor = (): number => {
    if (pos < cleanExpr.length && cleanExpr[pos] === '(') {
      pos++; // skip '('
      const result = parseExpression();
      if (pos >= cleanExpr.length || cleanExpr[pos] !== ')') {
        throw new Error("Missing closing parenthesis");
      }
      pos++; // skip ')'
      return result;
    }

    if (pos < cleanExpr.length && cleanExpr[pos] === '-') {
      pos++; // skip '-'
      return -parseFactor();
    }

    if (pos < cleanExpr.length && cleanExpr[pos] === '+') {
      pos++; // skip '+'
      return parseFactor();
    }

    return parseNumber();
  };

  const parseTerm = (): number => {
    let result = parseFactor();

    while (pos < cleanExpr.length && (cleanExpr[pos] === '*' || cleanExpr[pos] === '/')) {
      const op = cleanExpr[pos++];
      const right = parseFactor();
      if (op === '*') {
        result *= right;
      } else {
        if (right === 0) throw new Error("Division by zero");
        result /= right;
      }
    }

    return result;
  };

  const parseExpression = (): number => {
    let result = parseTerm();

    while (pos < cleanExpr.length && (cleanExpr[pos] === '+' || cleanExpr[pos] === '-')) {
      const op = cleanExpr[pos++];
      const right = parseTerm();
      if (op === '+') {
        result += right;
      } else {
        result -= right;
      }
    }

    return result;
  };

  const result = parseExpression();

  if (pos < cleanExpr.length) {
    throw new Error("Unexpected characters at end of expression");
  }

  return result;
};

export const calculatorTool: ToolImplementation = {
  definition: {
    name: "Calculator",
    description: "Perform mathematical calculations and return the numerical result",
    icon: "LuCalculator",
    category: "utility",
  },

  convexHandler: async (args: { expression: string }) => {
    try {
      const result = safeCalculate(args.expression);
      return result.toString();
    } catch (error) {
      return `Error calculating ${args.expression}: ${error}`;
    }
  },
};