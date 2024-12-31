class MyClass {}

const myVariable: MyClass | number = 5;

class ExampleProblem {
  get field() {
    if (myVariable instanceof MyClass) {
      return myVariable;
    }
    return myVariable + 2;
  }
}
