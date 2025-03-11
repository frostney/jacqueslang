# Jacques - Dynamic scripting language inspired by FreePascal

## Features

- Dynamic typing
- Object-oriented
- Functional programming

## Syntax

- Semicolons are optional
- Variables are declared with `:=`
- Functions are declared with `function`
- Classes are declared with `class`

## Variables

Variables are immutable by default and cannot be reassigned or modified. If you need to modify a variable, declare it with `=` instead of `:=`. Variables need to be initialized when declared.

```pascal
num := 10;
num = 20; // This will error

anotherNum = 10;
anotherNum = 20; // This will work
```

## Primitive types

```pascal
num := 10;
name := "Jacques";
bool := true;
```

### Strings

- Strings can be written with double quotes or single quotes
- Strings have a static function that returns a formatted string `String.Format('Add: ${0}', add(4, 5));` - 0 refers to the first argument provided
- Backticks strings can be used which is syntactic sugar around string formatting `hello := `world ${name}``where`name` is a variable that has been defined before

## Complex types

```pascal
arr := [1, 2, 3];
obj := { name: "Jacques", age: 20 };
```

Internally all types are implemented as classes and there is syntactic sugar for implicit variable declarations. Similarly variables can be declared with the class constructor.

```pascal
num := Number(10);
name := String("Jacques");
bool := Boolean(true);
```

All types have a `ToString` method.

```pascal
Println(num.ToString()); // "10"
Println(name.ToString()); // "Jacques"
Println(bool.ToString()); // "true"
Println(arr.ToString()); // "[1, 2, 3]"
Println(obj.ToString()); // "{ name: Jacques, age: 20 }"
```

```pascal
arr := Array(1, 2, 3); // Array constructor can be used to create an array. This is equivalent to [1, 2, 3]
obj := Map(name: "Jacques", age: 20); // Map constructor can be used to create a map. This is equivalent to { name: "Jacques", age: 20 }
```

Arrays have built-in methods to add and remove elements. This will always return a new array.

```pascal
arr := [1, 2, 3];
arr.Add(4); // [1, 2, 3, 4]
arr.Remove(2); // [1, 3]
```

Maps have built-in methods to add and remove elements. This will always return a new map.

```pascal
obj := { name: "Jacques", age: 20 };
obj.Add(name: "John"); // { name: "Jacques", age: 20, name: "John" }
obj.Remove(name); // { age: 20 }
```

### Accessing array and object members

```pascal
arr := [1, 2, 3]
arr.Get(0);
arr[0]; // This is syntactic sugar for `arr.Get(0)`
```

```pascal
obj := { name: "Jacques", age: 20 };
obj.Get('Name');
obj.name; // This is syntactic sugar for `obj.Get('Name')`
obj['name']; // This is syntactic sugar for `obj.Get('Name')`
```

## Operators

Operators are shorthands for built-in methods. These will always return a new value. You cannot mix types.

```pascal
num1 := 10;
num2 := 20;

Println(num1 + num2); // 30
Println(num1 - num2); // -10
Println(num1 * num2); // 200
Println(num1 / num2); // 0.5
Println(num1 % num2); // 10

Println(num1 == num2); // false
Println(num1 != num2); // true
Println(num1 < num2); // true
Println(num1 > num2); // false
Println(num1 <= num2); // true
Println(num1 >= num2); // false

Println(num1 && num2); // false
Println(num1 || num2); // true
Println(!num1); // false

Println(num1.Add(num2)); // 30
Println(num1.Subtract(num2)); // -10
Println(num1.Multiply(num2)); // 200
Println(num1.Divide(num2)); // 0.5
Println(num1.Modulo(num2)); // 10

Println(num1.Equals(num2)); // false
Println(num1.NotEquals(num2)); // true
Println(num1.LessThan(num2)); // true
Println(num1.GreaterThan(num2)); // false
Println(num1.LessThanOrEqual(num2)); // true
Println(num1.GreaterThanOrEqual(num2)); // false

Println(num1.BinaryAnd(num2)); // false
Println(num1.BinaryOr(num2)); // true
Println(num1.BinaryXor(num2)); // true
Println(num1.BinaryNot()); // false
```

## Conditionals

Conditionals are declared with `if`, `else if`, `else`.

```pascal
if num1 < num2
    Println("num1 is less than num2");
else if num1 > num2
    Println("num1 is greater than num2");
else
    Println("num1 is equal to num2");
end;
```

