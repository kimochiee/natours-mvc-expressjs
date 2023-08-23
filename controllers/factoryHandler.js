const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const APIFeatures = require('../utils/apiFeatures');

const deleteOne = (Model) => {
  return catchAsync(async (req, res, next) => {
    const document = await Model.findByIdAndDelete(req.params.id);

    if (!document) {
      return next(new AppError('No ducument with that ID', 404));
    }

    res.status(204).json({
      status: 'success',
      data: null,
    });
  });
};

const updateOne = (Model) => {
  return catchAsync(async (req, res, next) => {
    const document = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      status: 'success',
      data: {
        document,
      },
    });
  });
};

const createOne = (Model) => {
  return catchAsync(async (req, res, next) => {
    const document = await Model.create(req.body);

    res.status(201).json({
      status: 'success',
      data: {
        document,
      },
    });
  });
};

const getOne = (Model, populateOptions) => {
  return catchAsync(async (req, res, next) => {
    let query = Model.findById(req.params.id);

    if (populateOptions) {
      query.populate(populateOptions);
    }

    const document = await query;

    if (!document) {
      return next(new AppError('No document found with that ID', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        document,
      },
    });
  });
};

const getAll = (Model) => {
  return catchAsync(async (req, res, next) => {
    //Only for get all reviews
    let filter = {};
    if (req.params.tourId) {
      filter = { tour: req.params.tourId };
    }

    //Excecute query
    const features = new APIFeatures(Model.find(filter), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();
    const documents = await features.query;

    //Send Response
    res.status(200).json({
      status: 'success',
      results: documents.length,
      data: {
        documents,
      },
    });
  });
};

module.exports = { deleteOne, updateOne, createOne, getOne, getAll };
