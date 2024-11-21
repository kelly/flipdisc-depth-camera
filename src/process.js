const defaults = {
  outputWidth: 640,
  outputHeight: 480,
  depthThreshold: 2000,
  darknessThreshold: 50,
  isMirrored: false
};

function validateConfig(config) {
  if (config.depthThreshold <= 0) {
    throw new Error('Depth threshold must be positive');
  }
  if (config.darknessThreshold < 0 || config.darknessThreshold > 255) {
    throw new Error('Darkness threshold must be between 0 and 255');
  }
}

function calculateCropDimensions(sourceWidth, sourceHeight, targetWidth, targetHeight) {
  const sourceAspect = sourceWidth / sourceHeight;
  const targetAspect = targetWidth / targetHeight;

  let cropWidth, cropHeight, startX, startY;

  if (sourceAspect > targetAspect) {
    // Width needs to be cropped more
    cropHeight = sourceHeight;
    cropWidth = Math.round(cropHeight * targetAspect);
  } else {
    // Height needs to be cropped more
    cropWidth = sourceWidth;
    cropHeight = Math.round(cropWidth / targetAspect);
  }

  // Center the crop
  startX = Math.floor((sourceWidth - cropWidth) / 2);
  startY = Math.floor((sourceHeight - cropHeight) / 2);

  return { cropWidth, cropHeight, startX, startY };
}

function calculateLuminance(colorData, colorIndex) {
  return (
    0.299 * colorData[colorIndex + 2] + // Red
    0.587 * colorData[colorIndex + 1] + // Green
    0.114 * colorData[colorIndex]       // Blue
  );
}

function calculateColorToDepthMapping(depthFrame, colorFrame) {
  // Calculate scaling factors between depth and color frames
  const scaleX = colorFrame.width / depthFrame.width;
  const scaleY = colorFrame.height / depthFrame.height;

  // Calculate offsets to center the color frame relative to depth frame
  const offsetX = (colorFrame.width - (depthFrame.width * scaleX)) / 2;
  const offsetY = (colorFrame.height - (depthFrame.height * scaleY)) / 2;

  return {
    scaleX,
    scaleY,
    offsetX,
    offsetY
  };
}

function processFrame(frame, options = {}) {
  const config = { ...defaults, ...options };

  validateConfig(config);

  const { depthFrame, colorFrame } = frame;

  if (!depthFrame || !colorFrame) {
    throw new Error('Both depth and color frames are required');
  }

  // Calculate depth frame crop dimensions
  const depthCrop = calculateCropDimensions(
    depthFrame.width,
    depthFrame.height,
    config.outputWidth,
    config.outputHeight
  );

  // Calculate mapping between depth and color coordinates
  const mapping = calculateColorToDepthMapping(depthFrame, colorFrame);

  const depthData = new Uint16Array(depthFrame.data.buffer);
  const colorData = new Uint8Array(colorFrame.data.buffer);

  const outputSize = config.outputWidth * config.outputHeight * 4; // 4 bytes per pixel (RGBA)
  const outputBuffer = Buffer.alloc(outputSize);

  // Process pixels
  for (let y = 0; y < config.outputHeight; y++) {
    const depthSourceY = Math.floor(y * depthCrop.cropHeight / config.outputHeight) + depthCrop.startY;
    const outputRowOffset = y * config.outputWidth * 4;

    for (let x = 0; x < config.outputWidth; x++) {
      // Apply mirroring if enabled
      const outputX = config.isMirrored ? (config.outputWidth - 1 - x) : x;

      // Calculate depth pixel position
      const depthSourceX = Math.floor(x * depthCrop.cropWidth / config.outputWidth) + depthCrop.startX;

      // Map depth coordinates to color coordinates
      const colorSourceX = Math.floor((depthSourceX * mapping.scaleX) + mapping.offsetX);
      const colorSourceY = Math.floor((depthSourceY * mapping.scaleY) + mapping.offsetY);

      // Ensure color coordinates are within bounds
      const validColorCoords = 
        colorSourceX >= 0 && 
        colorSourceX < colorFrame.width &&
        colorSourceY >= 0 && 
        colorSourceY < colorFrame.height;

      const depthIndex = (depthSourceY * depthFrame.width) + depthSourceX;
      const colorIndex = (colorSourceY * colorFrame.width * 3) + (colorSourceX * 3);
      const outputIndex = outputRowOffset + (outputX * 4);

      // Get depth value and apply threshold
      const depthValue = depthData[depthIndex];
      let pixelValue = 0;

      if (depthValue > 0 && depthValue <= config.depthThreshold && validColorCoords) {
        // Default to white if within depth threshold
        pixelValue = 255;

        // Check darkness threshold using luminance
        const luminance = calculateLuminance(colorData, colorIndex);

        if (luminance < config.darknessThreshold) {
          pixelValue = 0;
        }
      }

      // Set RGBA values directly in output buffer
      outputBuffer[outputIndex] = pixelValue;     // R
      outputBuffer[outputIndex + 1] = pixelValue; // G
      outputBuffer[outputIndex + 2] = pixelValue; // B
      outputBuffer[outputIndex + 3] = 255;        // A
    }
  }

  return outputBuffer;
}

export { processFrame };