## Functions

Functions are declared with `function` and can be assigned to variables.

```pascal
func := function(a, b)
    Result := a + b;
end;
```

Functions can be called with the `()` operator.

```pascal
Println(func(1, 2)); // 3
```

Functions can be anonymous.

```pascal
Println(function(a, b)
    Result := a + b;
end)(1, 2)); // 3
```

Functions can be returned from other functions.

```pascal
func := function()
    return function(a, b)
        Result := a + b;
    end;
end;

Println(func()(1, 2)); // 3
```

Functions can be used as parameters as callbacks.

```pascal
func := function(callback)
    callback(1, 2);
end;

func(function(a, b)
    Println(a + b);
end); // 3
```

Functions can be defined as lambda expressions.

```pascal
func := (a, b) => a + b;

Println(func(1, 2)); // 3
```

Functions are internally implemented as classes and can be declared as a constructor. (Lambda functions are similarly implemented)

```pascal
sum := Function(['a', 'b'], 'Result := a + b'); // This is the same as `sum := function(a, b) Result := a + b; end;`

Println(sum(2, 3));
```

Functions have built-in methods to execute

```pascal
sum := Function(['a', 'b'], 'Result := a + b');

Println(sum.execute(2, 3)); // This is the same as Println(sum(2, 3));
```

## Classes

Classes are declared with `class` and can be extended with `extends`.

```pascal
class Person
    name = String();
    age = Number();

    constructor(name, age)
        @name = name;
        @age = age;
    end;

    ToString()
        Result := "Name: " + @name + ", Age: " + @age;
    end;
end;

person := Person("Jacques", 20);
Println(person.ToString()); // "Name: Jacques, Age: 20"
```

Classes can have static methods

```pascal
class Person
    static name = String();
    static age = Number();

    static ToString()
        Result := "Name: " + @name + ", Age: " + @age;
    end;
end;

Person.name = "Jacques";
Person.age = 20;
Println(Person.ToString()); // "Name: Jacques, Age: 20"
```

Classes can have modifiers. The instance can be accessed with `@`.

```pascal
class Person
    private name = String();
    private age = Number();

    constructor(name, age)
        @name = name;
        @age = age;
    end;

    ToString()
        Result := "Name: " + @name + ", Age: " + @age;
    end;
end;

person := Person("Jacques", 20);
Println(person.name); // This will error
Println(person.age); // This will error
```

Classes can have properties.

```pascal
class Person
    private name = String();
    private age = Number();

    property Name
        get()
            Result := @name;
        end;

        set(value)
            @name = value;
        end;
    end;

    property Age
        get()
            Result := @age;
        end;

        set(value)
            @age = value;
        end;
    end;

    ToString()
        Result := "Name: " + @name + ", Age: " + @age;
    end;
end;

person := Person();
person.Name = "Jacques";
person.Age = 20;
Println(person.ToString()); // "Name: Jacques, Age: 20"
```

Property getters and setters can also be defined as lambda expressions.

```pascal
class Person
    private name = String();

    property Name
        get() => @name;
        set(value) => @name = value;
    end;
end;

person := Person();
person.Name = "Jacques";
Println(person.Name); // "Jacques"
```

Constant properties can be defined with `:=`

```pascal
class Person
    const name := String('Jacques');
    const age := Number(20);
end;

Println(Person.name); // "Jacques"
Println(Person.age); // 20

Person.name = "John"; // This will error
Person.age = 30; // This will error
```

Shorthand properties can be defined with `@`

```pascal
class Person
    constructor(@name = 'Jacques', @age = 20)
end;

person := Person();
Println(person.name); // "Jacques"
Println(person.age); // 20
```

## Modules

Jacques only has named imports and exports.

```pascal
import Add, Subtract from "math";

Println(Add(1, 2)); // 3
Println(Subtract(1, 2)); // -1
```

Exporessions, classes can be exported with `export`.

```pascal
export class Person
    name = String();
    age = Number();
end;

export function Add(a, b) => a + b;
export function Subtract(a, b) => a - b;
```

## Loops

Arrays and dictionaries have built-in methods for iteration.

```pascal
arr := [1, 2, 3];
Arr.ForEach(function(item)
    Println(item);
end);
```

```pascal
obj := { name: "Jacques", age: 20 };
obj.ForEach(function(key, value)
    Println(key + ": " + value);
end);
```
