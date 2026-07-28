import React, { useState, useEffect, useCallback } from 'react';
import { resourceAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const CATEGORIES = [
  { value: '', label: 'All Media', icon: '📂' },
  { value: 'image', label: 'Images', icon: '🖼️' },
  { value: 'pdf', label: 'PDFs', icon: '📄' },
  { value: 'document', label: 'Documents', icon: '📝' },
  { value: 'video', label: 'Videos', icon: '🎬' },
  { value: 'audio', label: 'Audio', icon: '🎵' },
  { value: 'other', label: 'Other', icon: '📦' },
];

const Resources = () => {
  const { isTeacher, isAdmin } = useAuth();
  const [resources, setResources] = useState([]);
  const [filteredResources, setFilteredResources] = useState([]);
  const [activeCategory, setActiveCategory] = useState('');
  const [uploading, setUploading] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');
  const [searchTerm, setSearchTerm] = useState('');

  // Lightbox / preview modal state
  const [previewItem, setPreviewItem] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  useEffect(() => {
    loadResources();
  }, []);

  // Filter resources when category, search, or resources change
  useEffect(() => {
    let filtered = [...resources];

    if (activeCategory) {
      filtered = filtered.filter((r) => r.category === activeCategory);
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.title.toLowerCase().includes(term) ||
          (r.description && r.description.toLowerCase().includes(term))
      );
    }

    setFilteredResources(filtered);
  }, [resources, activeCategory, searchTerm]);

  const loadResources = async () => {
    try {
      const res = await resourceAPI.getAll();
      setResources(res.data);
    } catch (err) {
      console.error('Error loading resources:', err);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    setMessage('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', title);
      formData.append('description', description);

      await resourceAPI.upload(formData);
      setMessage('File uploaded successfully!');
      setMessageType('success');
      setTitle('');
      setDescription('');
      setFile(null);
      loadResources();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Error uploading file');
      setMessageType('danger');
    }
    setUploading(false);
  };

  const handleDownload = async (id, fileName) => {
    try {
      const res = await resourceAPI.download(id);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading file:', err);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this resource?')) {
      try {
        await resourceAPI.delete(id);
        loadResources();
        if (previewItem && previewItem._id === id) {
          closePreview();
        }
      } catch (err) {
        console.error('Error deleting resource:', err);
      }
    }
  };

  const openPreview = async (resource) => {
    setPreviewItem(resource);
    setPreviewUrl(null);
    setLoadingPreview(true);

    try {
      const isImage = resource.category === 'image';
      const isPdf = resource.category === 'pdf';

      if (isImage || isPdf) {
        const url = resourceAPI.getPreviewUrl(resource._id);
        setPreviewUrl(url);
      } else {
        // For non-previewable items, trigger download
        handleDownload(resource._id, resource.fileName);
        setPreviewItem(null);
      }
    } catch (err) {
      console.error('Preview error:', err);
    }
    setLoadingPreview(false);
  };

  const closePreview = useCallback(() => {
    setPreviewItem(null);
    setPreviewUrl(null);
  }, []);

  // Keyboard listener for closing modal with Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') closePreview();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [closePreview]);

  const formatFileSize = (bytes) => {
    if (!bytes) return 'Unknown';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
  };

  const getCategoryIcon = (category) => {
    const cat = CATEGORIES.find((c) => c.value === category);
    return cat ? cat.icon : '📦';
  };

  const getFileTypeDisplay = (resource) => {
    if (resource.category === 'image') return resource.fileType?.split('/')[1]?.toUpperCase() || 'Image';
    if (resource.category === 'pdf') return 'PDF';
    if (resource.category === 'video') return 'Video';
    if (resource.category === 'audio') return 'Audio';
    return resource.fileType?.split('/')[1]?.toUpperCase() || 'Unknown';
  };

  const canManage = isTeacher || isAdmin;

  return (
    <div className="resources-page">
      <div className="container mt-4">
        {/* Header */}
        <div className="resources-header-card card mb-4">
          <div className="card-body text-center py-4">
            <h2 className="fw-bold mb-2">
              <span className="header-icon">📁</span> Learning Resources
            </h2>
            <p className="text-muted mb-0">
              Browse images, PDFs, documents, and media uploaded by your teachers
            </p>
          </div>
        </div>

        {message && (
          <div className={`alert alert-${messageType} alert-dismissible fade show`}>
            {message}
            <button type="button" className="btn-close" onClick={() => setMessage('')}></button>
          </div>
        )}

        {/* Upload Section - Teachers/Admin only */}
        {canManage && (
          <div className="card mb-4 upload-card">
            <div className="card-header">
              <h5 className="mb-0">📤 Upload New Resource</h5>
            </div>
            <div className="card-body">
              <form onSubmit={handleUpload}>
                <div className="row g-3">
                  <div className="col-md-5">
                    <label className="form-label">Title</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Enter a title for this resource"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                    />
                  </div>
                  <div className="col-md-5">
                    <label className="form-label">Description (optional)</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Brief description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>
                  <div className="col-md-2 d-flex align-items-end">
                    <button
                      type="submit"
                      className="btn btn-success w-100"
                      disabled={uploading}
                    >
                      {uploading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-1"></span>
                          Uploading...
                        </>
                      ) : (
                        '📤 Upload'
                      )}
                    </button>
                  </div>
                </div>
                <div className="mt-3">
                  <label className="form-label">Choose File (images, PDFs, documents, video, audio)</label>
                  <input
                    type="file"
                    className="form-control"
                    onChange={(e) => setFile(e.target.files[0])}
                    required
                  />
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Category Filter & Search */}
        <div className="row mb-4 align-items-center">
          <div className="col-lg-8 mb-3 mb-lg-0">
            <div className="category-tabs">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  className={`category-btn ${activeCategory === cat.value ? 'active' : ''}`}
                  onClick={() => setActiveCategory(cat.value)}
                >
                  <span className="cat-icon">{cat.icon}</span>
                  <span className="cat-label">{cat.label}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="col-lg-4">
            <div className="search-box">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                className="form-control search-input"
                placeholder="Search resources..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Resources Display */}
        {filteredResources.length === 0 ? (
          <div className="empty-state text-center py-5">
            <div className="empty-icon mb-3" style={{ fontSize: '3rem' }}>
              {activeCategory ? CATEGORIES.find((c) => c.value === activeCategory)?.icon : '📂'}
            </div>
            <h5 className="text-muted">
              {searchTerm
                ? 'No resources match your search'
                : activeCategory
                ? `No ${activeCategory} resources found`
                : 'No resources uploaded yet'}
            </h5>
            <p className="text-muted small">
              {canManage ? 'Upload a resource using the form above.' : 'Check back later for new materials.'}
            </p>
          </div>
        ) : (
          <>
            {/* Image Gallery - show when 'all' or 'image' is selected */}
            {(!activeCategory || activeCategory === 'image') && filteredResources.filter((r) => r.category === 'image').length > 0 && (
              <div className="mb-4">
                <h5 className="section-subtitle">
                  <span>🖼️ Images</span>
                  <span className="badge bg-secondary ms-2">
                    {filteredResources.filter((r) => r.category === 'image').length}
                  </span>
                </h5>
                <div className="image-gallery-grid">
                  {filteredResources
                    .filter((r) => r.category === 'image')
                    .map((resource) => (
                      <div
                        key={resource._id}
                        className="gallery-card"
                        onClick={() => openPreview(resource)}
                      >
                        <div className="gallery-img-wrapper">
                          <img
                            src={resourceAPI.getPreviewUrl(resource._id)}
                            alt={resource.title}
                            className="gallery-img"
                            loading="lazy"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.style.display = 'none';
                              e.target.parentElement.classList.add('img-fallback');
                            }}
                          />
                          <div className="gallery-overlay">
                            <span className="gallery-view-icon">🔍</span>
                          </div>
                        </div>
                        <div className="gallery-info">
                          <h6 className="gallery-title">{resource.title}</h6>
                          <span className="gallery-size">{formatFileSize(resource.fileSize)}</span>
                        </div>
                        {canManage && (
                          <button
                            className="gallery-delete-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(resource._id);
                            }}
                            title="Delete"
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* All resources in card/list view */}
            <h5 className="section-subtitle mb-3">
              <span>{activeCategory ? CATEGORIES.find((c) => c.value === activeCategory)?.icon : '📋'} All Resources</span>
              <span className="badge bg-secondary ms-2">{filteredResources.length}</span>
            </h5>
            <div className="row g-3">
              {filteredResources.map((resource) => (
                <div key={resource._id} className="col-lg-4 col-md-6">
                  <div className="card resource-card h-100">
                    <div className="card-body">
                      <div className="resource-type-icon mb-2">
                        {resource.category === 'image' ? '🖼️' :
                         resource.category === 'pdf' ? '📄' :
                         resource.category === 'video' ? '🎬' :
                         resource.category === 'audio' ? '🎵' :
                         resource.category === 'document' ? '📝' : '📦'}
                      </div>
                      <h6 className="resource-card-title fw-bold">{resource.title}</h6>
                      {resource.description && (
                        <p className="resource-card-desc small text-muted">{resource.description}</p>
                      )}
                      <div className="resource-meta small text-muted mb-3">
                        <span className="me-3">
                          <strong>Type:</strong> {getFileTypeDisplay(resource)}
                        </span>
                        <span className="me-3">
                          <strong>Size:</strong> {formatFileSize(resource.fileSize)}
                        </span>
                        {resource.uploadedBy?.name && (
                          <span className="d-block mt-1">
                            <strong>By:</strong> {resource.uploadedBy.name}
                          </span>
                        )}
                      </div>
                      <div className="resource-actions">
                        {(resource.category === 'image' || resource.category === 'pdf') ? (
                          <button
                            className="btn btn-primary btn-sm me-1"
                            onClick={() => openPreview(resource)}
                          >
                            👁️ Preview
                          </button>
                        ) : (
                          <button
                            className="btn btn-primary btn-sm me-1"
                            onClick={() => handleDownload(resource._id, resource.fileName)}
                          >
                            📥 Download
                          </button>
                        )}
                        {resource.category !== 'image' && (
                          <button
                            className="btn btn-outline-secondary btn-sm me-1"
                            onClick={() => handleDownload(resource._id, resource.fileName)}
                          >
                            📥 Save
                          </button>
                        )}
                        {canManage && (
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleDelete(resource._id)}
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Preview Modal / Lightbox */}
      {previewItem && (
        <div className="preview-overlay" onClick={closePreview}>
          <div className="preview-modal" onClick={(e) => e.stopPropagation()}>
            <div className="preview-header">
              <h6 className="mb-0">{previewItem.title}</h6>
              <div className="preview-actions">
                <button
                  className="btn btn-sm btn-outline-light me-2"
                  onClick={() => handleDownload(previewItem._id, previewItem.fileName)}
                >
                  📥 Download
                </button>
                <button className="btn btn-sm btn-light" onClick={closePreview}>
                  ✕
                </button>
              </div>
            </div>
            <div className="preview-body">
              {loadingPreview ? (
                <div className="preview-loading">
                  <div className="spinner-border text-light" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="text-light mt-2">Loading preview...</p>
                </div>
              ) : previewItem.category === 'image' && previewUrl ? (
                <div className="preview-image-container">
                  <img
                    src={previewUrl}
                    alt={previewItem.title}
                    className="preview-image"
                  />
                </div>
              ) : previewItem.category === 'pdf' && previewUrl ? (
                <div className="preview-pdf-container">
                  <iframe
                    src={previewUrl}
                    title={previewItem.title}
                    className="preview-pdf"
                    frameBorder="0"
                  />
                </div>
              ) : (
                <div className="preview-loading">
                  <p className="text-light">Unable to preview this file.</p>
                  <button
                    className="btn btn-primary"
                    onClick={() => handleDownload(previewItem._id, previewItem.fileName)}
                  >
                    📥 Download Instead
                  </button>
                </div>
              )}
            </div>
            {previewItem.description && (
              <div className="preview-footer">
                <small className="text-muted">{previewItem.description}</small>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Resources;