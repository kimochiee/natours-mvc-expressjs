const Tour = require('../models/tourModel');
const catchAsync = require('../utils/catchAsync');

const { cloudinary } = require('../utils/cloudinary');

const {
  deleteOne,
  updateOne,
  createOne,
  getOne,
  getAll,
} = require('./factoryHandler');

const uploadTourImages = (req, res, next) => {
  if (!req.files.imageCover || !req.files.images) {
    return next();
  }

  req.body.images = [];

  cloudinary.uploader
    .upload_stream(
      {
        folder: 'file-upload',
        transformation: { width: 2000, height: 1333, crop: 'limit' },
      },
      (error, result) => {
        if (error) {
          return res.status(500).json({ error: 'Failed to upload' });
        }

        req.body.imageCover = result.secure_url;

        req.files.images.map((file) => {
          cloudinary.uploader
            .upload_stream(
              {
                folder: 'file-upload',
                transformation: { width: 2000, height: 1333, crop: 'limit' },
              },
              (error, result) => {
                if (error) {
                  return res.status(500).json({ error: 'Failed to upload' });
                }

                req.body.images.push(result.secure_url);

                if (req.body.imageCover && req.body.images.length == 3) {
                  next();
                }
              }
            )
            .end(file.buffer);
        });
      }
    )
    .end(req.files.imageCover[0].buffer);
};

const aliasTopTours = async (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,price,ratingsAverage,summary,difficulty';

  next();
};

const getAllTours = getAll(Tour);

const getTour = getOne(Tour);

const createTour = createOne(Tour);

const updateTour = updateOne(Tour);

const deleteTour = deleteOne(Tour);

const getTourStats = catchAsync(async (req, res, next) => {
  const stats = await Tour.aggregate([
    {
      $match: { ratingsAverage: { $gte: 4.5 } },
    },
    {
      $group: {
        _id: { $toUpper: '$difficulty' },
        numTours: { $sum: 1 },
        numRatings: { $sum: '$ratingsQuantity' },
        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
      },
    },
    {
      $sort: { avgPrice: 1 },
    },
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      stats,
    },
  });
});

const getMonthlyPlan = catchAsync(async (req, res, next) => {
  const year = req.params.year * 1;

  const plan = await Tour.aggregate([
    {
      $unwind: '$startDates',
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      $group: {
        _id: { $month: '$startDates' },
        numTourStarts: { $sum: 1 },
        tours: { $push: '$name' },
      },
    },
    {
      $addFields: { month: '$_id' },
    },
    {
      $project: { _id: 0 },
    },
    {
      $sort: { numTourStarts: -1 },
    },
    {
      $limit: 12,
    },
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      plan,
    },
  });
});

module.exports = {
  uploadTourImages,
  aliasTopTours,
  getAllTours,
  getTour,
  createTour,
  updateTour,
  deleteTour,
  getTourStats,
  getMonthlyPlan,
};
