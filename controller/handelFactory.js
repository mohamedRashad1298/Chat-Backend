const catchAsync = require('./../utils/catchAsync');
const AppError = require('../utils/AppError');
const ApiFeatures = require('../utils/ApiFeatures');


exports.getAll =model =>{ return catchAsync(async (req, res, next) => {
    let filter = {};

    const features = new ApiFeatures(model.find(filter), req.query)
      .filter()
      .sort()
      .fields()
      .pagination();
  
    const data= await features.query;
  
    res.status(200).json({
      status: 'success',
      data,
    });
  });

}

exports.getOne = function(model,populateOp){
 return catchAsync(async (req, res, next) => {
        const { id } = req.params;
      
        let Query =  model.findById(id);
if(populateOp) Query = Query.populate(populateOp)
const data = await Query;

        if (!data) {
          return next(new AppError(" Can't find A tour with this id 🤷‍♂️", 404));
        }
      
        res.status(200).json({
          status: 'success',
          data,
        });
      });
}


exports.CreateOne = function(model){
    return catchAsync(async (req, res, next) => {
        const data = await model.create(req.body);
      
        res.status(200).json({
          status: 'success',
          data,
        });
      });
}

exports.UpdateOne= function(model){

    return catchAsync(async (req, res, next) => {
        const { id } = req.params;
       
        const data = await model.findByIdAndUpdate(id, req.body, {
          new: true,
          runValidators: true
        });
      
        if(!data) return next(new AppError('threr is document with this ID',404))

        res.status(200).json({
          status: 'success',
          data,
        });
      });
}

exports.DeleteOne = function(model){

    return  catchAsync(async (req, res, next) => {
           const { id } = req.params;
           const data = await model.findByIdAndDelete(id);
         
if(!data) return next(new AppError('threr is document with this ID',404))

           res.status(204).json({
             status: 'success',
             message: 'deleted',
             data:null,
           });
         });
   }