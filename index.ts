import { Jacques } from "./src";

// Example usage
const code = `
  // Base class with constructor and methods
  class Person
    name = String();
    age = Number();

    constructor(name, age)
      self.name = name;
      self.age = age;
    end;

    ToString()
      Result := "Name: " + self.name + ", Age: " + self.age;
    end;
  end;

  // Class with properties
  class Customer
    private name = String();
    private loyaltyPoints = Number();

    property Name
      get() => self.name;
      set(value) => self.name = value;
    end;

    property LoyaltyPoints
      get()
        Result := self.loyaltyPoints;
      end;

      set(value)
        self.loyaltyPoints = value;
      end;
    end;

    ToString()
      Result := "Customer: " + self.name + ", Points: " + self.loyaltyPoints;
    end;
  end;

  // Create instances and test
  person := Person("Jacques", 30);
  customer := Customer();
  customer.Name = "Alice";
  customer.LoyaltyPoints = 100;
  
  Println("Person: " + person.ToString());
  Println("Customer: " + customer.ToString());
  Println("Customer name: " + customer.Name);
`;

// Run the code
Jacques.run(code);
