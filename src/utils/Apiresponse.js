class Apiresponse {
  constructor(statuscode,data,message="Success") {
    this.status = statuscode;
    this.message = message;
    this.data = data;
    this.success=statuscode<400
  }
}   

export default Apiresponse;