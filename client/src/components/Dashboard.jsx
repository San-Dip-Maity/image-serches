import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";

function Dashboard() {
  const { token, logout } = useAuth();
  const [folders, setFolders] = useState([]);
  const [images, setImages] = useState([]);
  const [currentFolder, setCurrentFolder] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [newFolderName, setNewFolderName] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageName, setImageName] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    fetchFolders();
  }, []);

  const fetchFolders = async () => {
    setLoading(true);
    try {
      const response = await fetch("http://localhost:5000/api/folders/nested", {
        credentials: "include",
        headers: {
          Authorization: `Bearer ${token}`,
          // Add Accept header for explicit JSON response
          Accept: "application/json",
        },
      });

      // Log response details for debugging
      console.log("Response status:", response.status);
      console.log("Response headers:", Object.fromEntries(response.headers));

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.message || `Failed to fetch folders (${response.status})`
        );
      }

      const data = await response.json();
      console.log("Folders data:", data); // Debug log
      setFolders(data);
    } catch (error) {
      console.error("Error fetching folders:", {
        message: error.message,
        token: token ? "Token exists" : "No token",
        stack: error.stack,
      });
      setErrorMessage(`Failed to fetch folders: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchImages = async (folderId) => {
    setLoading(true);
    try {
      const response = await fetch(
        `http://localhost:5000/api/folders/${folderId}/images`,
        {
          credentials: "include",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!response.ok) throw new Error("Failed to fetch images");

      const data = await response.json();
      setImages(data);
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const createFolder = async (parentId = null) => {
    if (!newFolderName.trim()) {
      setErrorMessage("Folder name cannot be empty");
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/api/folders", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: newFolderName, parentId }),
      });
      if (!response.ok) throw new Error("Failed to create folder");

      setNewFolderName("");
      fetchFolders();
    } catch (error) {
      setErrorMessage(error.message);
    }
  };

  const uploadImage = async () => {
    if (!selectedImage || !imageName.trim()) {
      setErrorMessage("Image and name are required");
      return;
    }

    const formData = new FormData();
    formData.append("image", selectedImage);
    formData.append("name", imageName);
    formData.append("folderId", currentFolder);

    try {
      const response = await fetch("http://localhost:5000/api/images", {
        method: "POST",
        credentials: "include",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!response.ok) throw new Error("Failed to upload image");

      setSelectedImage(null);
      setImageName("");
      fetchImages(currentFolder);
    } catch (error) {
      setErrorMessage(error.message);
    }
  };

  const searchImages = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `http://localhost:5000/api/images/search?query=${searchQuery}`,
        {
          credentials: "include",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!response.ok) throw new Error("Search failed");

      const data = await response.json();
      setImages(data);
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const renderFolders = (folderList, parentId = null) => {
    return (
      <ul className="ml-4">
        {folderList.map((folder) => (
          <li key={folder._id} className="mb-2">
            <div
              onClick={() => {
                setCurrentFolder(folder._id);
                fetchImages(folder._id);
              }}
              className={`cursor-pointer p-2 rounded ${
                currentFolder === folder._id
                  ? "bg-blue-200"
                  : "hover:bg-gray-100"
              }`}
            >
              📁 {folder.name}
            </div>

            {/* Render children folders recursively */}
            {folder.children &&
              folder.children.length > 0 &&
              renderFolders(folder.children, folder._id)}

            {/* Add folder button inside each folder */}
            <div className="ml-4 mt-2">
              <button
                onClick={() => createFolder(folder._id)}
                className="text-sm text-blue-600"
              >
                ➕ New Folder
              </button>
            </div>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-6 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 sm:mb-8 space-y-4 sm:space-y-0">
          <h1 className="text-2xl sm:text-3xl font-bold">Image Manager</h1>
          <button
            onClick={logout}
            className="w-full sm:w-auto px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Logout
          </button>
        </div>

        {errorMessage && (
          <div className="mb-4 p-2 bg-red-200 text-red-800 rounded">
            {errorMessage}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-6 md:gap-8">
          {/* Folders Section */}
          <div className="lg:col-span-2 bg-white p-4 rounded-lg shadow">
            <h2 className="text-xl font-bold mb-4">Folders</h2>
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                <input
                  type="text"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="New folder name"
                  className="w-full p-2 border rounded"
                />
                <button
                  onClick={() => createFolder(null)}
                  className="w-full sm:w-auto px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Create Folder
                </button>
              </div>

              {loading ? <p>Loading folders...</p> : renderFolders(folders)}
            </div>
          </div>

          {/* Images Section */}
          <div className="lg:col-span-3 bg-white p-4 rounded-lg shadow">
            <h2 className="text-xl font-bold mb-4">Images</h2>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 mb-4">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search images"
                className="w-full p-2 border rounded"
              />
              <button
                onClick={searchImages}
                className="w-full sm:w-auto px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              >
                Search
              </button>
            </div>

            {loading ? (
              <p>Loading images...</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {images.map((image) => (
                  <div key={image._id} className="p-2 border rounded">
                    <img
                      src={`http://localhost:5000/${image.filePath}`}
                      alt={image.name}
                      className="w-full h-40 object-cover rounded"
                    />
                    <p className="mt-2 text-center text-sm sm:text-base">
                      {image.name}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Upload Image */}
            <div className="mt-6">
              <h3 className="text-lg font-bold mb-2">Upload Image</h3>
              <div className="space-y-2">
                <input
                  type="text"
                  value={imageName}
                  onChange={(e) => setImageName(e.target.value)}
                  placeholder="Image name"
                  className="w-full p-2 border rounded"
                />
                <input
                  type="file"
                  onChange={(e) => setSelectedImage(e.target.files[0])}
                  className="w-full p-2 border rounded"
                />
                <button
                  onClick={uploadImage}
                  className="w-full px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
                >
                  Upload
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
