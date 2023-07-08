const multer = require("multer");
const sharp = require("sharp");
const path = require("path");
const fs = require("fs");
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "../public/images/"));
  },
  filename: function (req, file, cb) {
    const uniquesuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniquesuffix + ".jpeg");
  },
});

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image")) {
    cb(null, true);
  } else {
    cb({ message: "Unsupported file format" }, false);
  }
};

// Uploading photos
const uploadPhoto = multer({
  storage: storage,
  fileFilter: multerFilter,
  limits: { fileSize: 1000000 },
});

/* The productImgResize and blogImgResize functions are middleware functions that
 * handle image resizing(with sharp) after file upload.
 */
const productImgResize = async (req, res, next) => {
  // if no file continue to the next() func, e.g submit other data without file then
  if (!req.files) return next();
  await Promise.all(
    req.files.map(async (file) => {
      await sharp(file.path)
        .resize(300, 300)
        .toFormat("jpeg")
        .jpeg({ quality: 90 })
        .toFile(`public/images/products/${file.filename}`);

      // delete the file(s) from d public folder after save
      fs.unlinkSync(`public/images/products/${file.filename}`);
    })
  );
  next();
};

// NOTE:
// Inside the map function, the sharp library is used to resize the image to a width and height of 300 pixels, convert it to JPEG format, set the quality to 90, and save it to the specified file path. The original file is then deleted using fs.unlinkSync() to free up disk space.

// If there are no files in the request (req.files is empty), the middleware skips to the next middleware function using return next().
const blogImgResize = async (req, res, next) => {
  // if no file continue to the next() func, e.g submit other data without file then
  if (!req.files) return next();
  await Promise.all(
    req.files.map(async (file) => {
      await sharp(file.path)
        .resize(300, 300)
        .toFormat("jpeg")
        .jpeg({ quality: 90 })
        .toFile(`public/images/blogs/${file.filename}`);

      // delete the file from d public folder afetr save
      fs.unlinkSync(`public/images/blogs/${file.filename}`);
    })
  );
  next();
};
module.exports = { uploadPhoto, productImgResize, blogImgResize };
