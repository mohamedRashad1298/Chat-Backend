class ApiFeatures {
    constructor(query, queryString) {
      this.query = query;
      this.querystring = queryString;
    }
    filter() {
      const queryObj = { ...this.querystring };
      const excludedFields = ['page', 'sort', 'limit', 'fields'];

      excludedFields.forEach((el) => delete queryObj[el]);
      let queryStr = JSON.stringify(queryObj);
      queryStr = queryStr.replace(
        /\b(lte|gte|lt|gt)\b/,
        (match) => `$${match}`,
      );
      this.query =this.query.find(JSON.parse(queryStr));
    
      return this;
    }

    sort(){
      if (this.querystring.sort) {
        const sortBy = this.querystring.sort.split(',').join(' ');
        this.query.sort(sortBy);
      } else {
        this.query.sort('-createdAt');
      }
      return this;
    }

fields(){
if (this.querystring.fields) {
  const fields = this.querystring.fields.split(',').join(' ');
  this.query.select(fields);
} else {
  this.query.select('-__v');
}
return this ;
}

pagination(){
const page =this.querystring.page * 1 || 1;
const limit =this.querystring.page * 1 || 10;
const skip = (page - 1) * limit;

this.query = this.query.skip(skip).limit(limit);
return this ;
}
  }

  module.exports = ApiFeatures;