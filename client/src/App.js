import React, { useState } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [file, setFile] = useState(null);
  const [pdfId, setPdfId] = useState(null);
  const [pages, setPages] = useState('');
  const [mergeFiles, setMergeFiles] = useState([]);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    const formData = new FormData();
    formData.append('pdf', file);

    try {
      const response = await axios.post('http://localhost:5001/upload', formData);
      setPdfId(response.data.id);
    } catch (error) {
      console.error('Error uploading file:', error);
    }
  };

  const handleSplit = async () => {
    try {
      const response = await axios.post('http://localhost:5001/split', {
        id: pdfId,
        pages: pages.split(',').map(Number),
      }, { responseType: 'blob' });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'split.pdf');
      document.body.appendChild(link);
      link.click();
    } catch (error) {
      console.error('Error splitting PDF:', error);
    }
  };

  const handleMergeFilesChange = (e) => {
    setMergeFiles(Array.from(e.target.files));
  };
  const handleMerge = async () => {
    const formData = new FormData();
    mergeFiles.forEach((file) => formData.append('pdfs', file));

    try {
      const response = await axios.post('http://localhost:5001/merge', formData, { responseType: 'blob' });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'merged.pdf');
      document.body.appendChild(link);
      link.click();
    } catch (error) {
      console.error('Error merging PDFs:', error);
    }
  };

  return (
    <div className="App">
  <h1>PDF Splitter & Merger</h1>

  <div className="section">
    <h2>Split PDF</h2>
    <input type="file" onChange={handleFileChange} accept=".pdf" />
    <button onClick={handleUpload}>Upload</button>
    <input
      type="text"
      placeholder="Enter page numbers (e.g., 1,3,5)"
      value={pages}
      onChange={(e) => setPages(e.target.value)}
    />
    <button onClick={handleSplit}>Split</button>
  </div>

  <div className="section">
    <h2>Merge PDFs</h2>
    <input type="file" onChange={handleMergeFilesChange} accept=".pdf" multiple />
    <button onClick={handleMerge}>Merge</button>
  </div>
</div>

  );
}

export default App;