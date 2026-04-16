
class ApiResponse {
  constructor(res, statusCode = 200, message = null, data = {}) {
    this.res = res;
    this.statusCode = statusCode;
    this.data = data;

    // If message is not provided, set default based on status code
    this.message = message || this.getDefaultMessage(statusCode);
  }

  
  // Map status codes to meaningful messages
  getDefaultMessage(statusCode) {
    const messages = {
      200: "Request successful",
      201: "Resource created successfully",
      202: "Request accepted and processing",
      204: "No content available",
      400: "Bad request, please check your input",
      401: "Unauthorized access",
      403: "Forbidden, you do not have permission",
      404: "Resource not found",
      409: "Conflict, resource already exists",
      500: "Internal server error, please try again later",
    };
    return messages[statusCode] || "Operation completed";
  }

  send() {
    return this.res.status(this.statusCode).json({
      status: this.statusCode,
      message: this.message,
      data: this.data,
    });
  }
}

export default ApiResponse;