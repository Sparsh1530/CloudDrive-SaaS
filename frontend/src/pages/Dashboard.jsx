import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  HardDrive, Upload, LogOut, FileText, Trash2, Search, File, 
  Download, Folder as FolderIcon, ChevronRight, RotateCcw, Eye, X, Star, Share2,
  LayoutGrid, List, Users, UploadCloud, Menu
} from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import API from '../api/axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://cloud-drive-saa-s.onrender.com';

export default function Dashboard() {
  const { logout, user } = useAuth();
  const [activeTab, setActiveTab] = useState('drive');
  const [viewMode, setViewMode] = useState('grid');
  const [files, setFiles] = useState([]);
  const [folders, setFolders] = useState([]);
  const [currentFolder, setCurrentFolder] = useState(null);
  const [folderStack, setFolderStack] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [sharePassword, setSharePassword] = useState('');
  const [storageData, setStorageData] = useState({ usedBytes: 0, maxBytes: 524288000 });
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [folderName, setFolderName] = useState('');
  const [previewFileItem, setPreviewFileItem] = useState(null);
  const [shareFileItem, setShareFileItem] = useState(null);
  
  const [shareMode, setShareMode] = useState('user');
  const [targetUserEmail, setTargetUserEmail] = useState('');
  const [userRole, setUserRole] = useState('VIEWER');
  const [generatedShareUrl, setGeneratedShareUrl] = useState('');
  const [expiryDays, setExpiryDays] = useState(7);

  const fetchFiles = async () => {
    try {
      setLoading(true);
      let endpoint = '/files';
      if (activeTab === 'trash') endpoint = '/files/trash';
      else if (activeTab === 'starred') endpoint = '/files/starred';
      else if (activeTab === 'shared') endpoint = '/files/shared-with-me';
      else if (currentFolder) endpoint = `/files?folderId=${currentFolder.id}`;

      const res = await API.get(endpoint);
      setFiles(res.data || []);
    } catch (err) {
      console.error('Failed to fetch files:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchFolders = async () => {
    if (activeTab !== 'drive') return;
    try {
      const endpoint = currentFolder ? `/folders?parentFolderId=${currentFolder.id}` : '/folders';
      const res = await API.get(endpoint);
      setFolders(res.data || []);
    } catch (err) {
      console.error('Failed to fetch folders:', err);
    }
  };

  const fetchStorageUsage = async () => {
    try {
      const res = await API.get('/files/storage-usage');
      if (res.data) setStorageData(res.data);
    } catch (err) {
      console.error('Failed to fetch storage info:', err);
    }
  };

  useEffect(() => {
    fetchFiles();
    fetchFolders();
    fetchStorageUsage();
  }, [currentFolder, activeTab]);

  const uploadFile = async (fileToUpload) => {
    if (!fileToUpload) return;
    const formData = new FormData();
    formData.append('file', fileToUpload);
    if (currentFolder) formData.append('folderId', currentFolder.id);

    try {
      setLoading(true);
      await API.post('/files/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      fetchFiles();
      fetchStorageUsage();
    } catch (err) {
      alert('Upload failed');
    } finally {
      setLoading(false);
    }
  };

  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      uploadFile(acceptedFiles[0]);
    }
  }, [currentFolder]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop, 
    noClick: true,
    disabled: activeTab !== 'drive'
  });

  const handleOpenFolder = (folder) => {
    setFolderStack((prev) => [...prev, folder]);
    setCurrentFolder(folder);
  };

  const handleNavigateBreadcrumb = (index) => {
    if (index === -1) {
      setFolderStack([]);
      setCurrentFolder(null);
    } else {
      const updatedStack = folderStack.slice(0, index + 1);
      setFolderStack(updatedStack);
      setCurrentFolder(updatedStack[updatedStack.length - 1]);
    }
  };

  const handleCreateFolder = async (e) => {
    e.preventDefault();
    if (!folderName) return;
    try {
      await API.post('/folders', { name: folderName, parentFolderId: currentFolder ? currentFolder.id : null });
      setFolderName('');
      setIsFolderModalOpen(false);
      fetchFolders();
    } catch (err) {
      alert('Failed to create folder');
    }
  };

  const handleFileUploadInput = (e) => {
    uploadFile(e.target.files[0]);
  };

  const handleDownload = async (fileId, fileName) => {
    try {
      const response = await API.get(`/files/download/${fileId}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Failed to download file');
    }
  };

  const handleToggleStar = async (id) => {
    try {
      await API.put(`/files/${id}/star`);
      fetchFiles();
    } catch (err) {
      alert('Failed to update star status');
    }
  };

  const handleShareWithUser = async (e) => {
    e.preventDefault();
    try {
      await API.post(`/files/${shareFileItem.id}/share-user?targetEmail=${targetUserEmail}&role=${userRole}`);
      alert(`Successfully shared with ${targetUserEmail} as ${userRole}`);
      setShareFileItem(null);
      setTargetUserEmail('');
    } catch (err) {
      alert('Failed to share with user. Check if user email exists.');
    }
  };

  const handleGenerateShareLink = async (e) => {
    e.preventDefault();
    try {
      const res = await API.post(`/files/${shareFileItem.id}/share?expirationDays=${expiryDays}&password=${sharePassword}`);
      const rawUrl = res.data?.shareUrl || '';
      const formattedUrl = rawUrl.includes('localhost')
        ? rawUrl.replace(/http:\/\/localhost:\d+/, window.location.origin)
        : rawUrl;
      setGeneratedShareUrl(formattedUrl);
      setSharePassword('');
    } catch (err) {
      alert('Failed to generate share link');
    }
  };

  const handleDelete = async (id) => {
    try {
      await API.delete(`/files/${id}`);
      fetchFiles();
      fetchStorageUsage();
    } catch (err) {
      alert('Failed to move to trash');
    }
  };

  const handleRestore = async (id) => {
    try {
      await API.put(`/files/${id}/restore`);
      fetchFiles();
      fetchStorageUsage();
    } catch (err) {
      alert('Failed to restore file');
    }
  };

  const handlePermanentDelete = async (id) => {
    if (!window.confirm("Permanently delete this file? This action cannot be undone.")) return;
    try {
      await API.delete(`/files/${id}/permanent`);
      fetchFiles();
      fetchStorageUsage();
    } catch (err) {
      alert('Failed to permanently delete file');
    }
  };

  const getCleanFileType = (fileName, mimeType) => {
    if (fileName && fileName.includes('.')) {
      return fileName.split('.').pop().toUpperCase();
    }
    if (mimeType && mimeType.includes('/')) {
      const type = mimeType.split('/')[1];
      return type.length > 5 ? 'FILE' : type.toUpperCase();
    }
    return 'FILE';
  };

  const filteredFiles = files.filter((f) => f.name?.toLowerCase().includes(search.toLowerCase()));
  const filteredFolders = folders.filter((f) => f.name?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="flex h-screen bg-[#070913] text-gray-100 font-sans relative overflow-hidden">
      
      {/* Mobile Drawer Backdrop */}
      {sidebarOpen && (
        <div 
          onClick={() => setSidebarOpen(false)} 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden"
        />
      )}

      {/* Sidebar Navigation */}
      <aside className={`fixed md:static inset-y-0 left-0 w-64 bg-[#0d1021]/90 backdrop-blur-xl border-r border-purple-900/20 p-5 flex flex-col justify-between z-40 transition-transform duration-300 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}>
        <div>
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3 text-purple-400 font-extrabold text-xl tracking-tight">
              <div className="p-2 bg-purple-500/10 rounded-xl border border-purple-500/20">
                <HardDrive className="w-6 h-6 text-purple-400" />
              </div>
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-purple-200 to-purple-400">
                CloudDrive
              </span>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="md:hidden text-gray-400 hover:text-white">
              <X size={20} />
            </button>
          </div>

          <div className="flex gap-2 mb-6">
            <label className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white py-2.5 px-3 rounded-xl cursor-pointer font-medium text-sm transition-all shadow-lg shadow-purple-600/20">
              <Upload size={16} /> Upload
              <input type="file" onChange={handleFileUploadInput} className="hidden" />
            </label>
            <button onClick={() => setIsFolderModalOpen(true)} className="px-3 py-2.5 border border-purple-900/40 bg-[#12162e] rounded-xl hover:bg-purple-900/30 text-purple-200 text-sm font-medium transition-all">
              + Folder
            </button>
          </div>

          <nav className="space-y-1.5">
            <button
              onClick={() => { setActiveTab('drive'); handleNavigateBreadcrumb(-1); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeTab === 'drive' ? 'bg-purple-600/20 text-purple-300 font-semibold border border-purple-500/30' : 'text-gray-400 hover:bg-[#12162e] hover:text-gray-200'
              }`}
            >
              <HardDrive size={18} /> My Drive
            </button>
            <button
              onClick={() => { setActiveTab('shared'); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeTab === 'shared' ? 'bg-purple-600/20 text-purple-300 font-semibold border border-purple-500/30' : 'text-gray-400 hover:bg-[#12162e] hover:text-gray-200'
              }`}
            >
              <Users size={18} /> Shared with me
            </button>
            <button
              onClick={() => { setActiveTab('starred'); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeTab === 'starred' ? 'bg-purple-600/20 text-purple-300 font-semibold border border-purple-500/30' : 'text-gray-400 hover:bg-[#12162e] hover:text-gray-200'
              }`}
            >
              <Star size={18} /> Starred
            </button>
            <button
              onClick={() => { setActiveTab('trash'); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeTab === 'trash' ? 'bg-purple-600/20 text-purple-300 font-semibold border border-purple-500/30' : 'text-gray-400 hover:bg-[#12162e] hover:text-gray-200'
              }`}
            >
              <Trash2 size={18} /> Trash
            </button>
          </nav>
        </div>

        <div>
          <div className="mb-4 p-3.5 bg-[#12162e] border border-purple-900/30 rounded-2xl">
            <div className="flex justify-between items-center text-xs text-purple-200/70 mb-2 font-medium">
              <span>Storage</span>
              <span>
                {(storageData.usedBytes / (1024 * 1024)).toFixed(1)} MB / {(storageData.maxBytes / (1024 * 1024)).toFixed(0)} MB
              </span>
            </div>
            <div className="w-full bg-[#070913] h-2 rounded-full overflow-hidden border border-purple-900/20">
              <div 
                className="bg-gradient-to-r from-purple-500 to-indigo-500 h-full transition-all duration-300 rounded-full"
                style={{ width: `${Math.min(100, (storageData.usedBytes / storageData.maxBytes) * 100)}%` }}
              />
            </div>
          </div>

          <div className="text-xs text-gray-500 mb-2 truncate px-1">
            User: {typeof user === 'object' ? user?.email || user?.name : user}
          </div>
          <button onClick={logout} className="w-full flex items-center gap-2 text-rose-400 p-2 hover:bg-rose-500/10 rounded-xl text-sm font-medium transition-colors">
            <LogOut size={18} /> Logout
          </button>
        </div>
      </aside>

      {/* Main Workspace */}
      <main {...getRootProps()} className="flex-1 p-4 md:p-8 overflow-y-auto relative bg-[#090b16]">
        <input {...getInputProps()} />

        {isDragActive && (
          <div className="absolute inset-0 bg-purple-600/15 border-4 border-dashed border-purple-500 rounded-2xl z-40 flex flex-col items-center justify-center backdrop-blur-md m-4">
            <UploadCloud className="w-16 h-16 text-purple-400 mb-2 animate-bounce" />
            <p className="text-lg font-bold text-purple-200">Drop file to upload immediately</p>
          </div>
        )}

        {/* Top Bar Navigation */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center mb-8">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-2 bg-[#12162e] border border-purple-900/30 rounded-xl text-gray-300 hover:text-white"
            >
              <Menu size={20} />
            </button>
            <div className="flex items-center gap-2 text-lg sm:text-xl font-bold text-white">
              <button onClick={() => handleNavigateBreadcrumb(-1)} className="hover:text-purple-400 transition-colors">
                {activeTab === 'drive' ? 'My Drive' : activeTab === 'shared' ? 'Shared with Me' : activeTab === 'starred' ? 'Starred' : 'Trash'}
              </button>
              {activeTab === 'drive' && folderStack.map((folder, index) => (
                <React.Fragment key={folder.id}>
                  <ChevronRight size={18} className="text-gray-500" />
                  <button onClick={() => handleNavigateBreadcrumb(index)} className="hover:text-purple-400 transition-colors">
                    {folder.name}
                  </button>
                </React.Fragment>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="flex items-center bg-[#12162e] p-1 rounded-xl border border-purple-900/30">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-all ${
                  viewMode === 'grid' ? 'bg-purple-600 text-white shadow-sm' : 'text-gray-400 hover:text-white'
                }`}
                title="Grid View"
              >
                <LayoutGrid size={18} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition-all ${
                  viewMode === 'list' ? 'bg-purple-600 text-white shadow-sm' : 'text-gray-400 hover:text-white'
                }`}
                title="List View"
              >
                <List size={18} />
              </button>
            </div>

            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3.5 top-3 text-gray-500" size={18} />
              <input
                type="text"
                placeholder="Search files..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-[#12162e] border border-purple-900/30 rounded-xl text-sm outline-none focus:border-purple-500 text-white placeholder-gray-500 transition-all"
              />
            </div>
          </div>
        </div>

        {/* Folders Row */}
        {activeTab === 'drive' && filteredFolders.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3.5">Folders</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredFolders.map((folder) => (
                <div 
                  key={folder.id} 
                  onClick={() => handleOpenFolder(folder)} 
                  className="bg-[#12162e] p-4 border border-purple-900/30 rounded-2xl shadow-sm hover:shadow-purple-900/20 hover:border-purple-500/50 cursor-pointer transition-all flex items-center gap-3 group"
                >
                  <FolderIcon className="text-amber-400 fill-amber-400/20 group-hover:scale-105 transition-transform" size={24} />
                  <span className="font-semibold text-sm truncate text-gray-200">{folder.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Files Grid/List Explorer */}
        <div>
          {loading ? (
            <div className="text-center py-16 text-gray-500 font-medium">Loading contents...</div>
          ) : filteredFiles.length === 0 && (activeTab !== 'drive' || filteredFolders.length === 0) ? (
            <div className="bg-[#12162e] rounded-2xl border border-purple-900/30 p-16 text-center text-gray-500 mt-4">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-30 text-purple-300" />
              <p className="font-medium text-gray-400">
                {activeTab === 'trash' ? 'Trash is empty.' : activeTab === 'starred' ? 'No starred files.' : activeTab === 'shared' ? 'No files shared with you.' : 'Folder is empty.'}
              </p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredFiles.map((file) => (
                <div key={file.id} className="bg-[#12162e] p-4 border border-purple-900/30 rounded-2xl shadow-sm hover:border-purple-500/50 transition-all flex flex-col justify-between group">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="p-2 bg-purple-500/10 rounded-xl border border-purple-500/20">
                        <File className="text-purple-400" size={22} />
                      </div>
                      <span className="text-[10px] bg-purple-900/30 text-purple-300 border border-purple-800/40 font-bold px-2 py-0.5 rounded-md uppercase tracking-wide">
                        {getCleanFileType(file.name, file.mimeType)}
                      </span>
                    </div>
                    <h3 className="font-semibold text-sm truncate mb-1 text-gray-200" title={file.name}>
                      {file.name}
                    </h3>
                  </div>

                  <div className="flex justify-between items-center text-xs text-gray-500 mt-4 pt-3 border-t border-purple-900/20">
                    <span className="font-medium">{file.sizeBytes ? `${(file.sizeBytes / 1024).toFixed(1)} KB` : 'N/A'}</span>
                    <div className="flex gap-1 items-center text-gray-400">
                      {activeTab !== 'trash' && (
                        <button onClick={() => handleToggleStar(file.id)} className={`p-1.5 rounded-lg hover:bg-purple-900/30 ${file.isStarred ? 'text-amber-400 fill-amber-400' : 'hover:text-amber-400'}`} title="Star File">
                          <Star size={15} />
                        </button>
                      )}
                      {activeTab !== 'trash' ? (
                        <>
                          <button onClick={() => setPreviewFileItem(file)} className="p-1.5 rounded-lg hover:bg-purple-900/30 hover:text-purple-300" title="Preview">
                            <Eye size={15} />
                          </button>
                          <button onClick={() => { setShareFileItem(file); setGeneratedShareUrl(''); }} className="p-1.5 rounded-lg hover:bg-purple-900/30 hover:text-purple-300" title="Share Options">
                            <Share2 size={15} />
                          </button>
                          <button onClick={() => handleDownload(file.id, file.name)} className="p-1.5 rounded-lg hover:bg-purple-900/30 hover:text-purple-300" title="Download">
                            <Download size={15} />
                          </button>
                          <button onClick={() => handleDelete(file.id)} className="p-1.5 rounded-lg hover:bg-rose-500/10 hover:text-rose-400" title="Move to Trash">
                            <Trash2 size={15} />
                          </button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => handleRestore(file.id)} className="p-1.5 rounded-lg hover:bg-emerald-500/10 hover:text-emerald-400" title="Restore">
                            <RotateCcw size={15} />
                          </button>
                          <button onClick={() => handlePermanentDelete(file.id)} className="p-1.5 rounded-lg hover:bg-rose-500/10 hover:text-rose-400" title="Delete Permanently">
                            <Trash2 size={15} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-[#12162e] border border-purple-900/30 rounded-2xl overflow-x-auto shadow-sm">
              <table className="w-full text-left text-sm text-gray-300">
                <thead className="bg-[#0e1124] border-b border-purple-900/30 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3.5">Name</th>
                    <th className="px-5 py-3.5">Type</th>
                    <th className="px-5 py-3.5">Size</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-purple-900/20">
                  {filteredFiles.map((file) => (
                    <tr key={file.id} className="hover:bg-purple-900/10 transition-colors">
                      <td className="px-5 py-3.5 flex items-center gap-3 font-semibold text-gray-200">
                        <File className="text-purple-400" size={18} />
                        <span className="truncate max-w-xs">{file.name}</span>
                      </td>
                      <td className="px-5 py-3.5 uppercase text-xs font-bold text-gray-400">
                        {getCleanFileType(file.name, file.mimeType)}
                      </td>
                      <td className="px-5 py-3.5 text-gray-400 font-medium">
                        {file.sizeBytes ? `${(file.sizeBytes / 1024).toFixed(1)} KB` : 'N/A'}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex justify-end gap-1 items-center text-gray-400">
                          {activeTab !== 'trash' && (
                            <button onClick={() => handleToggleStar(file.id)} className={`p-1.5 rounded-lg hover:bg-purple-900/30 ${file.isStarred ? 'text-amber-400 fill-amber-400' : 'hover:text-amber-400'}`} title="Star">
                              <Star size={15} />
                            </button>
                          )}
                          {activeTab !== 'trash' ? (
                            <>
                              <button onClick={() => setPreviewFileItem(file)} className="p-1.5 rounded-lg hover:bg-purple-900/30 hover:text-purple-300" title="Preview">
                                <Eye size={15} />
                              </button>
                              <button onClick={() => { setShareFileItem(file); setGeneratedShareUrl(''); }} className="p-1.5 rounded-lg hover:bg-purple-900/30 hover:text-purple-300" title="Share Options">
                                <Share2 size={15} />
                              </button>
                              <button onClick={() => handleDownload(file.id, file.name)} className="p-1.5 rounded-lg hover:bg-purple-900/30 hover:text-purple-300" title="Download">
                                <Download size={15} />
                              </button>
                              <button onClick={() => handleDelete(file.id)} className="p-1.5 rounded-lg hover:bg-rose-500/10 hover:text-rose-400" title="Delete">
                                <Trash2 size={15} />
                              </button>
                            </>
                          ) : (
                            <>
                              <button onClick={() => handleRestore(file.id)} className="p-1.5 rounded-lg hover:bg-emerald-500/10 hover:text-emerald-400" title="Restore">
                                <RotateCcw size={15} />
                              </button>
                              <button onClick={() => handlePermanentDelete(file.id)} className="p-1.5 rounded-lg hover:bg-rose-500/10 hover:text-rose-400" title="Delete Permanently">
                                <Trash2 size={15} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Share Modal */}
      {shareFileItem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#12162e] p-6 rounded-2xl w-full max-w-sm border border-purple-900/40 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-white">Share File</h2>
              <button onClick={() => setShareFileItem(null)} className="text-gray-400 hover:text-white p-1 rounded-lg">
                <X size={18} />
              </button>
            </div>
            <p className="text-xs text-purple-200 mb-4 truncate font-medium bg-[#090b16] p-2.5 rounded-xl border border-purple-900/30">{shareFileItem.name}</p>

            <div className="flex border-b border-purple-900/30 mb-4">
              <button
                onClick={() => setShareMode('user')}
                className={`flex-1 py-2 text-xs font-semibold border-b-2 transition-all ${shareMode === 'user' ? 'border-purple-500 text-purple-400' : 'border-transparent text-gray-500'}`}
              >
                With Registered User
              </button>
              <button
                onClick={() => setShareMode('link')}
                className={`flex-1 py-2 text-xs font-semibold border-b-2 transition-all ${shareMode === 'link' ? 'border-purple-500 text-purple-400' : 'border-transparent text-gray-500'}`}
              >
                Public Link
              </button>
            </div>
            
            {shareMode === 'user' ? (
              <form onSubmit={handleShareWithUser}>
                <label className="block text-xs font-semibold text-gray-400 mb-1">User Email</label>
                <input
                  type="email"
                  required
                  placeholder="user@example.com"
                  value={targetUserEmail}
                  onChange={(e) => setTargetUserEmail(e.target.value)}
                  className="w-full bg-[#090b16] border border-purple-900/30 rounded-xl p-2.5 text-sm text-white outline-none mb-3 focus:border-purple-500"
                />
                
                <label className="block text-xs font-semibold text-gray-400 mb-1">Permission Role</label>
                <select
                  value={userRole}
                  onChange={(e) => setUserRole(e.target.value)}
                  className="w-full bg-[#090b16] border border-purple-900/30 rounded-xl p-2.5 text-sm text-white outline-none mb-4 focus:border-purple-500"
                >
                  <option value="VIEWER">Viewer (Read/Download only)</option>
                  <option value="EDITOR">Editor (Upload, Modify, Delete)</option>
                </select>

                <button type="submit" className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:from-purple-500 hover:to-indigo-500 transition-all shadow-md">
                  Share Access
                </button>
              </form>
            ) : !generatedShareUrl ? (
              <form onSubmit={handleGenerateShareLink}>
                <label className="block text-xs font-semibold text-gray-400 mb-1">Expiration (Days)</label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={expiryDays}
                  onChange={(e) => setExpiryDays(e.target.value)}
                  className="w-full bg-[#090b16] border border-purple-900/30 rounded-xl p-2.5 text-sm text-white outline-none mb-3 focus:border-purple-500"
                />

                <label className="block text-xs font-semibold text-gray-400 mb-1">Optional Password</label>
                <input
                  type="password"
                  placeholder="Leave blank for public access"
                  value={sharePassword}
                  onChange={(e) => setSharePassword(e.target.value)}
                  className="w-full bg-[#090b16] border border-purple-900/30 rounded-xl p-2.5 text-sm text-white outline-none mb-4 focus:border-purple-500"
                />

                <button type="submit" className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:from-purple-500 hover:to-indigo-500 transition-all shadow-md">
                  Generate Public Link
                </button>
              </form>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">Public Share URL</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={generatedShareUrl}
                    className="w-full bg-[#090b16] border border-purple-900/30 text-purple-200 rounded-xl p-2.5 text-xs outline-none"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(generatedShareUrl);
                      alert('Copied link to clipboard!');
                    }}
                    className="px-3.5 py-2.5 bg-purple-600 text-white text-xs rounded-xl hover:bg-purple-500 font-semibold whitespace-nowrap"
                  >
                    Copy
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewFileItem && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-[#12162e] rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col overflow-hidden border border-purple-900/40 shadow-2xl">
            <div className="flex justify-between items-center p-4 border-b border-purple-900/30">
              <h3 className="font-semibold text-white truncate">{previewFileItem.name}</h3>
              <button onClick={() => setPreviewFileItem(null)} className="p-1 hover:bg-purple-900/30 rounded-lg text-gray-400">
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-1 p-4 overflow-auto flex items-center justify-center bg-[#090b16]">
              {previewFileItem.mimeType?.startsWith('image/') ? (
                <img src={`${API_BASE_URL}/api/files/${previewFileItem.id}/preview`} alt={previewFileItem.name} className="max-h-[60vh] object-contain rounded-xl" />
              ) : previewFileItem.mimeType === 'application/pdf' ? (
                <iframe src={`${API_BASE_URL}/api/files/${previewFileItem.id}/preview`} title={previewFileItem.name} className="w-full h-[60vh] rounded-xl border border-purple-900/30" />
              ) : (
                <div className="text-center py-12 text-gray-400">
                  <FileText size={48} className="mx-auto mb-2 opacity-30 text-purple-400" />
                  <p className="font-medium text-gray-300">Preview not supported for this file type.</p>
                  <button onClick={() => handleDownload(previewFileItem.id, previewFileItem.name)} className="mt-4 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl text-sm font-semibold hover:from-purple-500 hover:to-indigo-500">
                    Download File
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Folder Modal */}
      {isFolderModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#12162e] p-6 rounded-2xl w-full max-w-xs border border-purple-900/40 shadow-2xl">
            <h2 className="text-lg font-bold text-white mb-4">Create New Folder</h2>
            <form onSubmit={handleCreateFolder}>
              <input
                type="text"
                placeholder="Folder name"
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
                className="w-full bg-[#090b16] border border-purple-900/30 rounded-xl p-2.5 text-sm text-white outline-none mb-4 focus:border-purple-500"
                autoFocus
              />
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setIsFolderModalOpen(false)} className="px-3.5 py-2 text-sm font-medium text-gray-400 hover:bg-purple-900/30 rounded-xl">
                  Cancel
                </button>
                <button type="submit" className="px-3.5 py-2 text-sm font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-500 hover:to-indigo-500">
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}