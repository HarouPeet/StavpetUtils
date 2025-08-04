function convertDriveLink(originalUrl) {
  const match = originalUrl.match(/\/d\/(.+?)\//);
  if (match) {
    return `https://drive.google.com/uc?export=view&id=${match[1]}`;
  }
  return originalUrl;
}