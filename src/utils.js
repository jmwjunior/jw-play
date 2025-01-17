const url = require("url");
const fs = require("fs");
const path = require("path");
const sizeOf = require("image-size");
const ffmpeg = require("fluent-ffmpeg");
const ffmpegPath = require("ffmpeg-static").replace(
  "app.asar",
  "app.asar.unpacked"
);
const { app } = require("electron");
const { v4: uuidv4 } = require("uuid");

ffmpeg.setFfmpegPath(ffmpegPath);

const hasExtension = (file, extensions) => {
  const parts = file.split(".");
  const extension = parts[parts.length - 1].toLowerCase();
  return extensions.includes(extension);
};

const isImage = (file) => {
  return hasExtension(file, ["png", "jpeg", "jpg", "gif"]);
};

const isVideo = (file) => {
  return hasExtension(file, ["mp4", "mpeg", "m4v", ""]);
};

const isFileSupported = (file) => {
  return isImage(file) || isVideo(file);
};

const maximizeImage = (image, window) => {
  if (!image.width || !image.height) {
    return;
  }

  const xRatio = window.innerWidth / image.width;
  const yRatio = window.innerHeight / image.height;
  const ratio = Math.min(xRatio, yRatio);

  image.width *= ratio;
  image.height *= ratio;
  image.width = Math.floor(image.width);
  image.height = Math.floor(image.height);
  image.style["margin-top"] = `${Math.floor(
    (window.innerHeight - image.height) / 2
  )}px`;
  image.style["margin-left"] = `${Math.floor(
    (window.innerWidth - image.width) / 2
  )}px`;
};

const createFilePayload = (filePath) => {
  const file = { url: `file://${filePath}` };
  if (isImage(filePath)) {
    const dimensions = sizeOf(filePath);
    file.width = dimensions.width;
    file.height = dimensions.height;
  }

  if (isVideo(filePath)) {
    const thumbnail = createVideoThumbnail(filePath);
    file.thumbnail = new URL(`file://${thumbnail}`).toString();
  }

  return file;
};

const clearThumbnails = () => {
  const folder = path.join(app.getPath("appData"), "JW Play", "thumbnails");
  try {
    fs.rmSync(folder, { recursive: true });
  } catch (e) {}
};

const createVideoThumbnail = (file) => {
  try {
    const size = "320x180";
    const folder = path.join(app.getPath("appData"), "JW Play", "thumbnails");
    const filename = uuidv4() + `-${size}.png`;
    fs.mkdirSync(folder, { recursive: true });
    ffmpeg(file).screenshots({
      timestamps: [2],
      folder,
      filename,
      size,
    });
    const screenshot = path.join(folder, filename);
    return screenshot;
  } catch (error) {
    console.log(error);
  }
};

module.exports = {
  isImage,
  isVideo,
  isFileSupported,
  maximizeImage,
  clearThumbnails,
  createFilePayload,
};
