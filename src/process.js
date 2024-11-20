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
    cropHeight = Math.min(sourceHeight, sourceHeight);
    cropWidth = Math.round(cropHeight * targetAspect);
  } else {
    // Height needs to be cropped more
    cropWidth = Math.min(sourceWidth, sourceWidth);
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

function processFrame(frame, options = {}) {
  const config = { ...defaults, ...options };

  validateConfig(config);

  const { depthFrame, colorFrame } = frame;

  if (!depthFrame || !colorFrame) {
    throw new Error('Both depth and color frames are required');
  }

  const depthCrop = calculateCropDimensions(
    depthFrame.width, 
    depthFrame.height, 
    config.outputWidth, 
    config.outputHeight
  );

  const colorCrop = calculateCropDimensions(
    colorFrame.width, 
    colorFrame.height, 
    config.outputWidth, 
    config.outputHeight
  );

  const depthData = new Uint16Array(depthFrame.data.buffer);
  const colorData = new Uint8Array(colorFrame.data.buffer);

  const outputSize = config.outputWidth * config.outputHeight * 4; // 4 bytes per pixel (RGBA)
  const outputBuffer = Buffer.alloc(outputSize);

  // Process pixels
  for (let y = 0; y < config.outputHeight; y++) {
    const sourceY = Math.floor(y * depthCrop.cropHeight / config.outputHeight) + depthCrop.startY;
    const colorSourceY = Math.floor(y * colorCrop.cropHeight / config.outputHeight) + colorCrop.startY;

    const outputRowOffset = y * config.outputWidth * 4;

    for (let x = 0; x < config.outputWidth; x++) {
      // Apply mirroring if enabled
      const outputX = config.isMirrored ? (config.outputWidth - 1 - x) : x;

      const sourceX = Math.floor(x * depthCrop.cropWidth / config.outputWidth) + depthCrop.startX;
      const colorSourceX = Math.floor(x * colorCrop.cropWidth / config.outputWidth) + colorCrop.startX;

      const depthIndex = (sourceY * depthFrame.width) + sourceX;
      const colorIndex = (colorSourceY * colorFrame.width * 3) + (colorSourceX * 3);
      const outputIndex = outputRowOffset + (outputX * 4);

      // Get depth value and apply threshold
      const depthValue = depthData[depthIndex];
      let pixelValue = 0;

      if (depthValue > 0 && depthValue <= config.depthThreshold) {
        // Default to white if within depth threshold
        pixelValue = 255;

        // Check darkness threshold using luminance
        const luminance = calculateLuminance(colorData, colorIndex);

        if (luminance >= config.darknessThreshold) {
            pixelValue = 0;
        }
      }

      // Set RGBA values directly in output buffer
      outputBuffer[outputIndex] = pixelValue;     // R
      outputBuffer[outputIndex + 1] = pixelValue; // G
      outputBuffer[outputIndex + 2] = pixelValue; // B
      outputBuffer[outputIndex + 3] = 255;       // A
    }
  }

return outputBuffer;
}

export { processFrame };