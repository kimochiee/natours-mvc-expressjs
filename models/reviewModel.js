const mongoose = require('mongoose');
const Tour = require('./tourModel');

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'Review cant be empty'],
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    tour: {
      type: mongoose.Types.ObjectId,
      ref: 'Tour',
      required: true,
    },
    user: {
      type: mongoose.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// make unique rating (1 user and 1 rating for 1 tour)
reviewSchema.index({ tour: 1 }, { user: 1 }, { unique: true });

// query middleware
reviewSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'user',
    select: 'name photo',
  });

  next();
});

// calculate ratings
reviewSchema.statics.calcAverageRatings = async function (tourId) {
  const stats = await this.aggregate([
    {
      $match: { tour: tourId },
    },
    {
      $group: {
        _id: '$tour',
        nRating: { $sum: 1 },
        avgRating: { $avg: 'rating' },
      },
    },
  ]);

  if (stats.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: stats[0].nRating,
      ratingsAverage: stats[0].avgRating,
    });
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: 0,
      ratingsAverage: 5,
    });
  }
};

reviewSchema.post('save', function () {
  // các rating sau khi lưu (post) thì mới được gọi hàm calcAverageRatings để tính toán, nên ta dùng .post("save")
  this.constructor.calcAverageRatings(this.tour);
});

reviewSchema.pre(/^findOneAnd/, async function (next) {
  // tìm review trước khi update hoặc delete, lưu nó vào this
  this.review = await this.findOne();

  next();
});

reviewSchema.post(/^findOneAnd/, async function (next) {
  // gọi hàm calcAverageRatings cho review mới update hoặc delete
  await this.review.constructor.calcAverageRatings(this.review.tour);

  next();
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
