// worker.js
self.onmessage = function(event) {
    // Process the data here...
    const data = event.data;
    let features = [];

    // Process the data...
    // For example, filter out features without properties
    const processedData = data.filter(feature => feature.properties);

    // Send the processed data back to the main thread
    self.postMessage(processedData);

};