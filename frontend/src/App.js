import React, { useState } from "react";
import "./App.css";

function App() {
  const [url, setUrl] = useState("");
  const [pages, setPages] = useState([]);
  const [selectedPdf, setSelectedPdf] = useState(null);
  const [mergedPdf, setMergedPdf] = useState(null);
  const [zipFile, setZipFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleConvert = async () => {
    if (!url) return;

    setLoading(true);
    setPages([]);
    setSelectedPdf(null);
    setMergedPdf(null);
    setZipFile(null);

    try {
      const res = await fetch("https://url-to-pdf-1-kdzs.onrender.com/convert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      const data = await res.json();
      setPages(data.pages || []);
      setMergedPdf(data.mergedPdf || null);
      setZipFile(data.zip || null);
    } catch (err) {
      alert("Backend not running on port 5000");
    }

    setLoading(false);
  };

  return (
    <div className="app">
      <div className="header">
        <h1>URL to PDF Converter</h1>
        <p>Instantly convert any website into pixel-perfect PDFs</p>

        <div className="input-bar">
          <input
            type="text"
            placeholder="Enter website URL..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
          <button onClick={handleConvert}>Convert</button>
        </div>
      </div>

      {loading && <p className="loading">Processing pages...</p>}

      {pages.length > 0 && (
        <div className="workspace">
          <div className="panel left">
            <h3>Pages</h3>
            {pages.map((p, i) => (
              <div
                key={i}
                onClick={() => setSelectedPdf(p.pdf)}
                className={`page-item ${
                  selectedPdf === p.pdf ? "active" : ""
                }`}
              >
                Page
                {p.hasVideo && <span className="video"> 🎥</span>}
              </div>
            ))}
          </div>

          <div className="panel right">
            <h3>PDF Preview</h3>
            {selectedPdf ? (
              <iframe
                title="pdf"
                src={`https://url-to-pdf-1-kdzs.onrender.com/${selectedPdf}`}
              />
            ) : (
              <p>Select a page to preview</p>
            )}
          </div>
        </div>
      )}

      {(mergedPdf || zipFile) && (
        <div className="downloads">
          {mergedPdf && (
            <a
              href={`https://url-to-pdf-1-kdzs.onrender.com/${mergedPdf}`}
              target="_blank"
              rel="noreferrer"
            >
              Download Merged PDF
            </a>
          )}
          {zipFile && (
            <a
              href={`https://url-to-pdf-1-kdzs.onrender.com/${zipFile}`}
              target="_blank"
              rel="noreferrer"
            >
              Download ZIP of All PDFs
            </a>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
