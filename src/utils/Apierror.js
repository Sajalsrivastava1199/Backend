class ApiError extends Error {
  constructor(
    statusCode,
    message = "An error occurred",   // Default message if none is provided
    errors=[],
    stack="" // Default stack trace if none is provided
  ) {
    super(message);
    this.statusCode = statusCode;
    this.success = false; // Indicates that this error is operational and can be handled gracefully
    this.errors = errors; // Array to hold multiple error messages
    this.message = message; // Error message
    this.data = null; // Additional data can be added if needed

    if(stack) {
      this.stack = stack; // Stack trace for debugging
    }
    else {
      Error.captureStackTrace(this, this.constructor); // Capture the stack trace if not provided
    }   
  }
}   

export default ApiError;    