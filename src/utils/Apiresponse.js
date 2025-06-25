class Apiresponse {
  constructor(statuscode,data,message="Success") {
    this.status = 200;
    this.message = "Success";
    this.data = null;
    this.success=statuscode<400
  }
}   