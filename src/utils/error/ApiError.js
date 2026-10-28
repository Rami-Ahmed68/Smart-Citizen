export class ApiError extends Error {
  constructor(message, statusCode) {
    if (typeof message === "object" && message.en && message.ar) {
      super(message.en);
      this.messageEn = message.en;
      this.messageAr = message.ar;
    } else if (typeof message === "string") {
      super(message);
      this.messageEn = message;
      this.messageAr = message;
    } else {
      super("Error occurred");
      this.messageEn = "Error occurred";
      this.messageAr = "حدث خطأ";
    }

    this.statusCode = statusCode || 500;
    this.status = `${this.statusCode}`.startsWith("4") ? "fail" : "error";
    this.isOperational = true;
  }
}
