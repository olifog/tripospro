{{
  const { v4: uuidv4 } = require('uuid');

  function genUUID() {
    return uuidv4();
  }
}}

// Main entry point
Start
  = _ mainObject:Object _ { return mainObject; }

// Object parsing
Object
  = "{" _ objectContent:ObjectContent _ "}" { return objectContent; }
  / "(" _ objectContent:ObjectContent _ ")" { return objectContent; }

ObjectContent
  = first:ObjectEntry rest:(_ "," _ ObjectEntry)* optionalComma:(_ "," _)? {
      const result = {};
      // Add the first entry if it exists
      if (first) {
        result[first.key] = first.value;
      }
      // Add all remaining entries
      rest.forEach(item => {
        const entry = item[3]; // The ObjectEntry is at index 3 in the pattern
        if (entry) {
          result[entry.key] = entry.value;
        }
      });
      return result;
    }
  / "" { return {}; } // Allow empty objects

ObjectEntry
  = key:Key _ "=" _ value:OptionalValue { return { key, value }; }
  / value:Value { return { key: genUUID(), value }; }

// Keys can be identifiers or quoted strings
Key
  = Identifier
  / StringLiteral

OptionalValue
  = Value
  / "" { return undefined; }
  // Value can be many different types
Value
  = LabeledObject
  / Number
  / StringLiteral
  / Boolean
  / FunctionCall
  / Object
  / NestedIdentifier
  / Identifier

// Pattern for "key{...}" - simple labeled object
LabeledObject
  = id:Identifier _ obj:Object {
      obj._label = id;
      return obj;
    }
  / str:StringLiteral _ obj:Object {
      obj._label = str;
      return obj;
    }

// Function-like constructs (e.g. "htmlinclude(...)")
FunctionCall "function call"
  = name:Identifier "(" _ args:(FunctionArgument (_ "," _)?)* _ ")" { 
      return { 
        type: "function", 
        name: name, 
        arguments: args.map(arg => arg[0]) 
      }; 
    }

FunctionArgument "function argument"
  = key:Key _ "=" _ value:Value { return { key, value }; }
  / value:Value { return { value }; }

// Nested identifiers like "assessment.html"
NestedIdentifier "nested identifier"
  = head:Identifier "." tail:Identifier { return head + "." + tail; }

// Boolean values (0 or 1)
Boolean "boolean"
  = "0" { return false; }
  / "1" { return true; }

// Numbers
Number "number"
  = digits:[0-9]+ { return parseInt(digits.join(""), 10); }

// String literals can be single-quoted or double-quoted
StringLiteral
  = "'" value:SingleQuotedChar* "'" { return value.join(""); }
  / '"' value:DoubleQuotedChar* '"' { return value.join(""); }

SingleQuotedChar "single quoted char"
  = !["'"] char:.  { return char; }
  / '\"' { return '"'; }
  / "\\'" { return "'"; }
  / "\\\\" { return "\\"; }
  / "\\n" { return "\n"; }

DoubleQuotedChar "double quoted char"
  = !["\""] char:. { return char; }
  / '\\"' { return '"'; }
  / "\\'" { return "'"; }
  / "\\\\" { return "\\"; }
  / "\\n" { return "\n"; }

// Identifiers
Identifier
  = first:[a-zA-Z0-9_\*\.] rest:[a-zA-Z0-9_\-:]* { return first + rest.join(""); }

// Optional whitespace
_ "whitespace"
  = [ \t\n\r]*
