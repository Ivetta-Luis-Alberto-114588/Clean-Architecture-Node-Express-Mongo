export class Validators {
  
    static get checkEmail() {
      
      //aca estoy devolviendo una expresion regular
      return /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    } 
  
  
  }